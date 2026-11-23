<h1 align="center">LLM Atlas</h1>
<p align="center"><b>大模型论文与工程实现索引，按工程链路组织。</b></p>

<p align="center">
  <img src="assets/hero.png" alt="LLM Atlas：70 篇论文、30 篇精读、21 个架构图、5 个方向" width="760">
</p>

<p align="center">
  <a href="https://note.ossradar.top">站点</a> ·
  <a href="https://note.ossradar.top/papers.html">论文解读</a> ·
  <a href="https://note.ossradar.top/topics.html">专题</a> ·
  <a href="https://note.ossradar.top/arch/index.html">架构图</a>
</p>

一份**按工程链路组织**的大模型资料索引，不是链接收藏夹。

每条记录回答四件事：这项工作解决什么问题、核心做法一句话、代价是什么、去哪里读原始材料。
论文条目连到 arXiv，工程条目连到仓库，本站自己的解读连到 [note.ossradar.top](https://note.ossradar.top)。

**抽走看主线：**

| 方向 | 你在解决的问题 | 入口 |
| --- | --- | --- |
| 推理加速 | 同样的卡，怎么让每个 token 更便宜 | [跳转](#推理加速) |
| 模型架构 | 同一批开源权重，结构差在哪 | [跳转](#模型架构) |
| 训练与后训练 | 从基座到可用，中间要做什么 | [跳转](#训练与后训练) |
| 数据与评测 | 怎么判断一个模型真的变好了 | [跳转](#数据与评测) |
| Agent 与工具 | 怎么让模型去调用外部世界 | [跳转](#agent-与工具) |
| 读论文的方法 | 一份解读是怎么写出来的 | [跳转](#怎么读) |

<sub>本项目只做索引与导读，不转载论文正文。论文版权归原作者，仓库版权归各仓库所有者。</sub>

---

# 推理加速

落点永远是两个量：**每步耗时**和**每步能出几个 token**。这一层所有的论文都在动其中一个。

## 投机解码 · Speculative Decoding

小模型猜、大模型验，猜对了就白赚。难点全在「猜得准」和「验得省」之间怎么平衡。

| 工作 | 一句话 | 代价 | 原始材料 |
| --- | --- | --- | --- |
| Speculative Decoding | 用草稿模型猜 γ 个 token，目标模型一次前向并行验证 | 需要额外一个模型 | [arXiv 2211.17192](https://arxiv.org/abs/2211.17192) |
| Medusa | 不换模型，在目标模型上加多个解码头并行出候选 | 头要训练，候选偏保守 | [arXiv 2401.10774](https://arxiv.org/abs/2401.10774) |
| Lookahead Decoding | 用 Jacobi 迭代并行生成 n-gram 候选，不需要草稿模型 | 候选命中率随任务波动 | [arXiv 2402.02057](https://arxiv.org/abs/2402.02057) |
| EAGLE | 在**特征层**做自回归，草稿复用目标模型的隐状态 | 需要接入目标模型内部 | [arXiv 2401.15077](https://arxiv.org/abs/2401.15077) · [本站解读](https://note.ossradar.top/papers/eagle.html) |
| EAGLE-2 | 草稿树形状由上下文动态决定，不再固定 | 树管理的额外开销 | [arXiv 2406.16858](https://arxiv.org/abs/2406.16858) · [本站解读](https://note.ossradar.top/papers/eagle2.html) |
| EAGLE-3 | 拆掉特征预测约束，加速比开始随训练数据增长 | 训练成本上升 | [arXiv 2503.01840](https://arxiv.org/abs/2503.01840) · [本站解读](https://note.ossradar.top/papers/eagle3.html) |
| SpecInfer | 用树形候选 + token 树验证，一次验证多条路径 | 验证器实现复杂 | [arXiv 2305.09781](https://arxiv.org/abs/2305.09781) |
| Sequoia | 把树形解码做成对硬件拓扑友好的确定性算法 | 依赖具体硬件参数 | [arXiv 2402.12374](https://arxiv.org/abs/2402.12374) |

> 本站这一专题有 **30 篇**精读，覆盖 2026 年的并行草稿系列（DFlash / DSpark / DSpine / Domino / AngelSpec …），
> 每篇都带架构图和逐节拆解：[投机解码专题](https://note.ossradar.top/topics/speculative-decoding.html)

## 注意力与算子

| 工作 | 一句话 | 代价 | 原始材料 |
| --- | --- | --- | --- |
| FlashAttention | 按 IO 复杂度重排注意力计算，不落中间矩阵 | 需要手写 CUDA | [arXiv 2205.14135](https://arxiv.org/abs/2205.14135) |
| FlashAttention-2 | 改并行划分与工作切分，把 GPU 利用率吃满 | 同上 | [arXiv 2307.08691](https://arxiv.org/abs/2307.08691) |
| FlashAttention-3 | 针对 Hopper 的异步流水与低精度做专门优化 | 绑定新架构 | [arXiv 2407.08608](https://arxiv.org/abs/2407.08608) |
| Mamba | 选择性状态空间，序列长度线性复杂度 | 生态与工具链不如 Transformer 成熟 | [arXiv 2312.00752](https://arxiv.org/abs/2312.00752) |
| Ring Attention | 沿序列维切分并在环上传递 KV，支持超长上下文 | 通信量大 | [arXiv 2310.01889](https://arxiv.org/abs/2310.01889) |
| Infini-attention | 把压缩记忆塞进注意力，做无限上下文 | 长程细节有损 | [arXiv 2404.07143](https://arxiv.org/abs/2404.07143) |

工程实现：[Dao-AILab/flash-attention](https://github.com/Dao-AILab/flash-attention) ·
[triton-lang/triton](https://github.com/triton-lang/triton) ·
[state-spaces/mamba](https://github.com/state-spaces/mamba)

## KV Cache 与显存

推理的显存大头不是权重，是 KV cache。这一组都在动它。

| 工作 | 一句话 | 代价 | 原始材料 |
| --- | --- | --- | --- |
| PagedAttention / vLLM | 把 KV cache 按页管理，消除碎片、支持共享前缀 | 实现复杂度高 | [arXiv 2309.06180](https://arxiv.org/abs/2309.06180) |
| Multi-Query Attention | 多个头共享一份 K/V，直接砍掉 KV 体积 | 质量略降 | [arXiv 1911.02150](https://arxiv.org/abs/1911.02150) |
| Grouped-Query Attention | MQA 与 MHA 之间的折中，主流开源模型的默认选择 | — | [arXiv 2305.13245](https://arxiv.org/abs/2305.13245) |
| H₂O | 按「重击者」保留少量 KV，其余淘汰 | 长依赖场景会丢信息 | [arXiv 2306.14048](https://arxiv.org/abs/2306.14048) |
| StreamingLLM | 保住开头的 attention sink，窗口滚动 | 中间内容会遗忘 | [arXiv 2309.17453](https://arxiv.org/abs/2309.17453) |
| Scissorhands | 依据重要性假设做 KV 压缩 | 需要重要性估计 | [arXiv 2305.17118](https://arxiv.org/abs/2305.17118) |
| vAttention | 不用 PagedAttention 也能动态管理 KV | 依赖底层虚拟内存能力 | [arXiv 2405.04437](https://arxiv.org/abs/2405.04437) |
| DMC (Dynamic Memory Compression) | 训练期就学出压缩策略，事后不用改 | 要重训 | [arXiv 2403.09636](https://arxiv.org/abs/2403.09636) |

工程实现：[vllm-project/vllm](https://github.com/vllm-project/vllm) ·
[lmcache/LMCache](https://github.com/lmcache/LMCache)

## 服务与调度

单请求优化到头之后，收益来自「怎么把请求排在一起」。

| 工作 | 一句话 | 代价 | 原始材料 |
| --- | --- | --- | --- |
| Continuous Batching (Orca) | 迭代级调度，请求不再等整批 | 论文未公开在 arXiv | [论文页](https://www.usenix.org/conference/osdi22/presentation/yu) |
| SGLang | 结构化程序执行 + RadixAttention 复用前缀 | 需要按它的 DSL 写 | [arXiv 2312.07104](https://arxiv.org/abs/2312.07104) |
| SARATHI | 把 decode 搭在 chunked prefill 上，提高整批利用率 | 首 token 延迟略增 | [arXiv 2308.16369](https://arxiv.org/abs/2308.16369) |
| DistServe | prefill 与 decode 拆到不同卡上，各自优化 | 跨节点传 KV | [arXiv 2401.09670](https://arxiv.org/abs/2401.09670) |
| Splitwise | 按阶段拆分机器，机器配置各取所需 | 同上 | [arXiv 2311.18677](https://arxiv.org/abs/2311.18677) |
| Mooncake | 以 KV cache 为中心的分离式架构 | 工程量大 | [arXiv 2407.00079](https://arxiv.org/abs/2407.00079) |

工程实现：[vllm-project/vllm](https://github.com/vllm-project/vllm) ·
[sgl-project/sglang](https://github.com/sgl-project/sglang) ·
[NVIDIA/TensorRT-LLM](https://github.com/NVIDIA/TensorRT-LLM) ·
[ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) ·
[mlc-ai/mlc-llm](https://github.com/mlc-ai/mlc-llm) ·
[ollama/ollama](https://github.com/ollama/ollama)
国产硬件：[vllm-project/vllm-ascend](https://github.com/vllm-project/vllm-ascend)

## 量化与压缩

| 工作 | 一句话 | 代价 | 原始材料 |
| --- | --- | --- | --- |
| LLM.int8() | 用分位数量化处理离群值，8bit 推理不掉点 | 速度收益有限 | [arXiv 2208.07339](https://arxiv.org/abs/2208.07339) |
| SmoothQuant | 把激活的量化难度搬到权重上，W8A8 可用 | 需要校准数据 | [arXiv 2211.10438](https://arxiv.org/abs/2211.10438) |
| GPTQ | 逐层二阶误差补偿的后训练量化 | 校准集依赖 | [arXiv 2210.17323](https://arxiv.org/abs/2210.17323) |
| AWQ | 保护显著通道的激活感知权重量化 | 同上 | [arXiv 2306.00978](https://arxiv.org/abs/2306.00978) |
| 1-bit LLM (BitNet b1.58) | 权重三值化，矩阵乘法变加法 | 需要从头训练 | [arXiv 2402.17764](https://arxiv.org/abs/2402.17764) |
| Wanda | 按权重×激活的模长剪枝，无需重训 | 稀疏推理要内核支持 | [arXiv 2306.11695](https://arxiv.org/abs/2306.11695) |

工程实现：[bitsandbytes-foundation/bitsandbytes](https://github.com/bitsandbytes-foundation/bitsandbytes)

---

# 模型架构

同一批开源权重，结构上到底差在哪。读懂结构才看得懂推理和训练的成本曲线。

## 位置编码与长上下文

| 工作 | 一句话 | 代价 | 原始材料 |
| --- | --- | --- | --- |
| RoPE | 旋转位置编码，成为几乎所有开源模型的标准 | — | [arXiv 2104.09864](https://arxiv.org/abs/2104.09864) |
| YaRN | 对 RoPE 做插值 + 温度缩放，低成本扩上下文 | 极长输入仍会退化 | [arXiv 2309.00071](https://arxiv.org/abs/2309.00071) |
| Lost in the Middle | 长上下文的真实表现：中间信息利用率最低 | 这是评测结论 | [arXiv 2307.03172](https://arxiv.org/abs/2307.03172) |

## MoE 与稀疏专家

| 工作 | 一句话 | 代价 | 原始材料 |
| --- | --- | --- | --- |
| Switch Transformer | 每 token 只走一个专家，把稀疏化做到极致 | 训练不稳定 | [arXiv 2101.03961](https://arxiv.org/abs/2101.03961) |
| DeepSeekMoE | 更细粒度专家 + 共享专家，提升专业化 | 路由复杂 | [arXiv 2401.06066](https://arxiv.org/abs/2401.06066) |
| Mixtral | 8×7B 稀疏 MoE 的开源落地，验证了效果 | 显存需求不低 | [arXiv 2401.04088](https://arxiv.org/abs/2401.04088) |
| LocMoE | 降低 MoE 训练中的通信开销 | 绑定集群拓扑 | [arXiv 2401.13920](https://arxiv.org/abs/2401.13920) |

## 开源模型谱系

按时间读，能看出设计选择的取舍。

| 模型 | 关键点 | 原始材料 |
| --- | --- | --- |
| LLaMA | 小模型 + 多 token 训练，开源生态的起点 | [arXiv 2302.13971](https://arxiv.org/abs/2302.13971) |
| Llama 2 | 加入对话对齐与安全训练 | [arXiv 2307.09288](https://arxiv.org/abs/2307.09288) |
| Llama 3 | 15T token 训练 + GQA，工程细节全集 | [arXiv 2407.21783](https://arxiv.org/abs/2407.21783) |
| Mistral 7B | 滑动窗口注意力 + GQA 的小模型样板 | [arXiv 2310.06825](https://arxiv.org/abs/2310.06825) |
| BLOOM | 176B 多语言开源模型的完整训练记录 | [arXiv 2211.05100](https://arxiv.org/abs/2211.05100) |
| DeepSeek-V3 | MLA + 细粒度 MoE 的系统级实现 | 见 [deepseek-ai/DeepSeek-V3](https://github.com/deepseek-ai/DeepSeek-V3) |
| Qwen3 | 当前主流的开源基座与尺寸谱系 | [QwenLM/Qwen3](https://github.com/QwenLM/Qwen3) |

## 多模态

| 工作 | 一句话 | 原始材料 |
| --- | --- | --- |
| LLaVA | 视觉指令微调，把图像接进对话模型 | [arXiv 2304.08485](https://arxiv.org/abs/2304.08485) |

---

# 训练与后训练

从基座到可用，中间要做什么。

## 微调

| 工作 | 一句话 | 代价 | 原始材料 |
| --- | --- | --- | --- |
| LoRA | 冻结原权重，只训低秩旁路 | 容量有限 | [arXiv 2106.09685](https://arxiv.org/abs/2106.09685) |
| QLoRA | 4bit 量化基座 + LoRA，单卡能微调大模型 | 速度较慢 | [arXiv 2305.14314](https://arxiv.org/abs/2305.14314) |
| Self-Instruct | 用模型自己生成指令数据 | 需要过滤 | [arXiv 2212.10560](https://arxiv.org/abs/2212.10560) |

工程实现：[hiyouga/LlamaFactory](https://github.com/hiyouga/LlamaFactory) ·
[huggingface/peft](https://github.com/huggingface/peft) ·
[unslothai/unsloth](https://github.com/unslothai/unsloth)

## 对齐与偏好优化

| 工作 | 一句话 | 代价 | 原始材料 |
| --- | --- | --- | --- |
| InstructGPT | RLHF 三阶段范式的确立 | 需要奖励模型 + PPO | [arXiv 2203.02155](https://arxiv.org/abs/2203.02155) |
| DPO | 跳过奖励模型，直接用偏好对做分类式优化 | 依赖偏好数据质量 | [arXiv 2305.18290](https://arxiv.org/abs/2305.18290) |
| Constitutional AI | 用一套原则让模型自我批评，减少人工标注 | 原则设计要花功夫 | [arXiv 2212.08073](https://arxiv.org/abs/2212.08073) |
| KTO | 只要「好/坏」二元反馈，不需要成对比较 | 信息量少于成对偏好 | [arXiv 2402.01306](https://arxiv.org/abs/2402.01306) |
| Tulu 3 | 后训练全流程的开放复现 | 数据与算力门槛 | [arXiv 2411.15124](https://arxiv.org/abs/2411.15124) |

## 强化学习与推理能力

| 工作 | 一句话 | 代价 | 原始材料 |
| --- | --- | --- | --- |
| DeepSeek-R1 | 用可验证奖励的 RL 逼出推理链，无需过程标注 | 训练成本高 | [arXiv 2501.12948](https://arxiv.org/abs/2501.12948) |
| s1 | 1000 条样本 + test-time scaling 的极简复现 | 适用面窄 | [arXiv 2501.19393](https://arxiv.org/abs/2501.19393) |

工程实现：[verl-project/verl](https://github.com/verl-project/verl) ·
[OpenRLHF/OpenRLHF](https://github.com/OpenRLHF/OpenRLHF)

## 分布式训练

| 工作 | 一句话 | 原始材料 |
| --- | --- | --- |
| ZeRO | 把优化器状态/梯度/参数分片，降低单卡显存 | [deepspeedai/DeepSpeed](https://github.com/deepspeedai/DeepSpeed) |
| Megatron-LM | 张量并行 + 流水线并行的标准实现 | [NVIDIA/Megatron-LM](https://github.com/NVIDIA/Megatron-LM) |
| Lion | 用符号运算替代动量的优化器，省显存 | [arXiv 2302.06675](https://arxiv.org/abs/2302.06675) |

---

# 数据与评测

## 训练数据

| 工作 | 一句话 | 原始材料 |
| --- | --- | --- |
| FineWeb | 网络语料清洗的全流程与数据集 | [arXiv 2406.17557](https://arxiv.org/abs/2406.17557) |
| DataComp-LM | 数据筛选方法的系统性对比 | [arXiv 2406.11794](https://arxiv.org/abs/2406.11794) |

## 评测

| 基准 | 测什么 | 原始材料 |
| --- | --- | --- |
| MMLU | 57 个学科的知识选择题 | [arXiv 2009.03300](https://arxiv.org/abs/2009.03300) |
| MT-Bench / Chatbot Arena | 用模型评判模型，以及众包对战 | [arXiv 2306.05685](https://arxiv.org/abs/2306.05685) |
| SWE-bench | 真实 GitHub issue 的修复能力 | [arXiv 2310.06770](https://arxiv.org/abs/2310.06770) |
| HELM | 多维度整体评测框架 | [arXiv 2211.09110](https://arxiv.org/abs/2211.09110) |

工具：[EleutherAI/lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) ·
[open-compass/opencompass](https://github.com/open-compass/opencompass) ·
[huggingface/lighteval](https://github.com/huggingface/lighteval) ·
[evalplus/evalplus](https://github.com/evalplus/evalplus)

## 评测这件事本身的问题

这几篇读的是「我们以为的进步是不是真的」。

| 工作 | 结论 | 原始材料 |
| --- | --- | --- |
| Are Emergent Abilities a Mirage? | 涌现能力可能只是指标选择造成的 | [arXiv 2304.15004](https://arxiv.org/abs/2304.15004) |
| Easy Data for Hard Tasks | 简单数据训练在难任务上反而更有效 | [arXiv 2401.06751](https://arxiv.org/abs/2401.06751) |
| Sycophancy | 模型会迎合用户的错误观点 | [arXiv 2310.13548](https://arxiv.org/abs/2310.13548) |

---

# Agent 与工具

| 工作 | 一句话 | 原始材料 |
| --- | --- | --- |
| ReAct | 推理与行动交替，Agent 的基本循环 | [arXiv 2210.03629](https://arxiv.org/abs/2210.03629) |
| Toolformer | 模型自学何时调用哪个工具 | [arXiv 2302.04761](https://arxiv.org/abs/2302.04761) |
| Reflexion | 用语言化的自我反思改进后续尝试 | [arXiv 2303.11366](https://arxiv.org/abs/2303.11366) |
| Self-Discover | 让模型自己组合推理结构 | [arXiv 2402.03620](https://arxiv.org/abs/2402.03620) |

工具：[THUDM/AgentBench](https://github.com/THUDM/AgentBench) ·
[simonw/llm](https://github.com/simonw/llm)

---

# 怎么读

单一视角读论文容易读成摘要。本站的解读按固定流程产出：先抽事实表（论文里每个数字、每张表都结构化），
再写大纲，再成文，最后用机器把正文里每个数字回查到事实表——查不到就不许发表。

这套流程本身也是开源的：[paper-to-post](https://github.com/wanggdnju/paper-to-post)。

读一篇论文时，值得问的四件事：

1. **它在优化哪个量？** 延迟、吞吐、显存、还是准确率——很多争论其实在比不同的东西。
2. **代价写在哪？** 没有代价的方法通常意味着代价被藏在了别处。
3. **实验是在什么条件下做的？** batch size、序列长度、硬件，换一个可能结论就反了。
4. **数字能不能对上原表？** 如果一个结论依赖某个倍数，去论文原表里找那个格子。

## 本站的解读

- [论文解读索引](https://note.ossradar.top/papers.html) —— 30 篇，每篇带事实表与逐节拆解
- [专题体系](https://note.ossradar.top/topics.html) —— 按方向与专题两级组织
- [架构图](https://note.ossradar.top/arch/index.html) —— 21 个可交互的单文件架构图

---

## 贡献

发现链接失效、编号写错、或者某篇该收而未收，直接开 issue。这个仓库只做索引，
所以每条都会实际打开验证——提交时请附上 arXiv 或仓库地址。

## 许可

本仓库的索引文本用 MIT。论文与仓库的版权归各自作者。
