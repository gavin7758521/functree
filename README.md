# FuncTree

FuncTree 是面向 AI 协作的软件功能知识库服务端。

它用“项目、功能集、功能、对齐关系”管理软件系统的功能结构。AI 工具可以通过 MCP 把分析到的需求、前端、后端、UI/UX、测试和文档信息同步进 FuncTree；用户可以通过中文 Web 管理台查看、维护和审查这些信息。

FuncTree 当前版本已经完全改为服务端模式，不依赖用户仓库内的本地配置目录。

## 核心概念

- 项目：平台内最高层级，代表一个产品、系统或业务空间。
- 功能集：项目下的功能集合，支持版本、类型和状态，例如前端 v2.1、后端 v1.5、产品需求 2026.07。
- 功能：功能集下的具体功能，支持版本、状态、类型和父子功能。
- 对齐关系：连接项目、功能集、功能中的任意多个对象，支持跨层级对齐。

## 快速开始

```bash
pnpm install
pnpm build
pnpm start
```

默认服务地址：

```text
http://0.0.0.0:4174
```

本地开发：

```bash
pnpm dev
pnpm dev:web
```

MCP stdio 服务：

```bash
pnpm mcp
```

MCP 只是 Codex 等 AI 工具访问 FuncTree 的适配层，业务数据仍由 FuncTree HTTP 服务写入统一数据库。先启动服务端，再启动 MCP：

```bash
pnpm start
FUNCTREE_SERVER_URL=http://127.0.0.1:4174 pnpm mcp
```

Codex 接入可以使用：

```bash
scripts/functree-mcp.sh
```

## 项目结构

```text
apps/server      服务端、SQLite、HTTP API、MCP
apps/web         中文 Web 管理台
packages/domain 领域模型、枚举、输入校验
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

## 开源协议

MIT
