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

[mcp_servers.functree.tools.functree_upsert_feature_set]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_upsert_feature]
approval_mode = "approve"

[mcp_servers.functree.tools.functree_create_alignment]
approval_mode = "approve"
```

`functree_query_context` 是只读查询工具，可以不配置审批。

仓库内开发也可以使用：

```bash
FUNCTREE_SERVER_URL=http://192.168.124.82:4174 pnpm mcp
```

或：

```bash
FUNCTREE_SERVER_URL=http://192.168.124.82:4174 scripts/functree-mcp.sh
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

### functree_upsert_feature_set

在项目下创建或更新带版本的功能集，例如前端、后端、产品需求、UI/UX、测试、文档或运维视角。

必填：

- `projectId`
- `name`
- `version`
- `type`

### functree_upsert_feature

在功能集下创建或更新功能，支持功能版本、稳定语义键、类型、状态和父子功能树。

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

在同一项目内的项目、功能集、功能之间建立跨层级对齐关系。

必填：

- `projectId`
- `name`
- `members`

`members` 至少包含两个对象，对象可以是项目、功能集或功能。

### functree_query_context

只读查询项目、功能集、功能和对齐关系。写入前不确定 ID 或已有上下文时应先调用。

可选：

- `projectId`
- `keyword`
- `limit`：1 到 200，默认 20

## 打包边界

`@gavin7758521/functree-mcp` 的 npm 包只发布 `dist` 和包内 `README.md`。不要把 `.env`、数据库文件、令牌、内网凭据或用户项目配置写入源码；运行时地址通过 `FUNCTREE_SERVER_URL` 或 `--server-url` 传入。
