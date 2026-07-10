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
    description: '创建或更新 FuncTree 顶层项目，用于表示产品、系统、仓库组或长期业务工作空间。'
  },
  {
    name: 'functree_upsert_feature_set',
    title: '写入功能集',
    description: '在项目下创建或更新带版本的功能集，例如前端、后端、产品需求、UI/UX、测试、文档或运维视角。'
  },
  {
    name: 'functree_upsert_feature',
    title: '写入功能',
    description: '在功能集下创建或更新功能，支持功能版本、稳定语义键、类型、状态和父子功能树。'
  },
  {
    name: 'functree_create_alignment',
    title: '建立对齐关系',
    description: '在同一项目内的项目、功能集、功能之间建立跨层级对齐关系，用于表达对应、实现、支撑、验证、依赖、覆盖、拆解或冲突。'
  },
  {
    name: 'functree_query_context',
    title: '查询上下文',
    description: '只读查询 FuncTree 项目、功能集、功能和对齐关系。写入前不确定 ID 或已有上下文时应先调用。'
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
