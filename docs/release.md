# 发布说明

## MCP npm 包版本

`@gavin7758521/functree-mcp` 使用 SemVer。首次 npm 发布版本为 `0.1.0`。

版本源文件：

- `packages/mcp/package.json`
- `packages/mcp/src/cli.ts`

两处版本必须一致，发布前运行：

```bash
pnpm mcp:version:check
```

## 升级版本

使用仓库脚本升级版本：

```bash
pnpm mcp:version patch
pnpm mcp:version minor
pnpm mcp:version major
pnpm mcp:version 0.2.0
```

升级后更新 lockfile 并检查：

```bash
pnpm install --lockfile-only
pnpm mcp:version:check
```

## 发布前检查

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm mcp:pack:dry-run
pnpm mcp:publish:dry-run
gitleaks dir --redact --no-banner .
gitleaks git --redact --no-banner
```

`packages/mcp/package.json` 使用 `files` 白名单，仅发布 `dist` 和包内 `README.md`。不要把 `.env`、数据库文件、npm token、GitHub token 或其它凭据写入源码、文档或发布包。
