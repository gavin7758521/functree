# HTTP API

HTTP API 供 Web 管理台和调试工具使用。

## 健康检查

```http
GET /health
```

## 总览

```http
GET /api/overview
GET /api/catalog
```

`/overview` 的 `totals` 包含项目、功能地图、功能、入口、代码引用、对齐、扫描，以及 `featureFocuses` / `openFeatureFocuses`，用于判断当前是否有可续接的单功能工作队列。

## 项目

```http
GET /api/projects
POST /api/projects
GET /api/projects/:projectId
GET /api/projects/:projectId/tree
GET /api/projects/:projectId/summary
POST /api/projects/:projectId/feature-dossier
POST /api/projects/:projectId/feature-readiness
POST /api/projects/:projectId/feature-dossier/upsert
GET /api/projects/:projectId/feature-focuses
POST /api/projects/:projectId/feature-focuses/start
POST /api/projects/:projectId/feature-focuses
POST /api/projects/:projectId/programming-context
POST /api/projects/:projectId/feature-work/prepare
POST /api/projects/:projectId/features/search
GET /api/projects/:projectId/quality-report
```

`/tree` 返回项目、功能地图、功能树、入口文件、代码引用和对齐关系。

`/summary` 返回项目级统计，包括功能地图、功能、入口文件、代码引用、evidence、对齐、扫描、`featureFocusCount`、`openFeatureFocusCount`、`latestFeatureFocus`、最近更新时间、最近扫描、stableKey 冲突数和孤儿代码引用数。

`/feature-dossier` 是功能优先读取入口。请求体传 `focusId/focusStableKey`、`featureId`，或 `featureStableKey + mapId/mapStableKey`，返回焦点功能、canonical feature、`selectedFocus`、功能焦点列表、实现状态矩阵、缺口/冲突、证据、代码引用、入口文件和质量问题。

`/feature-readiness` 是单功能深挖后的就绪度检查入口。请求体传 `focusId/focusStableKey`、`featureId`，或 `featureStableKey + mapId/mapStableKey`，可选 `requiredAxes`，返回 `readiness`、`score`、跨视角覆盖、缺失维度、检查清单、下一步和 `recommendedToolCalls`。它用于判断当前功能点是否已经足够清楚，还是还缺产品意图、范围、当前/目标行为、代码引用、`code_fact` 证据、状态矩阵、显式缺口、验收条件或 mock 边界。

`/feature-dossier/upsert` 是功能优先写入入口。请求体传 `canonicalMap`、`canonicalFeature`、可选 `implementationSlices`、`canonicalEvidence`、`gaps` 和 `dryRun`，服务端会聚合写入既有 maps/features/statuses/gaps/evidence/entry-points/code-references/alignments。

`/feature-focuses` 是功能优先工作流入口。`GET` 支持 `featureId` 或 `featureStableKey + mapStableKey/mapId` 过滤；`POST` 创建或更新一次围绕单个功能的分析焦点，可写入 `title`、`mode`、`status`、`priority`、`sourceType`、`question`、`scope`、`sourceRefs`、`seedPaths`、`targetMaps`、`relatedFeatures`、`nextSteps`、`findings` 和 `confidence`。它用于记录“这次只深挖哪个功能、从哪里开始、下一步扩展到哪里”。

`/feature-focuses/start` 用于目标功能尚未存在时启动单功能深挖。请求体传 `canonicalMap`、`canonicalFeature`、可选 `focus` 和 `dryRun`，服务端会先 upsert canonical map/feature，再创建或更新功能焦点，并返回当前 feature dossier。

`/programming-context` 是 AI 编程前的窄读取入口。请求体传 `focusId/focusStableKey`、`featureId`，或 `featureStableKey + mapId/mapStableKey`，可用 `include` 控制返回段落；默认会返回 `selectedFocus`、active feature focuses、seedPathContexts、由焦点/seedPaths/缺口/质量问题/验证线索派生的 `nextActions`、必读入口、关键代码引用、对齐关系、影响功能、证据、验收项和风险。

`/feature-work/prepare` 是单功能开工入口。请求体可传 `focusId`、`focusStableKey`、`featureId`、`featureStableKey`，或 `query/path`；服务端会优先恢复已存在的功能焦点，否则按指定功能或搜索线索判断候选可信度。可信时返回 `readiness: "ready"`、`selectedFocus`、选中候选、feature dossier、AI 编程上下文、下一步和 `recommendedToolCalls`；不可信时返回 `ambiguous` 或 `needs_start`、`suggestedStart` 和建议工具调用。

