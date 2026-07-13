# FuncTree

FuncTree 是面向 AI 协作的软件功能知识库服务端。

它以“功能”为第一对象管理软件系统的知识结构。AI 工具通过 MCP 围绕某一个具体功能写入产品意图、前端/后端/SDK/运维实现、证据、缺口和代码引用；用户通过中文 Web 功能工作台查看、维护和审查这些信息。项目和功能地图仍然存在，但它们是功能的上下文维度，不是日常工作的默认起点。

FuncTree 当前完全采用服务端模式，不依赖用户仓库内的本地配置目录。

## 核心概念

- 功能：FuncTree 的第一性对象。一次分析可以只围绕一个重点功能展开，先深挖它的意图、现状、目标、验收、证据、缺口和代码入口。
- 功能焦点：一次围绕单个功能的工作流，记录本次问题、范围、来源、种子路径、目标地图、下一步和结论。
- 功能地图：功能的视角和边界，用 `axis` / `scope` / `kind` 区分产品、前端、后端、SDK、运维、数据、测试、文档等结构。
- 项目：平台内最高层级，代表一个产品、系统或业务空间。
- 入口文件：项目分析的起点，例如应用根、路由入口、服务启动、API 根、CLI、配置、schema、部署或测试入口。
- 代码引用：功能或入口对应的文件、函数、组件、路由、表、迁移、配置、测试或文档。
- 对齐关系：连接项目、功能地图、功能、入口文件、代码引用中的任意多个对象，支持跨层级对齐。
- 证据、状态矩阵和缺口：区分代码事实、文档声称、mock、计划和推断，表达同一能力在 product/web/backend/sdk/ops 下到底是真实现、半实现还是缺失。

示例层级：

```text
Feature: product.chat / 发送消息
  Focus: 本次只深挖“发送文本消息”
  Product: product.chat / message.send-text
  Web: web.chat-ui / Composer
  Backend: backend.matrix-chat-core / send message API
  EntryPoint: apps/web/src/main.tsx
  CodeReference: apps/web/src/Composer.tsx#Composer
  Evidence: runtime_code / test / api_route / docs
  Gap: web mock 与 backend live API 是否打通
  Alignment: product -> web -> backend -> code
```

## 快速开始

```bash
pnpm install
pnpm build
pnpm start
```

默认监听地址：

```text
http://0.0.0.0:4174
```

本机访问用 `http://127.0.0.1:4174`，局域网其它服务器访问应使用这台机器的实际 IP，例如 `http://192.168.124.82:4174`。

本地开发：

```bash
pnpm dev
pnpm dev:web
```

## MCP 远程适配器

MCP 只是 Codex 等 AI 工具访问 FuncTree 的适配层，业务数据仍由 FuncTree HTTP 服务写入统一数据库。先启动服务端，再启动 MCP：

```bash
pnpm start
FUNCTREE_SERVER_URL=http://192.168.124.82:4174 pnpm mcp
```

其它服务器可以通过 npm 包安装远程 MCP 适配器：

```bash
npm install -g @gavin7758521/functree-mcp
```

Codex 接入示例：

```toml
[mcp_servers.functree]
command = "functree-mcp"
env = { FUNCTREE_SERVER_URL = "http://192.168.124.82:4174" }
```

## 项目结构

```text
apps/server      服务端、SQLite、HTTP API
apps/web         中文 Web 管理台
packages/domain 领域模型、枚举、输入校验
packages/mcp     可发布的远程 MCP 适配器 npm 包
docs             中文产品和技术文档
examples         HTTP / MCP 调用示例
```

## 常用命令

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm start
pnpm mcp
```

## 文档

- [产品说明](docs/product-brief.md)
- [架构说明](docs/architecture.md)
- [数据模型](docs/data-model.md)
- [MCP 接口](docs/mcp.md)
- [HTTP API](docs/api.md)
- [发布说明](docs/release.md)

## 开源协议

MIT
