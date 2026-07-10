import {
  CreateAlignmentSchema,
  CreateFeatureSchema,
  CreateFeatureSetSchema,
  CreateProjectSchema,
  QueryContextSchema
} from '@functree/domain';
import type { FuncTreeRepository } from './repository.js';

export const toolDefinitions = [
  {
    name: 'functree_create_project',
    title: '创建项目',
    description: '创建或更新一个 FuncTree 项目。'
  },
  {
    name: 'functree_upsert_feature_set',
    title: '写入功能集',
    description: '在项目下创建或更新一个功能集，功能集支持版本、类型和状态。'
  },
  {
    name: 'functree_upsert_feature',
    title: '写入功能',
    description: '在功能集下创建或更新功能，支持功能版本和父子功能。'
  },
  {
    name: 'functree_create_alignment',
    title: '建立对齐关系',
    description: '在项目、功能集、功能之间建立跨层级对齐关系。'
  },
  {
    name: 'functree_query_context',
    title: '查询上下文',
    description: '按项目和关键词查询项目、功能集、功能、对齐关系。'
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
        throw new Error('projectId 必填。');
      }
      return repo.createFeatureSet(input.projectId, input);
    }
    case 'functree_upsert_feature': {
      const input = CreateFeatureSchema.parse(args);
      if (!input.featureSetId) {
        throw new Error('featureSetId 必填。');
      }
      return repo.createFeature(input.featureSetId, input);
    }
    case 'functree_create_alignment': {
      const input = CreateAlignmentSchema.parse(args);
      if (!input.projectId) {
        throw new Error('projectId 必填。');
      }
      return repo.createAlignment(input.projectId, input);
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
