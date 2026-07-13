# MCP 接口

FuncTree 提供可通过 npm 安装的 stdio MCP 适配器，供 Codex 等 AI 工具调用。MCP 进程只是客户端适配层，不直接读写数据库。

正确链路是：

```text
Codex -> 本机 functree-mcp -> FuncTree HTTP Server -> FuncTree 数据库
```

因此需要先启动 FuncTree HTTP 服务：

```bash
pnpm start
```

如果服务端需要被其它服务器访问，服务端必须监听 `0.0.0.0`，客户端使用服务端真实 IP，例如：

```bash
node apps/server/dist/index.js --host 0.0.0.0 --port 4174
```

```text
http://192.168.124.82:4174
```

## 安装远程 MCP 适配器

在运行 Codex 或其它 MCP 客户端的机器上安装：

```bash
npm install -g @gavin7758521/functree-mcp
```

也可以不全局安装，直接使用 npx：

```bash
npx @gavin7758521/functree-mcp --server-url http://192.168.124.82:4174
```

配置项：

| 配置 | 环境变量 | 默认值 |
| --- | --- | --- |
| `--server-url` | `FUNCTREE_SERVER_URL` | `http://127.0.0.1:4174` |
| `--timeout-ms` | `FUNCTREE_TIMEOUT_MS` | `30000` |

## 接入 Codex

全局安装后：

```toml
[mcp_servers.functree]
command = "functree-mcp"
env = { FUNCTREE_SERVER_URL = "http://192.168.124.82:4174" }
```

不全局安装时：

```toml
[mcp_servers.functree]
command = "npx"
args = ["@gavin7758521/functree-mcp", "--server-url", "http://192.168.124.82:4174"]
```

写入类工具建议保持审批：

```toml
[mcp_servers.functree.tools.functree_create_project]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_map]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_feature]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_entry_point]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_code_reference]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_evidence]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_capability_status]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_capability_gap]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_alignment]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_maps_batch]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_features_batch]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_entry_points_batch]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_code_references_batch]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_evidence_batch]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_capability_statuses_batch]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_capability_gaps_batch]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_alignments_batch]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_begin_scan]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_finish_scan]
approval_mode = "approve"
```

`functree_query_context`、`functree_resolve_stable_keys`、`functree_project_summary`、`functree_get_capability_matrix`、`functree_get_programming_context`、`functree_quality_report`、`functree_query_path_context` 是只读查询工具，可以不配置审批。

## 让 Codex 分析项目

FuncTree MCP 不会替 Codex 读取源码。Codex 在目标项目工作区内正常读取代码，然后调用 FuncTree 工具写入结构化结果。推荐提示词：

```text
请分析当前仓库，先识别项目入口文件、主要前端/后端/SDK/运维地图，再用 FuncTree MCP 写入：
1. Project
2. Maps，例如 product.chat、web.chat-ui、backend.matrix-chat-core
3. 每个 Map 下的核心 Feature
4. 未上线、mock、blocked 或 in_progress Feature 的 details，包括 intent、scope、currentBehavior、expectedBehavior、knownGaps、acceptanceCriteria、risks
5. EntryPoint 和 CodeReference，并给关键代码引用写 roleInFeature、changeGuidance、verificationHint
6. Evidence，区分 code_fact、doc_claim、inferred、planned、mock_only、deprecated
7. Capability Status Matrix，把 canonical feature 在 product/web/backend/sdk/ops 下标成 prototype/mock/partial/live/deployed/none
8. Capability Gap，结构化记录 mock_gap、implementation_gap、naming_conflict、data_model_conflict、permission_conflict 等缺口和 recommendedAction
9. 产品、前端、后端、SDK、运维、测试之间的 Alignment
写入前先调用 functree_query_context 或 functree_resolve_stable_keys 查重；大量写入先 dryRun。扫描仓库时先 functree_begin_scan，写入入口文件、代码引用和 evidence 时带 commit/scan 信息，结束后 functree_finish_scan。准备修改某个功能前，先调用 functree_get_capability_matrix 和 functree_get_programming_context；同步后调用 functree_quality_report 检查缺口。
```

## 工具

### functree_create_project

创建或更新顶层项目，用于表示产品、系统、仓库组或长期业务工作空间。

必填：

- `name`

可选：

- `id`
- `status`
- `currentVersion`
- `description`

### functree_upsert_map

在项目下创建或更新带 stableKey 的功能地图。按 `id` 或 `stableKey` 查重。

必填：

- `projectId`
- `stableKey`
- `name`
- `axis`
- `scope`
- `kind`

可选：

- `id`
- `version`
- `status`
- `description`
- `owner`
- `tags`
- `details`
- `metadata`
- `dryRun`

### functree_upsert_feature

在功能地图下创建或更新功能，支持功能版本、稳定语义键、类型、状态和父子功能树。

