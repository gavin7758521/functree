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

[mcp_servers.functree.tools.functree_upsert_alignments_batch]
approval_mode = "approve"
```

`functree_query_context` 是只读查询工具，可以不配置审批。

## 让 Codex 分析项目

FuncTree MCP 不会替 Codex 读取源码。Codex 在目标项目工作区内正常读取代码，然后调用 FuncTree 工具写入结构化结果。推荐提示词：

```text
请分析当前仓库，先识别项目入口文件、主要前端/后端/SDK/运维地图，再用 FuncTree MCP 写入：
1. Project
2. Maps，例如 product.chat、web.chat-ui、backend.matrix-chat-core
3. 每个 Map 下的核心 Feature
4. EntryPoint 和 CodeReference
5. 产品、前端、后端、测试之间的 Alignment
写入前先调用 functree_query_context 查重；大量写入先 dryRun。
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
- `metadata`
- `dryRun`

### functree_upsert_feature

在功能地图下创建或更新功能，支持功能版本、稳定语义键、类型、状态和父子功能树。

必填：

- `mapId`
- `stableKey`
- `name`

可选：

- `id`
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
- `featureId`
- `entryPointId`
- `stableKey`
- `symbol`
- `description`
- `lineStart`
- `lineEnd`
- `metadata`
- `dryRun`

### functree_upsert_alignment

在同一项目内的项目、功能地图、功能、入口文件、代码引用之间建立跨层级对齐关系。按 `id`、`stableKey` 或成员集合查重。

必填：

- `projectId`
- `name`
- `members`

`members` 至少包含两个对象，对象可以是 `project`、`map`、`feature`、`entry_point` 或 `code_reference`。

### batch 工具

批量写入工具用于一次同步多个对象：

- `functree_upsert_maps_batch`
- `functree_upsert_features_batch`
- `functree_upsert_entry_points_batch`
- `functree_upsert_code_references_batch`
- `functree_upsert_alignments_batch`

每个 batch 支持 `dryRun: true`。写入模式下如果某一项失败，会回滚本批次已写入项，并返回 `errors[index, code, message, hint]`。

单项 upsert 和 batch 结果包含：

- `operation`: `created` / `updated` / `unchanged` / `dry_run`
- `changedFields`
- `data`
- `dryRun`

### functree_query_context

只读查询项目、功能地图、功能、入口文件、代码引用和对齐关系。写入前不确定 ID 或已有上下文时应先调用。

可选：

- `projectId`
- `keyword`
- `limit`：1 到 200，默认 20
- `types`：例如 `["feature"]`
- `mapId`
- `stableKey`
- `alignmentId`
- `parentFeatureId`
- `entryPointId`
- `codeReferenceId`
- `path`
- `offset`
- `cursor`

返回包含 `page.nextCursor`，下一页请求传入 `cursor` 即可。`summary` 返回功能地图数、功能数、入口文件数、代码引用数、对齐关系数、最近更新时间和 stableKey 冲突数。

## 打包边界

`@gavin7758521/functree-mcp` 的 npm 包只发布 `dist` 和包内 `README.md`。不要把 `.env`、数据库文件、令牌、内网凭据或用户项目配置写入源码；运行时地址通过 `FUNCTREE_SERVER_URL` 或 `--server-url` 传入。
