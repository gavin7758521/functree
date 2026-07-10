# MCP 接口

FuncTree 提供 stdio MCP 服务，供 AI 工具调用。MCP 进程只是客户端适配层，不直接读写数据库。

正确链路是：

```text
Codex -> FuncTree MCP -> FuncTree HTTP Server -> FuncTree 数据库
```

因此需要先启动 FuncTree HTTP 服务：

```bash
pnpm start
```

启动：

```bash
pnpm mcp
```

## 接入 Codex

仓库提供了一个 MCP 启动器：

```bash
scripts/functree-mcp.sh
```

它会自动定位仓库根目录，并把 MCP 调用转发给 FuncTree HTTP 服务。默认服务地址：

```text
http://127.0.0.1:4174
```

如果 FuncTree Server 不在本机，使用 `FUNCTREE_SERVER_URL` 指向实际服务地址。MCP 不创建自己的业务数据库，所有数据都由 FuncTree Server 写入同一份业务数据库。

Codex 配置示例，使用时把 `<FUNCTREE_REPO>` 替换成你的本机仓库路径：

```toml
[mcp_servers.functree]
command = "<FUNCTREE_REPO>/scripts/functree-mcp.sh"
env = { FUNCTREE_SERVER_URL = "http://127.0.0.1:4174" }

[mcp_servers.functree.tools.functree_create_project]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_feature_set]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_feature]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_create_alignment]
approval_mode = "approve"
```

`functree_query_context` 是只读查询工具，可以不配置审批。

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