必填：

- `mapId`，或 `projectId + mapStableKey`
- `stableKey`
- `name`

可选：

- `id`
- `projectId`
- `mapStableKey`
- `parentFeatureId`
- `version`
- `status`
- `kind`
- `description`
- `sortOrder`
- `tags`
- `metadata`
- `dryRun`

### functree_upsert_entry_point

记录项目分析入口，例如应用根、路由入口、服务启动、HTTP API 根、CLI、配置、schema、部署或测试入口。

必填：

- `projectId`
- `stableKey`
- `name`
- `path`
- `kind`

可选：

- `id`
- `mapId`
- `mapStableKey`
- `scanRunId`
- `description`
- `confidence`
- `metadata`
- `dryRun`

### functree_upsert_code_reference

记录功能、入口或地图对应的代码位置。按 `id`、`stableKey` 或路径签名查重。

必填：

- `projectId`
- `path`
- `kind`

可选：

- `id`
- `mapId`
- `mapStableKey`
- `featureId`
- `featureStableKey`
- `featureVersion`
- `entryPointId`
- `entryPointStableKey`
- `stableKey`
- `scanRunId`
- `symbol`
- `description`
- `lineStart`
- `lineEnd`
- `roleInFeature`
- `changeGuidance`
- `verificationHint`
- `blastRadius`
- `metadata`
- `dryRun`

### functree_upsert_evidence

记录判断依据，避免把真实代码事实、文档声称、推断、计划和 mock 混在一起。按 `id` 或证据签名查重。

必填：

- `projectId`
- `targetType`
- `evidenceType`

可选：

- `id`
- `targetId`
- `targetStableKey`
- `mapStableKey`
- `featureVersion`
- `path`
- `symbol`
- `lineStart`
- `lineEnd`
- `summary`
- `confidence`
- `sourceType`
- `sourcePriority`
- `commitSha`
- `verifiedAt`
- `metadata`
- `dryRun`

`targetId` 和 `targetStableKey` 至少传一个。常用 `evidenceType` 包括 `code_fact`、`doc_claim`、`inferred`、`planned`、`mock_only`、`deprecated`。
`sourceType` 用于标明来源：`runtime_code`、`test`、`api_route`、`migration_schema`、`product_prototype`、`docs`、`inference`。建议优先级为运行代码 > 测试 > API/Schema > 原型 > 文档 > 推断。

### functree_upsert_capability_status

记录 canonical feature 在某个 map 下的实现状态，用于区分产品原型、前端 mock、后端真实 API、SDK 部分实现、运维已部署等。

必填：

- `projectId`
- `canonicalFeatureId`，或 `canonicalFeatureStableKey`
- `mapId`，或 `mapStableKey`

可选：

- `id`
- `canonicalMapId`
- `canonicalMapStableKey`
- `canonicalFeatureVersion`
- `featureId`
- `featureStableKey`
- `featureVersion`
- `status`：`unknown` / `none` / `not_needed` / `prototype` / `spec` / `approved` / `mock` / `partial` / `live` / `configured` / `deployed` / `deprecated`
- `summary`
- `gaps`
- `recommendedAction`
- `evidenceIds`
- `metadata`
- `dryRun`

### functree_upsert_capability_gap

结构化记录能力缺口或冲突，例如同名不同义、mock 与真实 API 未打通、数据模型冲突、权限冲突、入口冲突等。

必填：

- `projectId`
- `canonicalFeatureId`，或 `canonicalFeatureStableKey`
- `title`
- `gapType`

可选：

- `id`
- `stableKey`
- `mapId`
- `mapStableKey`
- `featureId`
- `featureStableKey`
- `severity`：`high` / `medium` / `low`
- `status`：`open` / `accepted` / `resolved` / `ignored`
- `description`
- `evidenceIds`
- `recommendedAction`
- `ownerMapId`
- `ownerMapStableKey`
- `metadata`
- `dryRun`

### functree_upsert_alignment

在同一项目内的项目、功能地图、功能、入口文件、代码引用之间建立跨层级对齐关系。按 `id`、`stableKey` 或成员集合查重。

必填：

- `projectId`
- `name`
- `members`

`members` 至少包含两个对象，对象可以是 `project`、`map`、`feature`、`entry_point` 或 `code_reference`。成员可以传 `targetId`，也可以传 `stableKey`；功能成员建议同时传 `mapStableKey` 和 `version` 避免歧义。

### batch 工具

批量写入工具用于一次同步多个对象：

- `functree_upsert_maps_batch`
- `functree_upsert_features_batch`
- `functree_upsert_entry_points_batch`
- `functree_upsert_code_references_batch`
- `functree_upsert_evidence_batch`
- `functree_upsert_capability_statuses_batch`
- `functree_upsert_capability_gaps_batch`
- `functree_upsert_alignments_batch`

