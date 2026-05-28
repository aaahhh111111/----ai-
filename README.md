# AI 知识库管理平台

集团信息系统部（CIS）课题：**AI 知识库管理平台** 可本地运行的完整 Demo。

## 项目介绍

面向企业与 Agent 的知识全生命周期平台，覆盖：

| 能力层 | 功能 |
|--------|------|
| **知识生产** | 手动录入、文档/图片导入、AI 自动提炼、对话自动沉淀 |
| **知识管理** | CRUD、标签/分类、可用/不可用状态、关键词+语义混合检索 |
| **知识消费** | RAG 专家 Agent 对话、一键生成 Agent、导出 Cursor Skill |

## 技术栈

- **前端**：Next.js 15、React 19、TypeScript、Tailwind CSS 4
- **后端**：Next.js API Routes
- **数据库**：SQLite + Prisma ORM
- **AI**：OpenAI 兼容 API（火山引擎 / OpenAI / 百炼等均可）

## 快速启动

### 环境要求

- Node.js 18+
- npm

### 安装与运行

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
npm run db:push
npm run db:seed

# 3. 启动开发服务
npm run dev
```

浏览器访问：**http://localhost:3000**

### 配置 AI（可选）

复制 `.env.example` 为 `.env` 并填写：

```env
OPENAI_API_KEY=your-key
OPENAI_BASE_URL=https://api.openai.com/v1   # 火山/百炼等改为对应地址
OPENAI_MODEL=gpt-4o-mini
```

未配置 API Key 时进入**演示模式**：检索仍可用，对话返回模板提示。

## 架构说明

详见 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)。

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  知识生产    │────▶│  SQLite + Prisma │◀────│  知识管理    │
│ 录入/导入/AI │     │  Knowledge/Agent │     │ CRUD/检索   │
└─────────────┘     └────────┬─────────┘     └─────────────┘
                             │
                    ┌────────▼────────┐
                    │   知识消费层     │
                    │ RAG Chat / Skill│
                    └─────────────────┘
```

## 功能与课题要求对照

### 基础要求

- [x] 知识创建、编辑、删除
- [x] 检索：关键词 / 语义 / 混合 + 状态筛选
- [x] 知识状态：可用 / 不可用
- [x] 智能服务：专家 Agent 对话 + Skill 导出

### 加分项

- [x] 对话自动提炼新知识（开启「对话沉淀」）
- [x] 多模态：图片文件导入记录
- [x] 使用热度统计与可视化
- [x] 一键生成专家 Agent 并完成问答

## 分工说明（示例，请按团队实际修改）

| 成员 | 职责 |
|------|------|
| 成员 A | 数据模型、API、检索与 RAG |
| 成员 B | 管理端页面、知识生产流程 |
| 成员 C | 对话消费、Agent/Skill、统计看板 |
| 全员 | README、架构文档、答辩演示脚本 |

## 常用命令

```bash
npm run dev      # 开发
npm run build    # 构建
npm run start    # 生产启动
npm run lint     # 代码检查
```

## 答辩演示建议

1. **概览**：展示能力对照与示例数据
2. **知识管理**：新建一条知识 → 混合检索
3. **知识生产**：粘贴文本 AI 提炼入库
4. **专家对话**：提问采购/入职问题，展示引用来源
5. **Agent**：一键生成采购专家 → 导出 Skill
6. **统计**：展示热度图表

## License

课题 Demo，仅供学习与答辩使用。
