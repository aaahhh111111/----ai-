# 架构设计文档

## 1. 背景与目标

企业知识分散在文档、对话、代码等载体中，难以复用。本平台通过 **生产 → 管理 → 消费** 三层架构，让人与 Agent 共同参与知识的流转，并提供 RAG 增强的智能服务。

## 2. 总体架构

```mermaid
flowchart TB
  subgraph UI["前端 (Next.js App Router)"]
    P1[概览]
    P2[知识管理]
    P3[知识生产]
    P4[专家对话]
    P5[Agent/Skill]
    P6[热度统计]
  end

  subgraph API["API 层"]
    K[/api/knowledge]
    S[/api/search]
    I[/api/import]
    C[/api/chat]
    A[/api/agents]
    SK[/api/skill/export]
    ST[/api/stats]
  end

  subgraph Core["核心服务"]
    DB[(SQLite)]
    SRCH[混合检索]
    AI[OpenAI 兼容]
  end

  UI --> API
  API --> DB
  C --> SRCH
  SRCH --> AI
  I --> AI
  C --> AI
```

## 3. 数据模型

| 实体 | 说明 |
|------|------|
| `Knowledge` | 知识条目：标题、正文、标签、状态、来源、向量 embedding |
| `Agent` | 专家 Agent：名称、系统提示词、标签过滤 |
| `ChatSession` / `ChatMessage` | 对话会话与消息 |
| `UsageLog` | 操作日志：检索、浏览、对话等 |

知识来源枚举：`MANUAL` | `IMPORT` | `AI_EXTRACT` | `CHAT_LEARN`

## 4. 检索方案

采用 **混合检索（Hybrid）**：

1. **关键词**：标题权重 > 标签 > 正文，支持分词加分
2. **语义**：对查询与知识条目生成 embedding，余弦相似度排序
3. 未配置 AI 时仅启用关键词分支

创建/更新知识时异步写入 embedding，供语义检索使用。

## 5. RAG 对话流程

1. 用户发送问题
2. 混合检索 Top-K 可用知识（可按 Agent 标签过滤）
3. 将片段拼入 System Prompt
4. 调用大模型生成回答
5. 返回引用来源；可选「对话沉淀」写入新知识

## 6. 知识消费形式

| 方式 | 实现 |
|------|------|
| 方式一 | `/chat` 专家 Agent 对话 |
| 方式二 | `/api/skill/export` 导出 Markdown Skill |
| 方式三 | REST API 供外部 Agent 调用（与上述 API 共用） |

## 7. 部署与扩展

- 当前：单机 SQLite，适合 Demo 与答辩
- 扩展：PostgreSQL + pgvector、对象存储（图片）、Redis 缓存、独立向量库

## 8. 安全说明（答辩可提及）

- API Key 仅存于服务端环境变量
- 生产环境需增加鉴权、审计日志与敏感知识脱敏
