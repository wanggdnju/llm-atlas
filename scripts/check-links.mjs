#!/usr/bin/env node
/**
 * 校验 README 里所有链接（以及每个 arXiv 编号对应的标题）。
 *
 *   node scripts/check-links.mjs [--offline]
 *
 * 为什么需要这个脚本：这份仓库的全部价值就是「每条链接真能打开」。
 * 索引类仓库最典型的死法不是没人看，而是三个月后一半链接失效、
 * 读者点进去发现东西不对，然后再也不来。
 *
 * `--offline` 只做静态检查（arXiv 编号格式、重复条目、锚点），不发网络请求——
 * CI 跑全量，本地改完先跑 offline 图个快。
 *
 * 退出码 0 = 全部通过，1 = 有问题。问题按严重程度分两类：
 *   错误：链接打不开、arXiv 编号解析不到论文、README 里同一篇收了两遍
 *   提醒：能打开但发生了重定向（仓库改名了，应该直接写新地址）
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import process from 'node:process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const offline = process.argv.includes('--offline');

const md = readFileSync(join(ROOT, 'README.md'), 'utf8');

// ---- 收集 ----
const urlRe = /\]\((https?:\/\/[^)\s]+)\)/g;
const urls = [...new Set([...md.matchAll(urlRe)].map((m) => m[1]))];
const arxivIds = [...new Set(urls.filter((u) => u.includes('arxiv.org/abs/'))
  .map((u) => u.replace(/v\d+$/, '').split('/abs/')[1]))];
const otherUrls = urls.filter((u) => !u.includes('arxiv.org/abs/'));
const anchors = [...new Set([...md.matchAll(/\]\(#([^)]+)\)/g)].map((m) => m[1]))];

const errors = [];
const warnings = [];
const titles = [];

// ---- 静态检查 ----
// 1) arXiv 编号格式：YYMM.NNNNN 或 YYMM.NNNN（老编号）
const badId = arxivIds.filter((id) => !/^\d{4}\.\d{4,5}$/.test(id));
if (badId.length) errors.push(`arXiv 编号格式不对：${badId.join('、')}`);

// 2) 同一个 arXiv 编号收了两遍（不同小节重复收录是最常见的编辑事故）
const seen = new Map();
for (const m of md.matchAll(urlRe)) {
  const u = m[1];
  if (!u.includes('arxiv.org/abs/')) continue;
  const id = u.replace(/v\d+$/, '').split('/abs/')[1];
  seen.set(id, (seen.get(id) ?? 0) + 1);
}
const dup = [...seen].filter(([, n]) => n > 1).map(([id]) => id);
if (dup.length) errors.push(`同一个 arXiv 编号出现多次：${dup.join('、')}`);

// 3) 目录里的锚点必须真的有对应标题
const headings = [...md.matchAll(/^#{1,6}\s+(.+)$/gm)]
  .map((m) => m[1].trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-'));
const missingAnchor = anchors.filter((a) => !headings.includes(a.toLowerCase()));
if (missingAnchor.length) errors.push(`目录锚点找不到对应标题：${missingAnchor.join('、')}`);

// ---- 联网检查 ----
async function head(url, timeout = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: ctrl.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (link-checker for llm-atlas index)' },
    });
    return { status: r.status, location: r.headers.get('location') };
  } catch (e) {
    return { status: 0, error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Node 的 fetch 走系统解析器，个别域名在这台机器上解析不到（实测 usenix.org），
 * 而 curl / python 的解析器可以。这种情况不能判成「链接坏了」——读者点开是好的。
 * 所以 fetch 失败时降级用 curl 复核一次，仍然失败才算错。
 */
async function viaCurl(url) {
  const { execFile } = await import('node:child_process');
  return new Promise((resolve) => {
    execFile('curl', ['-sS', '-o', '/dev/null', '-w', '%{http_code}', '-m', '25',
      '-A', 'Mozilla/5.0 (link-checker)', url], { encoding: 'utf8' },
    (err, out) => {
      const code = Number(String(out).trim());
      // curl 的退出码 6 = 解析失败；这时才真的算「打不开」
      resolve({ status: Number.isFinite(code) && code > 0 ? code : 0,
        error: err && !code ? `curl 失败（${err.code ?? '?'}）` : undefined });
    });
  });
}

if (!offline) {
  // 普通链接：2xx 通过，3xx 提醒「该换成最终地址」，4xx/5xx 算错。
  // arXiv 会挡掉没有 UA 的请求、也会偶发限流，所以失败重试一次。
  for (const u of otherUrls) {
    let r = await head(u);
    if (r.status === 0 || r.status === 429 || r.status >= 500) r = await head(u);
    if (r.status === 0) {
      const c = await viaCurl(u);
      if (c.status >= 200 && c.status < 400) {
        warnings.push(`${u}（Node 解析不到该域名，curl 可访问，已放行）`);
        continue;
      }
      r = c;
    }
    if (r.status >= 200 && r.status < 300) continue;
    if (r.status >= 300 && r.status < 400) {
      warnings.push(`${u} → ${r.location}（写最终地址，别依赖重定向）`);
    } else {
      errors.push(`${u} 打不开（${r.status || r.error}）`);
    }
  }

  // arXiv 逐条抓 abs 页面，既验证编号存在、又能读出 `[编号] 标题` 供人核对——
  // 写错一位编号是最容易发生的事。**不用 export API**：它对匿名请求限流很紧
  // （实测 429 Rate exceeded），而 abs 页面是读者真正会点开的那一页，验证更贴近事实。
  for (const id of arxivIds) {
    const u = `https://arxiv.org/abs/${id}`;
    let title = '';
    for (let attempt = 0; attempt < 3 && !title; attempt += 1) {
      try {
        const r = await fetch(u, {
          signal: AbortSignal.timeout(30000),
          headers: { 'user-agent': 'Mozilla/5.0 (link-checker for llm-atlas index)' },
        });
        if (r.status === 200) {
          const html = await r.text();
          title = (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').replace(/\s+/g, ' ').trim();
        }
      } catch { /* 重试 */ }
      if (!title) await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
    }
    if (!title) errors.push(`arXiv ${id} 打不开（${u}）`);
    else if (!title.includes(id)) errors.push(`arXiv ${id} 页面标题不是这篇：${title.slice(0, 80)}`);
    else titles.push(`${id}  ${title.replace(/^\[\d+\.\d+\]\s*/, '').slice(0, 88)}`);
    await new Promise((res) => setTimeout(res, 1200));   // 别把 arXiv 打急了
  }
}

// ---- 报告 ----
console.log(`链接 ${urls.length} 个（arXiv ${arxivIds.length}、其它 ${otherUrls.length}）`);
if (warnings.length) {
  console.log(`\n提醒 ${warnings.length} 条：`);
  for (const w of warnings) console.log(`  ⚠️  ${w}`);
}
if (errors.length) {
  console.log(`\n✗ ${errors.length} 个问题：`);
  for (const e of errors) console.log(`  ❌ ${e}`);
  process.exit(1);
}
if (!offline && titles.length) {
  console.log(`\narXiv 编号与标题（确认对得上）：`);
  for (const t of titles) console.log(`  ${t}`);
}
console.log(offline ? '\n✓ 静态检查通过（未联网）' : '\n✓ 全部链接可访问');
