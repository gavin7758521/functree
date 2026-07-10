import {
  BatchAlignmentSchema,
  BatchFeatureSchema,
  BatchFeatureSetSchema,
  CreateAlignmentSchema,
  CreateFeatureSchema,
  CreateFeatureSetSchema,
  CreateProjectSchema,
  QueryContextSchema
} from '@functree/domain';
import { ValidationError, type FuncTreeRepository } from './repository.js';

export const toolDefinitions = [
  {
    name: 'functree_create_project',
    title: '创建项目',
    description: '创建或更新 FuncTree 顶层项目，用于表示产品、系统、仓库组或长期业务工作空间。'
  },
  {
    name: 'functree_upsert_feature_set',
    title: '写入功能集',
    description: '在项目下创建或更新带 stableKey 的功能集，例如前端、后端、产品需求、UI/UX、测试、文档或运维视角。返回 created/updated/unchanged/dry_run。'
  },
  {
    name: 'functree_upsert_feature',
    title: '写入功能',
    description: '在功能集下创建或更新功能，支持功能版本、stableKey、类型、状态和父子功能树。返回 created/updated/unchanged/dry_run。'
  },
  {
    name: 'functree_upsert_alignment',
    title: '写入对齐关系',
    description: '按 id、stableKey 或成员集合创建/更新对齐关系，避免重复创建“前端 X 对应后端 Y”一类关系。'
  },
  {
    name: 'functree_upsert_feature_sets_batch',
    title: '批量写入功能集',
    description: '在同一项目下批量 upsert 功能集，支持 dryRun，并在失败时返回具体失败项。'
  },
  {
    name: 'functree_upsert_features_batch',
    title: '批量写入功能',
    description: '在同一功能集下批量 upsert 功能，支持 dryRun，并在失败时返回具体失败项。'
  },
  {
    name: 'functree_upsert_alignments_batch',
    title: '批量写入对齐关系',
    description: '在同一项目下批量 upsert 对齐关系，支持 dryRun，并按 id、stableKey 或成员集合去重。'
  },
  {
    name: 'functree_query_context',
    title: '查询上下文',
    description: '只读查询 FuncTree 项目、功能集、功能和对齐关系，支持 keyword、types、stableKey、featureSetId、alignmentId、parentFeatureId、offset/cursor 与统计摘要。'
  }
];

export type ToolName = (typeof toolDefinitions)[number]['name'];

export async function callTool(repo: FuncTreeRepository, name: string, args: unknown): Promise<unknown> {
  switch (name) {
    case 'functree_create_project': {
      return repo.createProject(CreateProjectSchema.parse(args));
    }
    case 'functree_upsert_feature_set': {
      const input = CreateFeatureSetSchema.parse(args);
      if (!input.projectId) {
        throw new ValidationError('projectId 必填。');
      }
      return repo.upsertFeatureSet(input.projectId, input);
    }
    case 'functree_upsert_feature': {
      const input = CreateFeatureSchema.parse(args);
      if (!input.featureSetId) {
        throw new ValidationError('featureSetId 必填。');
      }
      return repo.upsertFeature(input.featureSetId, input);
    }
    case 'functree_upsert_alignment': {
      const input = CreateAlignmentSchema.parse(args);
      if (!input.projectId) {
        throw new ValidationError('projectId 必填。');
      }
      return repo.upsertAlignment(input.projectId, input);
    }
    case 'functree_upsert_feature_sets_batch': {
      return repo.upsertFeatureSetsBatch(BatchFeatureSetSchema.parse(args));
    }
    case 'functree_upsert_features_batch': {
      return repo.upsertFeaturesBatch(BatchFeatureSchema.parse(args));
    }
    case 'functree_upsert_alignments_batch': {
      return repo.upsertAlignmentsBatch(BatchAlignmentSchema.parse(args));
    }
    case 'functree_query_context': {
      return repo.queryContext(QueryContextSchema.parse(args));
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
