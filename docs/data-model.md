# 数据模型

FuncTree 的核心实体包括项目、功能集、功能、对齐关系。

## 项目 projects

| 字段 | 说明 |
| --- | --- |
| id | 项目专属 ID |
| name | 项目名称 |
| status | active / paused / archived |
| current_version | 当前版本 |
| description | 描述 |
| metadata_json | 扩展字段 |

## 功能集 feature_sets

| 字段 | 说明 |
| --- | --- |
| id | 功能集专属 ID |
| project_id | 所属项目 |
| name | 名称 |
| version | 版本 |
| type | frontend / backend / product / uiux / requirement / test / docs / ops / other |
| status | normal / draft / frozen / archived / deprecated |
| owner | 负责人 |

## 功能 features

| 字段 | 说明 |
| --- | --- |
| id | 功能专属 ID |
| project_id | 所属项目 |
| feature_set_id | 所属功能集 |
| parent_feature_id | 父功能 |
| stable_key | 稳定语义键 |
| name | 功能名称 |
| version | 功能版本 |
| status | draft / in_progress / reviewing / completed / released / archived / deprecated / blocked |
| kind | capability / module / page / api / component / process / rule / test / doc / other |

功能可以多版本共存。建议使用 `stable_key` 表达长期语义，用 `id` 表达具体实例。

## 对齐关系 alignments

对齐关系可以连接项目、功能集、功能中的任意多个对象。

| 字段 | 说明 |
| --- | --- |
| id | 对齐关系 ID |
| project_id | 所属项目 |
| name | 名称 |
| relation | 对齐类型 |
| status | proposed / confirmed / rejected / stale |
| description | 说明 |

成员表 `alignment_members` 保存被对齐对象：

| 字段 | 说明 |
| --- | --- |
| target_type | project / feature_set / feature |
| target_id | 对象 ID |
| role | source / target / peer / evidence |
| note | 说明 |

## 全文搜索

`features_fts` 使用 SQLite FTS5 索引功能名称、稳定键、版本和描述，用于 AI 和用户快速查询上下文。
