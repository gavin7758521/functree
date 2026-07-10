# FuncTree

FuncTree 是面向 AI 协作的软件功能知识库服务端。

它用“项目、功能地图、功能、入口文件、代码引用、对齐关系”管理软件系统的功能结构。AI 工具通过 MCP 把分析到的产品、前端、后端、SDK、运维、数据、测试和文档信息同步进 FuncTree；用户通过中文 Web 管理台查看、维护和审查这些信息。

FuncTree 当前完全采用服务端模式，不依赖用户仓库内的本地配置目录。

## 核心概念

- 项目：平台内最高层级，代表一个产品、系统或业务空间。
- 功能地图：项目下的一等视角，用 `axis` / `scope` / `kind` 区分产品、前端、后端、SDK、运维、数据、测试、文档等结构。
- 功能：功能地图下的具体功能，支持版本、状态、类型、标签和父子功能树。
- 入口文件：项目分析的起点，例如应用根、路由入口、服务启动、API 根、CLI、配置、schema、部署或测试入口。
- 代码引用：功能或入口对应的文件、函数、组件、路由、表、迁移、配置、测试或文档。
- 对齐关系：连接项目、功能地图、功能、入口文件、代码引用中的任意多个对象，支持跨层级对齐。

示例层级：

```text
Project
  Map: product.chat
    Feature: 发送消息
  Map: web.chat-ui
    Feature: Composer
  Map: backend.matrix-chat-core
    Feature: send message API
  EntryPoint: apps/web/src/main.tsx
  CodeReference: apps/web/src/Composer.tsx#Composer
  Alignment: product.chat/发送消息 -> web.chat-ui/Composer -> backend.matrix-chat-core/send message API
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
