# 架构说明

FuncTree 当前采用服务端优先架构。

```text
AI 工具
  通过 MCP
    FuncTree Server
      SQLite 数据库
      HTTP API
      中文 Web 管理台
```

## 服务端

`apps/server` 负责：

- 初始化 SQLite 数据库。
- 提供 HTTP API。
- 提供 stdio MCP 工具。
- 维护示例种子数据。
- 为 Web 管理台提供静态资源。

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

- 项目总览
- 功能集
- 功能树
- 对齐关系
- MCP 工具入口

## 领域模型

`packages/domain` 保存共享领域模型和输入校验。服务端 API、MCP 工具和测试都复用这套模型。

## 安全边界

第一版默认不包含用户账号和权限系统，因此建议部署在本机、内网或受信任环境中。

安全设计包括：

- API 输入使用 Zod 校验。
- SQLite 查询使用参数化语句。
- 不支持任意文件读取。
- 不记录密钥和敏感凭据。
- 默认数据库文件位于 `data/`，不提交到仓库。
