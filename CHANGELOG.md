# 变更记录

## 0.2.0

- 完全重构为服务端模式。
- 移除早期文件工具方向。
- 新增项目、功能集、功能、对齐关系数据模型。
- 新增 SQLite 存储和 FTS5 搜索。
- 新增 HTTP API。
- 新增 stdio MCP 工具。
- 新增中文 Web 管理台。
- MCP 查询支持 cursor/offset、types、stableKey、featureSetId、alignmentId、parentFeatureId 和统计摘要。
- 功能集与对齐关系支持 stableKey upsert，对齐关系支持按成员集合去重。
- 新增功能集、功能、对齐关系 batch upsert，支持 dry-run、changedFields 和逐项错误。

## 0.1.0

- 早期文件工具原型，已废弃。
