# FuncTree 产品说明

FuncTree 是面向 AI 协作的软件功能知识库服务端。

它不要求用户在代码仓库里维护本地配置目录，也不以本地文本文件作为核心数据源。FuncTree 的主形态是一个后端服务：数据存储在数据库中，AI 工具通过 MCP 写入和查询，人类通过中文 Web 管理台审查和维护。

## 产品定位

FuncTree 解决的问题是：AI 工具可以快速读写代码，但团队缺少一个稳定的“功能层知识库”来表达某一个具体功能在产品、前端、后端、SDK、运维、数据、测试、文档之间到底是什么关系。

FuncTree 不是任务管理系统，也不是自动代码扫描器。它关注的是：

- 用户或 AI 当前要深挖的是哪个功能。
- 这个功能的产品意图、当前行为、目标行为、范围、验收条件和风险是什么。
- 它在产品、前端、后端、SDK、运维等视角下分别是 prototype、mock、partial、live、deployed 还是 none。
- 哪些代码、路由、表、配置、测试或文档是这个功能的关键证据。
- 哪些信息是代码事实、测试事实、API/schema、产品原型、文档声称、推断、计划或 mock。
- 哪些同名不同义、同能力多实现、mock-vs-live、权限、数据模型或入口缺口需要收敛。
- 功能积累多了以后，如何自然形成项目级功能地图，而不是一开始就被全量地图拖住。

## 核心层级

```text
功能 Feature
  功能焦点 FeatureFocus
  功能详情 FeatureDetails
  实现状态 CapabilityStatus
  缺口/冲突 CapabilityGap
  证据 Evidence
  入口文件 EntryPoint
  代码引用 CodeReference
  对齐关系 Alignment

项目 Project 和功能地图 Map 是上面这些功能对象的归属与分类上下文。
```

### 项目

项目是平台内的最高层级，代表一个产品、系统、业务线或长期工作空间。它用于组织多个功能和地图，但日常工作不要求先从项目全量铺开。

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

新的推荐方式不是先完整建完这些 map，而是先选一个功能，例如“发送文本消息”，围绕这个点记录：

- 产品意图和验收条件。
- 前端页面、组件、hook 或 mock。
- 后端 API、服务、存储和权限。
- SDK 暴露能力。
- 部署、配置、worker 或迁移影响。
- 证据、缺口、冲突和推荐下一步。

多个功能点沉淀后，功能地图会自然变得完整。

### 功能焦点

功能焦点描述“一次工作只深挖哪个功能”。它记录本次问题、范围、来源、种子路径、目标地图、相关功能、下一步、结论和置信度。它让 AI 或人可以从一个小点开始，不需要每次都全量扫描项目。

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

推荐日常工作流：

1. 用户给出一个具体功能或需求片段，例如“把添加 AI 做真”。
2. Codex 先调用 `functree_prepare_feature_work`，按功能名、stableKey、已有 focus 或代码路径准备单功能工作包。
3. 如果已有可信功能，读取 dossier、readiness 和 programming context；如果没有，调用 `functree_start_feature_focus` 创建 canonical feature 和焦点。
4. Codex 在目标仓库里只围绕这个功能读取产品文档、前端、后端、SDK、运维、测试和关键代码。
5. Codex 用 `functree_upsert_feature_dossier` 写入功能详情、实现状态矩阵、证据、入口、代码引用、缺口和对齐关系。
6. 完成后调用 `functree_get_feature_readiness` 和 `functree_quality_report` 检查这个功能是否已经足够深入。
7. 用户在中文 Web 功能工作台审查“工作路线、功能定义、实现层级、证据代码、交给 Codex”这些阶段。

全量初始化仍然可用，但它是批量导入场景。日常修改和理解项目时，FuncTree 推荐从一个功能点入手，再逐步扩展功能地图。

## 不做的事情

当前版本不做：

- 仓库内本地配置目录作为主存储。
- 文本文件 schema 作为主数据模型。
- 用户账号和云同步。
- 权限系统。
- 自动代码扫描并声称完全理解项目。

FuncTree 当前目标是：把服务端数据模型、MCP 工具入口和中文功能工作台做稳，让 AI 对单个功能的深度分析能被持续复用和人工审查。
