# 贡献指南

感谢你关注 FuncTree。

## 开发环境

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

## 提交要求

- 文档和页面文案默认使用简体中文。
- 不新增仓库内本地配置目录或文本文件主存储相关能力。
- 服务端输入必须经过校验。
- 数据库查询必须使用参数化语句。
- 新增核心行为时补测试。

## 分支与 PR

建议分支命名：

```text
feat/xxx
fix/xxx
docs/xxx
```

PR 需要说明：

- 改动目的
- 主要实现
- 验证方式
- 是否涉及数据模型变更
