import {
  BatchAlignmentSchema,
  BatchCodeReferenceSchema,
  BatchEntryPointSchema,
  BatchFeatureSchema,
  BatchMapSchema,
  CreateAlignmentSchema,
  CreateCodeReferenceSchema,
  CreateEntryPointSchema,
  CreateFeatureSchema,
  CreateMapSchema,
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
    description: '记录功能、入口或地图对应的文件、函数、组件、路由、表、迁移、配置或测试引用，可用 stableKey 或路径签名去重。'
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
    description: '在同一功能地图下批量 upsert 功能，支持 dryRun，并在失败时返回具体失败项。'
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
    name: 'functree_query_context',
    title: '查询上下文',
    description: '只读查询 FuncTree 项目、功能地图、功能、入口文件、代码引用和对齐关系，支持 keyword、types、stableKey、mapId、alignmentId、parentFeatureId、entryPointId、codeReferenceId、path、offset/cursor 与统计摘要。'
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
      if (!input.mapId) {
        throw new ValidationError('mapId 必填。');
      }
      return repo.upsertFeature(input.mapId, input);
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
