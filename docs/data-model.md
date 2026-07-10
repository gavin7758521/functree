# 数据模型

FuncTree 的核心实体包括项目、功能地图、功能、入口文件、代码引用、对齐关系。

## 项目 projects

| 字段 | 说明 |
| --- | --- |
| id | 项目专属 ID |
| name | 项目名称 |
| status | active / paused / archived |
| current_version | 当前版本 |
| description | 描述 |
| metadata_json | 扩展字段 |

## 功能地图 maps

功能地图是项目下的一等视角。前端、后端、产品、SDK、运维等归属不靠标签猜，而是通过结构化字段表达。

| 字段 | 说明 |
| --- | --- |
| id | 功能地图专属 ID |
| project_id | 所属项目 |
| stable_key | 稳定语义键，例如 product.chat、web.chat-ui、backend.matrix-chat-core |
| name | 名称 |
| version | 版本 |
| axis | capability / product / web / backend / sdk / ops / data / test / docs / other |
| scope | capability / implementation / contract / operation / validation / documentation / data / other |
| kind | domain / app / service / package / module / api / database / deployment / test_suite / document / other |
| status | normal / draft / frozen / archived / deprecated |
| owner | 负责人 |
| tags_json | 辅助标签 |
| metadata_json | 扩展字段 |

## 功能 features

| 字段 | 说明 |
| --- | --- |
| id | 功能专属 ID |
| project_id | 所属项目 |
| map_id | 所属功能地图 |
| parent_feature_id | 父功能 |
| stable_key | 稳定语义键 |
| name | 功能名称 |
| version | 功能版本 |
| status | draft / in_progress / reviewing / completed / released / archived / deprecated / blocked |
| kind | capability / module / page / api / component / process / rule / test / doc / data / operation / other |
| tags_json | 辅助标签 |

功能可以多版本共存。建议使用 `stable_key` 表达长期语义，用 `id` 表达具体实例。

## 入口文件 entry_points

入口文件描述项目分析从哪里开始，可以绑定到某个功能地图。

| 字段 | 说明 |
| --- | --- |
| id | 入口 ID |
| project_id | 所属项目 |
| map_id | 可选，所属功能地图 |
| stable_key | 稳定语义键，例如 web.app-root、backend.server-bootstrap |
| name | 名称 |
| path | 仓库路径或配置路径 |
| kind | app_root / router / server_bootstrap / http_api_root / cli / build / config / schema / deployment / test / other |
| confidence | 置信度，0 到 1 |
| first_seen_scan_run_id | 首次发现该入口的扫描记录 |
| last_seen_scan_run_id | 最近发现该入口的扫描记录 |
| last_seen_commit_sha | 最近扫描 commit |
| last_scanned_at | 最近扫描时间 |

## 代码引用 code_references

代码引用把功能知识库连接到具体实现、配置或文档。

| 字段 | 说明 |
| --- | --- |
| id | 代码引用 ID |
| project_id | 所属项目 |
| map_id | 可选，所属功能地图 |
| feature_id | 可选，关联功能 |
| entry_point_id | 可选，关联入口文件 |
| stable_key | 可选稳定语义键 |
| path | 文件、配置或文档路径 |
| symbol | 函数、组件、路由、表、章节等符号 |
| kind | file / class / function / component / api / route / table / migration / config / test / document / other |
| line_start / line_end | 可选行号范围 |
| first_seen_scan_run_id | 首次发现该引用的扫描记录 |
| last_seen_scan_run_id | 最近发现该引用的扫描记录 |
| last_seen_commit_sha | 最近扫描 commit |
| last_scanned_at | 最近扫描时间 |

## 对齐关系 alignments

对齐关系可以连接项目、功能地图、功能、入口文件、代码引用中的任意多个对象。

| 字段 | 说明 |
| --- | --- |
| id | 对齐关系 ID |
| project_id | 所属项目 |
| stable_key | 对齐关系稳定语义键，可选 |
| member_signature | 成员集合签名，用于按成员集合去重 upsert |
| name | 名称 |
| relation | 对齐类型 |
| status | proposed / confirmed / rejected / stale |
| description | 说明 |

成员表 `alignment_members` 保存被对齐对象：

| 字段 | 说明 |
| --- | --- |
| target_type | project / map / feature / entry_point / code_reference |
| target_id | 对象 ID |
| role | source / target / peer / evidence |
| note | 说明 |

## 扫描记录 scan_runs

扫描记录表达一次针对仓库和 Git commit 的分析过程。commit 不直接挂在项目上，因为同一个项目可能由多个仓库、分支或扫描批次组成。

| 字段 | 说明 |
| --- | --- |
| id | 扫描记录 ID |
| project_id | 所属项目 |
| repo_key | 仓库稳定键，例如 github:gavin7758521/functree |
| repo_url | 仓库地址 |
| branch | 分支 |
| commit_sha | 本次扫描 commit |
| base_commit_sha | 增量扫描基准 commit |
| worktree_dirty | 扫描时是否存在未提交改动 |
| status | running / completed / failed / cancelled |
| summary_json | 扫描摘要 |
| metadata_json | 扩展字段 |
| started_at / finished_at | 开始和结束时间 |

## 查询

`functree_query_context` 使用参数化 SQL 和转义后的 `LIKE` 查询。keyword 会同时匹配完整词和点号、连字符、下划线拆分后的片段，避免 stableKey 片段导致服务端 500。
`view: "lite"` 可只返回轻量 ID 映射字段；`functree_resolve_stable_keys` 用于批量解析 stableKey；`functree_query_path_context` 用于按文件路径做增量扫描前查重。
