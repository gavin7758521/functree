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

## 功能集

```http
GET /api/projects/:projectId/feature-sets
POST /api/projects/:projectId/feature-sets
```

## 功能

```http
GET /api/projects/:projectId/features
POST /api/feature-sets/:featureSetId/features
```

## 对齐关系

```http
GET /api/projects/:projectId/alignments
POST /api/projects/:projectId/alignments
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
    "types": ["feature"],
    "keyword": "backend.bots",
    "limit": 100,
    "cursor": "100"
  }
}
```

`functree_query_context` 支持：

- `types`: `project` / `feature_set` / `feature` / `alignment`
- `featureSetId`
- `stableKey`
- `alignmentId`
- `parentFeatureId`
- `offset` / `cursor`

返回包含 `projects`、`featureSets`、`features`、`alignments`、`page` 和 `summary`。`summary` 包含功能集数、功能数、对齐关系数、最近更新时间和 stableKey 冲突数。

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
