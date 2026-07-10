# 架构说明

FuncTree 当前采用服务端优先架构。

```text
AI 工具
  通过本机 stdio MCP 适配器（@gavin7758521/functree-mcp）
    FuncTree HTTP Server
      SQLite 数据库
      HTTP API
      中文 Web 管理台
```

## 服务端

`apps/server` 负责：

- 初始化 SQLite 数据库。
- 提供 HTTP API。
- 管理项目、功能地图、功能、入口文件、代码引用和对齐关系。
- 为 Web 管理台提供静态资源。
- 提供 `/api/mcp/call` 调试和转发入口。

默认数据库路径：

```text
data/functree.db
```

可通过环境变量覆盖：

```bash
FUNCTREE_DB=/path/to/functree.db pnpm start
```

## Web 管理台

`apps/web` 是中文管理台，面向用户审查和维护功能知识库。

页面包括：

- 项目总览。
- 功能地图。
- 功能树。
- 入口文件。
- 代码引用。
- 对齐关系。
- MCP 工具入口。

## 领域模型

`packages/domain` 保存共享领域模型和输入校验。服务端 API、MCP 工具和测试都复用这套模型。

核心层级：

```text
Project -> Map -> Feature
Project -> EntryPoint
Project -> CodeReference
Alignment connects all of them
```

## MCP 适配器

`packages/mcp` 是可发布到 npm 的远程 MCP 适配器包 `@gavin7758521/functree-mcp`。它在 Codex 等 MCP 客户端所在机器上运行，通过 stdio 接收 MCP 调用，再通过 `FUNCTREE_SERVER_URL` 转发到中央 FuncTree HTTP 服务。

适配器不创建业务数据库，也不读取用户代码仓库。它只负责把工具调用转发给 FuncTree Server。项目分析由 Codex 在目标项目工作区中完成，然后通过 MCP 写入 FuncTree。

## 安全边界

当前版本默认不包含用户账号和权限系统，因此建议部署在本机、内网或受信任环境中。

安全设计包括：

- API 输入使用 Zod 校验。
- SQLite 查询使用参数化语句。
- 不支持任意文件读取。
- 不记录密钥和敏感凭据。
- 默认数据库文件位于 `data/`，不提交到仓库。
- npm 包只发布 `dist` 和包内 `README.md`。
