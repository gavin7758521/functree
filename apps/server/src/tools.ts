import {
  BatchAlignmentSchema,
  BatchCodeReferenceSchema,
  BatchEntryPointSchema,
  BatchFeatureSchema,
  BatchMapSchema,
  BatchEvidenceSchema,
  BeginScanSchema,
  CreateAlignmentSchema,
  CreateCodeReferenceSchema,
  CreateEntryPointSchema,
  CreateEvidenceSchema,
  CreateFeatureSchema,
  CreateMapSchema,
  CreateProjectSchema,
  FinishScanSchema,
  ProgrammingContextSchema,
  ProjectSummarySchema,
  QualityReportSchema,
  QueryPathContextSchema,
  QueryContextSchema,
  ResolveStableKeysSchema
} from '@functree/domain';
import { ValidationError, type FuncTreeRepository } from './repository.js';

export const toolDefinitions = [
  {
    name: 'functree_create_project',
    title: '创建项目',
    description: '创建或更新 FuncTree 顶层项目，用于表示产品、系统、仓库组或长期业务工作空间。'
  },
  {
    name: 'functree_upsert_map',
    title: '写入功能地图',
    description: '在项目下创建或更新带 stableKey 的功能地图，用 axis/scope/kind 区分产品、前端、后端、SDK、运维、数据、测试或文档视角。返回 created/updated/unchanged/dry_run。'
  },
  {
    name: 'functree_upsert_feature',
    title: '写入功能',
    description: '在功能地图下创建或更新功能，支持功能版本、stableKey、类型、状态、标签和父子功能树。返回 created/updated/unchanged/dry_run。'
  },
  {
    name: 'functree_upsert_entry_point',
    title: '写入入口文件',
    description: '记录项目分析入口，例如应用根、路由入口、服务启动文件、HTTP API 根、CLI、配置、schema、部署或测试入口。'
  },
  {
    name: 'functree_upsert_code_reference',
    title: '写入代码引用',
    description: '记录功能、入口或地图对应的文件、函数、组件、路由、表、迁移、配置或测试引用，可写入 roleInFeature、changeGuidance、verificationHint 和 blastRadius。'
  },
  {
    name: 'functree_upsert_evidence',
    title: '写入证据',
    description: '给 feature/map/alignment/entry_point/code_reference 写入一等证据，区分 code_fact、doc_claim、inferred、planned、mock_only、deprecated。'
  },
  {
    name: 'functree_upsert_alignment',
    title: '写入对齐关系',
    description: '按 id、stableKey 或成员集合创建/更新对齐关系，避免重复创建“产品功能 X 对应前端 Y 与后端 Z”一类关系。'
  },
  {
    name: 'functree_upsert_maps_batch',
    title: '批量写入功能地图',
    description: '在同一项目下批量 upsert 功能地图，支持 dryRun，并在失败时返回具体失败项。'
  },
  {
    name: 'functree_upsert_features_batch',
    title: '批量写入功能',
    description: '批量 upsert 功能，支持顶层或 item 级 mapId/mapStableKey，可一次写入多个功能地图；支持 dryRun，并在失败时返回具体失败项。'
  },
  {
    name: 'functree_upsert_entry_points_batch',
    title: '批量写入入口文件',
    description: '在同一项目下批量 upsert 入口文件，支持 dryRun，并在失败时返回具体失败项。'
  },
  {
    name: 'functree_upsert_code_references_batch',
    title: '批量写入代码引用',
    description: '在同一项目下批量 upsert 代码引用，支持 dryRun，并在失败时返回具体失败项。'
  },
  {
    name: 'functree_upsert_alignments_batch',
    title: '批量写入对齐关系',
    description: '在同一项目下批量 upsert 对齐关系，支持 dryRun，并按 id、stableKey 或成员集合去重。'
  },
  {
    name: 'functree_upsert_evidence_batch',
    title: '批量写入证据',
    description: '在同一项目下批量 upsert 证据，支持 dryRun，并按目标、证据类型、路径、符号、行号和 commit 去重。'
  },
  {
    name: 'functree_query_context',
    title: '查询上下文',
    description: '只读查询 FuncTree 项目、功能地图、功能、入口文件、代码引用和对齐关系，支持 lite 轻量模式、summaryOnly、includeMembers、keyword、types、stableKey、mapId/mapStableKey、path、offset/cursor 与统计摘要。'
  },
  {
    name: 'functree_resolve_stable_keys',
    title: '批量解析 stableKey',
    description: '只读批量解析 project/map/feature/entry_point/code_reference/alignment 的 stableKey 到真实 ID，支持 mapStableKey 与 version，避免上下文截断后手工复制 ID。'
  },
  {
    name: 'functree_project_summary',
    title: '项目摘要',
    description: '只读返回项目级统计、最近扫描、stableKey 冲突和孤儿代码引用数量，供大规模同步后确认。'
  },
  {
    name: 'functree_get_programming_context',
    title: '获取 AI 编程上下文',
    description: '只读按 feature 组织编程上下文，返回必读入口、关键实现文件、对齐关系、影响功能、风险、验收条件、证据和质量问题。'
  },
  {
    name: 'functree_quality_report',
    title: '项目质量报告',
    description: '只读返回缺少代码引用、缺少对齐、缺少代码事实证据、未稳定功能详情不足和失效路径等报告。'
  },
  {
    name: 'functree_query_path_context',
    title: '按路径查询上下文',
    description: '只读查询某个 path 下已有入口文件、代码引用，以及关联的功能地图、功能和对齐关系，适合增量扫描。'
  },
  {
    name: 'functree_begin_scan',
    title: '开始扫描记录',
    description: '记录一次仓库扫描的 repoKey、branch、commitSha 和 dirty 状态，后续入口文件/代码引用可用 scanRunId 标记首次和最近发现。'
  },
  {
    name: 'functree_finish_scan',
    title: '结束扫描记录',
    description: '结束一次扫描并写入 summary，状态支持 completed、failed、cancelled。'
  }
];