`/features/search` 是功能优先发现入口。请求体传 `query` 或 `path`，可选 `mapId/mapStableKey`、`axes`、`statuses` 和 `limit`，返回候选功能、所在 map、匹配原因、已有焦点、开放缺口、匹配代码引用和下一步建议。

`/quality-report` 返回项目、功能地图、单个功能或功能焦点范围内的覆盖缺口。查询参数可传 `focusId/focusStableKey`、`featureId/featureStableKey`、`mapId/mapStableKey`、`repoRoot` 和 `includePathChecks`，用于单功能同步后只检查当前工作范围。

## 功能地图

```http
GET /api/projects/:projectId/maps
POST /api/projects/:projectId/maps
```

功能地图使用 `stableKey` 做长期语义键，并使用 `axis` / `scope` / `kind` 做结构化分类。

## 功能

```http
GET /api/projects/:projectId/features
POST /api/maps/:mapId/features
```

功能属于某个功能地图。功能查重语义是同一 `mapId` 下的 `stableKey + version`。
MCP 工具层也支持使用 `projectId + mapStableKey` 写入功能，便于跨服务器和增量同步时避免先查真实 ID。

## 入口文件

```http
GET /api/projects/:projectId/entry-points
POST /api/projects/:projectId/entry-points
```

入口文件用于记录项目分析起点，例如应用根、路由入口、服务启动、API 根、CLI、配置、schema、部署或测试入口。
入口文件可带 `mapStableKey` 和 `scanRunId`，用于表达所属功能地图和最近扫描来源。

## 代码引用

```http
GET /api/projects/:projectId/code-references
POST /api/projects/:projectId/code-references
```

代码引用可以绑定到 `mapId`、`featureId` 或 `entryPointId`，用于记录文件、函数、组件、路由、表、迁移、配置、测试或文档。
MCP 工具层也支持 `mapStableKey`、`featureStableKey`、`entryPointStableKey` 和 `scanRunId`，减少写入前回查 ID 的次数。

## 对齐关系

```http
GET /api/projects/:projectId/alignments
POST /api/projects/:projectId/alignments
```

对齐关系成员支持：

```text
project / map / feature / entry_point / code_reference
```

MCP 工具层成员可以传 `targetId`，也可以传 `stableKey`。功能成员建议带 `mapStableKey` 和 `version`。

## StableKey、路径和扫描

```http
POST /api/projects/:projectId/resolve-stable-keys
GET /api/projects/:projectId/path-context
POST /api/projects/:projectId/scan-runs
POST /api/scan-runs/:scanRunId/finish
```

`resolve-stable-keys` 用于批量解析 stableKey 到 ID；`path-context` 用于查询某个路径下已有 entry point/code reference 及其关联对象；`scan-runs` 记录一次 Git commit 级扫描，后续 entry point/code reference 可通过 `scanRunId` 标记首次和最近发现。

## MCP 调试

```http
GET /api/mcp/tools
POST /api/mcp/call
GET /api/query
```

示例：

```json
{
  "name": "functree_query_context",
  "arguments": {
    "projectId": "proj_your_app",
    "types": ["map", "entry_point"],
    "view": "lite",
    "keyword": "backend.bots",
    "limit": 100,
    "cursor": "100"
  }
}
```

`functree_query_context` 支持：

- `types`: `project` / `map` / `feature` / `feature_focus` / `alignment` / `entry_point` / `code_reference` / `evidence`
- `view`: `full` / `lite`
- `includeSummaryOnly`
- `includeMembers`
- `includeMetadata`
- `mapId`
- `mapStableKey`
- `stableKey`
- `alignmentId`
- `parentFeatureId`
- `entryPointId`
- `codeReferenceId`
- `path`
- `pathMode`: `contains` / `exact` / `prefix`
- `offset` / `cursor`

返回包含 `projects`、`maps`、`features`、`featureFocuses`、`entryPoints`、`codeReferences`、`evidence`、`alignments`、`page` 和 `summary`。`summary` 包含功能地图数、功能数、入口文件数、代码引用数、对齐关系数、功能焦点数、开放功能焦点数、最近功能焦点、扫描数、最近扫描、最近更新时间、stableKey 冲突数和孤儿代码引用数。

## 错误格式

所有 HTTP 错误统一返回：

```json
{
  "code": "VALIDATION_ERROR",
  "message": "输入校验失败。",
  "hint": "检查字段类型、枚举值、必填字段和数值范围后重试。",
  "requestId": "req-1"
}
```