每个 batch 支持 `dryRun: true`。写入模式下如果某一项失败，会回滚本批次已写入项，并返回 `errors[index, code, message, hint]`。

`functree_upsert_features_batch` 支持顶层 `mapId/mapStableKey`，也支持每个 item 自己带 `mapId/mapStableKey`，可以一次写入多个 Map 下的功能。使用 `mapStableKey` 时必须提供 `projectId`。

单项 upsert 和 batch 结果包含：

- `operation`: `created` / `updated` / `unchanged` / `dry_run`
- `changedFields`
- `data`
- `dryRun`
- `previewId`：仅 dry-run 新建对象时出现，且对象 ID 会以 `preview_` 开头，不能当作真实 ID 复用

### functree_query_context

只读查询项目、功能地图、功能、入口文件、代码引用和对齐关系。写入前不确定 ID 或已有上下文时应先调用。

可选：

- `projectId`
- `keyword`
- `limit`：1 到 200，默认 20
- `types`：例如 `["feature"]` 或 `["feature", "evidence"]`
- `view`：`full` / `lite`。`lite` 只返回 `id/stableKey/name/type/mapId/path` 等轻量字段
- `includeSummaryOnly`
- `includeMembers`：查询 alignment 时可设为 `false` 降低上下文体积
- `includeMetadata`
- `includeDetails`：查询 feature 时带出结构化详情
- `mapId`
- `mapStableKey`
- `stableKey`
- `alignmentId`
- `parentFeatureId`
- `entryPointId`
- `codeReferenceId`
- `path`
- `pathMode`：`contains` / `exact` / `prefix`
- `offset`
- `cursor`

返回包含 `page.nextCursor`，下一页请求传入 `cursor` 即可。`summary` 返回功能地图数、功能数、入口文件数、代码引用数、evidence 数、对齐关系数、扫描数、最近更新时间、最近扫描、stableKey 冲突数和孤儿代码引用数。

### functree_resolve_stable_keys

批量把 stableKey 解析成真实 ID，适合写 alignment 前准备 ID 映射。

必填：

- `projectId`
- `items`

`items` 每项包含：

- `type`: `project` / `map` / `feature` / `alignment` / `entry_point` / `code_reference`
- `stableKey`，或 `id/path`
- `mapStableKey` / `mapId` / `version`：用于消除 feature 歧义

### functree_project_summary

只读项目统计，适合大规模同步后确认最终状态。

必填：

- `projectId`

### functree_get_capability_matrix

只读返回 canonical feature 的跨 map 状态矩阵，适合回答“这个能力是原型、mock、partial、live，还是后端支持但前端未接”。

必填：

- `projectId`

可选：

- `canonicalFeatureId`
- `canonicalFeatureStableKey`
- `canonicalMapId`
- `canonicalMapStableKey`
- `canonicalFeatureVersion`
- `mapId`
- `mapStableKey`
- `includeGaps`
- `includeEvidence`

### functree_get_programming_context

面向 AI 编程的读取视图。准备修改某个功能时，用它获取按优先级组织的入口文件、关键代码引用、对齐关系、影响功能、风险、验收项、证据和质量问题。

必填：

- `projectId`
- `featureId`，或 `featureStableKey`

可选：

- `mapId`
- `mapStableKey`
- `featureVersion`
- `depth`：0 到 3
- `include`：例如 `["entryPoints", "codeReferences", "alignments", "evidence", "quality"]`

### functree_quality_report

项目级质量报告，用于同步后发现缺口。

必填：

- `projectId`

可选：

- `repoRoot`
- `includePathChecks`

报告会列出没有代码引用、没有 alignment、缺少 `code_fact` evidence、草稿/进行中/阻塞/废弃/mock 功能详情不足，以及可选的代码路径不存在问题。

### functree_query_path_context

按文件路径查询已有入口文件、代码引用，以及关联的功能地图、功能和对齐关系。适合增量扫描某个文件前查重。

必填：

- `projectId`
- `path`

可选：

- `pathMode`
- `includeAlignments`
- `includeReferences`

### functree_begin_scan / functree_finish_scan

`functree_begin_scan` 记录一次仓库扫描：

- `projectId`
- `repoKey`
- `commitSha`
- `branch`
- `baseCommitSha`
- `worktreeDirty`
- `metadata`

返回的 `id` 可作为 `scanRunId` 写入 entry point 和 code reference。扫描完成后调用 `functree_finish_scan`，写入 `status` 和 `summary`。

## 打包边界

`@gavin7758521/functree-mcp` 的 npm 包只发布 `dist` 和包内 `README.md`。不要把 `.env`、数据库文件、令牌、内网凭据或用户项目配置写入源码；运行时地址通过 `FUNCTREE_SERVER_URL` 或 `--server-url` 传入。
