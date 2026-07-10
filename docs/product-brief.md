# FuncTree 产品说明

FuncTree 是面向 AI 协作的软件功能知识库服务端。

它不要求用户在代码仓库里维护本地配置目录，也不以本地文本文件作为核心数据源。FuncTree 的主形态是一个后端服务：数据存储在数据库中，AI 工具通过 MCP 写入和查询，人类通过中文 Web 管理台审查和维护。

## 产品定位

FuncTree 解决的问题是：AI 工具可以快速读写代码，但团队缺少一个稳定的“功能层知识库”来表达产品、前端、后端、SDK、运维、数据、测试、文档之间的对应关系。

FuncTree 不是任务管理系统，也不是自动代码扫描器。它关注的是：

- 一个项目有哪些功能地图。
- 每张功能地图属于产品、前端、后端、SDK、运维、数据、测试还是文档。
- 每张地图下有哪些功能，以及功能之间的父子关系。
- 代码分析应该从哪些入口文件开始。
- 功能和具体代码、路由、表、配置、测试如何关联。
- 不同视角、不同粒度之间如何对齐。
- AI 工具如何可靠地把分析结果同步给团队。

## 核心层级

```text
项目 Project
  功能地图 Map
    功能 Feature
      子功能 Feature
  入口文件 EntryPoint
  代码引用 CodeReference
  对齐关系 Alignment
```

### 项目

项目是平台内的最高层级，代表一个产品、系统、业务线或长期工作空间。

### 功能地图

功能地图属于项目。它不是简单标签，而是一个一等实体，用来表达“从哪个视角看这个项目”。

常见功能地图：

- `product.chat`：用户视角聊天能力。
- `web.chat-ui`：前端聊天界面实现。
- `backend.matrix-chat-core`：后端 Matrix/Synapse 聊天核心。
- `backend.airoom-extensions`：AIRoom 私有扩展。
- `sdk.public-user-sdk`：公开 SDK。
- `ops.deployment`：部署运维。

功能地图用三类字段区分：

- `axis`：主归属，例如 product、web、backend、sdk、ops。
- `scope`：地图范围，例如 capability、implementation、contract、operation。
- `kind`：具体形态，例如 domain、app、service、package、api、database。

`tags` 只做补充标签，不承担主分类职责。

### 功能

功能属于某张功能地图。功能可以包含子功能，也可以多版本共存。

示例：

```text
Map: product.chat
  Feature: 发送文本
  Feature: 编辑消息
  Feature: 撤回消息

Map: web.chat-ui
  Feature: Composer
  Feature: TimelinePanel

Map: backend.matrix-chat-core
  Feature: send message API
  Feature: event persistence
```

### 入口文件

入口文件描述项目分析从哪里开始。一个项目可以有多个入口，例如：

- 前端应用根。
- 路由入口。
- 服务启动文件。
- HTTP API 根。
- CLI 入口。
- 配置、schema、部署或测试入口。

入口文件让下一次 AI 分析不会从零乱猜。

### 代码引用

代码引用把功能知识库连接到具体实现。它可以指向：

- 文件。
- 函数、类、组件。
- API、路由。
- 数据库表、迁移。
- 配置、测试、文档。

代码引用可以绑定到功能地图、功能或入口文件。

## 对齐关系

对齐关系是 FuncTree 的核心机制。

对齐不是层级关系，也不限制同级别。项目、功能地图、功能、入口文件、代码引用都可以作为可对齐对象。一个对齐关系可以连接两个或多个对象，用来表达它们在产品语义、实现目标、交付范围、依赖责任或验证标准上存在对应关系。

例如：

```text
product.chat / 发送消息
web.chat-ui / Composer
backend.matrix-chat-core / send message API
code_reference / apps/web/src/Composer.tsx#Composer
```

它们可以组成一个“发送消息链路对齐关系”。

## 服务端优先

FuncTree 使用：

- Node.js + TypeScript。
- SQLite 作为默认数据库。
- Fastify 提供 HTTP API。
- 独立 npm 包 `@gavin7758521/functree-mcp` 提供 stdio MCP 远程适配器。
- React + Vite 提供中文 Web 管理台。

SQLite 是默认存储介质，因为它部署简单、事务可靠、适合本地和小团队使用。未来可以增加 Postgres 适配器。

## AI 工作流

推荐工作流：

1. 用户创建项目。
2. Codex 在目标项目里识别入口文件和主要地图。
3. Codex 先调用 `functree_query_context` 查重。
4. Codex dry-run 写入 Map、Feature、EntryPoint、CodeReference。
5. 用户确认后写入。
6. Codex 或用户建立跨层级 Alignment。
7. 用户在中文 Web 管理台审查功能知识库。

## 不做的事情

当前版本不做：

- 仓库内本地配置目录作为主存储。
- 文本文件 schema 作为主数据模型。
- 用户账号和云同步。
- 权限系统。
- 自动代码扫描并声称完全理解项目。

FuncTree 当前目标是：把服务端数据模型、MCP 工具入口和中文管理台做稳，让 AI 分析结果能被持续复用和人工审查。
