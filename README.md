# OpenAI Backend

基于 NestJS 的多模型 AI 后端服务，支持 OpenAI / Gemini 调用、会话管理、流式输出（SSE）、API Key 加密存储、用量统计与操作记录。

## 技术栈

- NestJS 11 + TypeScript
- MongoDB + Mongoose
- JWT + Passport
- OpenAI SDK + Gemini SDK
- Swagger（接口调试）

## 功能概览

- 认证与用户：登录注册、JWT 校验、用户管理
- 会话与聊天：标题管理、历史消息、非流式回复
- 流式输出：SSE 持续返回模型增量内容，支持中止
- 模型与密钥：模型配置管理、按分类绑定 API Key、密钥加密存储
- 运营能力：Token usage 统计、操作记录

## 运行前置

- Node.js: 建议 `>= 18`
- npm: 建议 `>= 9`
- MongoDB: 需要本地可用（当前代码默认连接 `mongodb://127.0.0.1:27017/nest`）

注意：当前项目使用 MongoDB，不使用 MySQL。

## 快速开始

```bash
npm install
```

创建 `.env`（可参考下方环境变量章节），然后启动：

```bash
# 开发模式
npm run start:dev

# 普通启动
npm run start

# 生产模式
npm run build
npm run start:prod
```

启动后：

- 服务地址：`http://localhost:3000`（或 `PORT` 指定端口）
- Swagger 文档：`http://localhost:3000/openai`

## 可用命令

```bash
# 开发
npm run start:dev
npm run start:debug

# 构建与运行
npm run build
npm run start
npm run start:prod

# 质量与测试
npm run lint
npm run format
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

## 环境变量

| 变量名 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `PORT` | 否 | `3000` | 服务监听端口 |
| `JWT_SECRET` | 建议必填 | `my-secret-key` | JWT 签名密钥 |
| `JWT_ISSUER` | 否 | - | Token issuer（仅部分逻辑使用） |
| `OPENAI_API_KEY` | 使用 OpenAI 时必填 | - | OpenAI API Key |
| `OPENAI_BASE_URL` | 否 | `https://api.openai.com/v1` | OpenAI 网关地址（兼容第三方） |
| `GEMINI_API_KEY` | 建议必填 | - | Gemini API Key（`ChatService` 初始化时会校验） |
| `ENCRYPTION_KEY` | 是 | - | 用于 API Key 加解密的 hex 密钥（建议 64 位 hex） |
| `INITIAL_PASSWORD` | 否 | `123456!` | 新增/重置用户默认密码 |

`.env` 示例：

```env
PORT=3000
JWT_SECRET=replace-with-strong-secret
JWT_ISSUER=openai-backend
OPENAI_API_KEY=sk-xxxx
OPENAI_BASE_URL=https://api.openai.com/v1
GEMINI_API_KEY=xxxx
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
INITIAL_PASSWORD=123456!
```

## 项目结构

```text
src/
  auth/        # 认证与 JWT
  chat/        # 非流式聊天、标题与消息管理
  stream/      # SSE 流式生成与中止
  provider/    # API Key / 服务商配置（加密存储）
  ai-models/   # AI 模型目录（provider / model_code / api_model_name）
  user/        # 用户管理
  usage/       # 用量统计
  record/      # 操作记录
  role/        # 角色管理
  file/        # 文件模块（当前仅占位）
  common/      # 公共装饰器/过滤器/拦截器/工具
  schemas/     # Mongoose schema 定义
```

## 接口与鉴权

- 接口文档：`/openai`
- 鉴权方式：Bearer JWT（Swagger 中使用 `access_token`）
- 获取 token：调用 `POST /auth/login` 或 `POST /auth/register`

核心路由索引（按模块）：

- `auth`：`/auth/login`、`/auth/register`、`/auth/validate`
- `chat`：`/chat/chatgpt`、`/chat/gemini`、`/chat/titleList`、`/chat/chatList/:id`
- `stream`：`/stream/generateContentStream`、`/stream/stopStream`
- `provider`：`/provider/add`、`/provider/findList`、`/provider/findByProvider`
- `ai-model`：`/ai-model/findAiModelList`、`/ai-model/syncOpenAIModels`
- `user`：`/user/findAll`、`/user/updateUser`、`/user/resetById`
- `usage`：`/usage/findUsageList`
- `record`：`/record/findRecordList`

说明：部分接口受 `JwtAuthGuard` 保护，请先登录后携带 `Authorization: Bearer <token>`。

## 流式接口（SSE）说明

### 1) 发起流式生成

`POST /stream/generateContentStream`

- 响应类型：`text/event-stream`
- 服务端按块返回：
  - `data: {"content":"..."}`（增量文本）
  - `data: {"done":true,"stopped":false}`（结束标记）

### 2) 主动停止

`POST /stream/stopStream`

- 入参：`documentId`
- 返回：`{ success: true, stopped: true/false, documentId }`
- 建议前端在用户点击“停止生成”时调用该接口

## 已知限制与注意事项

当前代码中存在一些硬编码配置，部署前建议先参数化：

- MongoDB 地址在 `src/app.module.ts` 中写死为 `mongodb://127.0.0.1:27017/nest`
- 全局代理在 `src/main.ts` 中写死为 `http://127.0.0.1:7890`
- CORS 仅放行 `http://localhost:5173` 与 `http://127.0.0.1:5173`

## 常见问题排查

- `ENCRYPTION_KEY is not set`
  - 未配置密钥加密 key；请检查 `.env` 并使用合法 hex 字符串。
- `GEMINI_API_KEY is not set`
  - `ChatService` 初始化时校验失败；请配置 Gemini key。
- `OPENAI_API_KEY is not set`
  - 调用 OpenAI 相关接口前需提供 key。
- `401 Unauthorized`
  - 检查是否携带 Bearer token、`JWT_SECRET` 是否一致。
- OpenAI 请求 404
  - 检查 `OPENAI_BASE_URL`，建议填写根地址（如 `.../v1`），不要包含 `/chat/completions`。

## 开发建议

- 详细参数、返回体与在线调试优先使用 Swagger。
- 新增接口时同步补充 DTO 校验与 Swagger 注解，保持文档一致性。

