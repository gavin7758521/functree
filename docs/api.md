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

## 入口文件

```http
GET /api/projects/:projectId/entry-points
POST /api/projects/:projectId/entry-points
```

入口文件用于记录项目分析起点，例如应用根、路由入口、服务启动、API 根、CLI、配置、schema、部署或测试入口。

## 代码引用

```http
GET /api/projects/:projectId/code-references
POST /api/projects/:projectId/code-references
```

代码引用可以绑定到 `mapId`、`featureId` 或 `entryPointId`，用于记录文件、函数、组件、路由、表、迁移、配置、测试或文档。

## 对齐关系

```http
GET /api/projects/:projectId/alignments
POST /api/projects/:projectId/alignments
```

对齐关系成员支持：

```text
project / map / feature / entry_point / code_reference
```

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
    "keyword": "backend.bots",
    "limit": 100,
    "cursor": "100"
  }
}
```

`functree_query_context` 支持：

- `types`: `project` / `map` / `feature` / `alignment` / `entry_point` / `code_reference`
- `mapId`
- `stableKey`
- `alignmentId`
- `parentFeatureId`
- `entryPointId`
- `codeReferenceId`
- `path`
- `offset` / `cursor`

返回包含 `projects`、`maps`、`features`、`entryPoints`、`codeReferences`、`alignments`、`page` 和 `summary`。`summary` 包含功能地图数、功能数、入口文件数、代码引用数、对齐关系数、最近更新时间和 stableKey 冲突数。

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
