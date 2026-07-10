# MCP 接口

FuncTree 提供 stdio MCP 服务，供 AI 工具调用。

启动：

```bash
pnpm mcp
```

## 工具

### functree_create_project

创建或更新项目。

必填：

- `name`

可选：

- `id`
- `status`
- `currentVersion`
- `description`

### functree_upsert_feature_set

创建或更新功能集。

必填：

- `projectId`
- `name`
- `version`
- `type`

### functree_upsert_feature

创建或更新功能。

必填：

- `featureSetId`
- `stableKey`
- `name`

可选：

- `id`
- `parentFeatureId`
- `version`
- `status`
- `kind`
- `description`

### functree_create_alignment

建立对齐关系。

必填：

- `projectId`
- `name`
- `members`

`members` 至少包含两个对象，对象可以是项目、功能集或功能。

### functree_query_context

查询项目、功能集、功能和对齐关系。

可选：

- `projectId`
- `keyword`
- `limit`
