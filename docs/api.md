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
```

示例：

```json
{
  "name": "functree_query_context",
  "arguments": {
    "projectId": "proj_demo",
    "keyword": "登录"
  }
}
```