export type ToolName = (typeof toolDefinitions)[number]['name'];

export async function callTool(repo: FuncTreeRepository, name: string, args: unknown): Promise<unknown> {
  switch (name) {
    case 'functree_create_project': {
      return repo.createProject(CreateProjectSchema.parse(args));
    }
    case 'functree_upsert_map': {
      const input = CreateMapSchema.parse(args);
      if (!input.projectId) {
        throw new ValidationError('projectId 必填。');
      }
      return repo.upsertMap(input.projectId, input);
    }
    case 'functree_upsert_feature': {
      const input = CreateFeatureSchema.parse(args);
      if (!input.mapId && !input.mapStableKey) {
        throw new ValidationError('mapId 或 mapStableKey 必填。');
      }
      return repo.upsertFeatureByReference(input);
    }
    case 'functree_upsert_entry_point': {
      const input = CreateEntryPointSchema.parse(args);
      if (!input.projectId) {
        throw new ValidationError('projectId 必填。');
      }
      return repo.upsertEntryPoint(input.projectId, input);
    }
    case 'functree_upsert_code_reference': {
      const input = CreateCodeReferenceSchema.parse(args);
      if (!input.projectId) {
        throw new ValidationError('projectId 必填。');
      }
      return repo.upsertCodeReference(input.projectId, input);
    }
    case 'functree_upsert_evidence': {
      const input = CreateEvidenceSchema.parse(args);
      if (!input.projectId) {
        throw new ValidationError('projectId 必填。');
      }
      return repo.upsertEvidence(input.projectId, input);
    }
    case 'functree_upsert_alignment': {
      const input = CreateAlignmentSchema.parse(args);
      if (!input.projectId) {
        throw new ValidationError('projectId 必填。');
      }
      return repo.upsertAlignment(input.projectId, input);
    }
    case 'functree_upsert_maps_batch': {
      return repo.upsertMapsBatch(BatchMapSchema.parse(args));
    }
    case 'functree_upsert_features_batch': {
      return repo.upsertFeaturesBatch(BatchFeatureSchema.parse(args));
    }
    case 'functree_upsert_entry_points_batch': {
      return repo.upsertEntryPointsBatch(BatchEntryPointSchema.parse(args));
    }
    case 'functree_upsert_code_references_batch': {
      return repo.upsertCodeReferencesBatch(BatchCodeReferenceSchema.parse(args));
    }
    case 'functree_upsert_alignments_batch': {
      return repo.upsertAlignmentsBatch(BatchAlignmentSchema.parse(args));
    }
    case 'functree_upsert_evidence_batch': {
      return repo.upsertEvidenceBatch(BatchEvidenceSchema.parse(args));
    }
    case 'functree_query_context': {
      return repo.queryContext(QueryContextSchema.parse(args));
    }
    case 'functree_resolve_stable_keys': {
      return repo.resolveStableKeys(ResolveStableKeysSchema.parse(args));
    }
    case 'functree_project_summary': {
      return repo.projectSummary(ProjectSummarySchema.parse(args));
    }
    case 'functree_get_programming_context': {
      return repo.programmingContext(ProgrammingContextSchema.parse(args));
    }
    case 'functree_quality_report': {
      return repo.qualityReport(QualityReportSchema.parse(args));
    }
    case 'functree_query_path_context': {
      return repo.queryPathContext(QueryPathContextSchema.parse(args));
    }
    case 'functree_begin_scan': {
      return repo.beginScan(BeginScanSchema.parse(args));
    }
    case 'functree_finish_scan': {
      return repo.finishScan(FinishScanSchema.parse(args));
    }
    default:
      throw new Error(`未知工具: ${name}`);
  }
}

export function textResult(value: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}
