# 变更记录

## 未发布

- Web 管理台把“功能档案”升级为“功能工作台”，按工作路线、功能定义、实现层级、证据代码、交给 Codex 分阶段呈现，避免单页平铺。
- `functree_prepare_feature_work` 的推荐调用补齐 `functree_get_feature_readiness`，准备上下文后能直接复核产品意图、跨端覆盖、代码引用、证据、验收和 mock 边界。
- README 和产品说明改为“功能第一”叙述，明确项目和功能地图是功能的上下文维度。

## 0.4.0

- `functree_query_context` 新增 `view: "lite"`、`includeSummaryOnly`、`includeMembers`、`includeMetadata`、`mapStableKey` 和 `pathMode`，降低大项目上下文体积。
- 新增 `functree_resolve_stable_keys`、`functree_project_summary`、`functree_query_path_context`。
- 新增 scan run 模型和 `functree_begin_scan` / `functree_finish_scan`，支持记录 Git commit 级扫描。
- 功能、入口文件、代码引用和对齐关系支持用 stableKey 写入；feature batch 支持跨 Map item 级写入。
- dry-run 新建对象 ID 改为 `preview_` 前缀，并返回 `previewId`。

## 0.3.0

- 重构核心模型为 Project -> Map -> Feature。
- 删除旧分组概念和旧兼容入口。
- 新增入口文件 EntryPoint，用于记录项目分析起点。
- 新增代码引用 CodeReference，用于连接功能、入口和具体代码/配置/文档。
- 对齐关系支持 `project`、`map`、`feature`、`entry_point`、`code_reference`。
- MCP 工具更新为 `functree_upsert_map`、入口文件、代码引用和对应 batch 工具。
- Web 管理台拆分为功能地图、功能树、入口文件、代码引用、对齐关系等独立视图。

## 0.2.0

- 完全重构为服务端模式。
- 移除早期文件工具方向。
- 新增 SQLite 存储、HTTP API、stdio MCP 工具和中文 Web 管理台。
- MCP 查询支持 cursor/offset、types、stableKey、对象过滤和统计摘要。
- Upsert 支持 dry-run、changedFields 和逐项错误。

## 0.1.0

- 早期文件工具原型，已废弃。
