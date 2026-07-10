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

## 项目

```http
GET /api/projects
POST /api/projects
GET /api/projects/:projectId
GET /api/projects/:projectId/tree
GET /api/projects/:projectId/summary
```

`/tree` 返回项目、功能地图、功能树、入口文件、代码引用和对齐关系。

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

- `types`: `project` / `map` / `feature` / `alignment` / `entry_point` / `code_reference`
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

返回包含 `projects`、`maps`、`features`、`entryPoints`、`codeReferences`、`alignments`、`page` 和 `summary`。`summary` 包含功能地图数、功能数、入口文件数、代码引用数、对齐关系数、扫描数、最近扫描、最近更新时间、stableKey 冲突数和孤儿代码引用数。

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
