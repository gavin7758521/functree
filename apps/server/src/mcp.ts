#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { openDatabase } from './database.js';
import { FuncTreeRepository } from './repository.js';
import { callTool, textResult } from './tools.js';

const db = openDatabase(process.env.FUNCTREE_DB);
const repo = new FuncTreeRepository(db);
repo.seedIfEmpty();

const server = new McpServer({
  name: 'functree',
  version: '0.2.0'
});

server.registerTool(
  'functree_create_project',
  {
    title: '创建项目',
    description: '创建或更新项目。',
    inputSchema: {
      id: z.string().optional(),
      name: z.string(),
      status: z.enum(['active', 'paused', 'archived']).optional(),
      currentVersion: z.string().optional(),
      description: z.string().optional()
    }
  },
  async (args) => textResult(await callTool(repo, 'functree_create_project', args))
);

server.registerTool(
  'functree_upsert_feature_set',
  {
    title: '写入功能集',
    description: '在项目下创建或更新功能集。',
    inputSchema: {
      id: z.string().optional(),
      projectId: z.string(),
      name: z.string(),
      version: z.string(),
      type: z.enum(['frontend', 'backend', 'product', 'uiux', 'requirement', 'test', 'docs', 'ops', 'other']),
      status: z.enum(['normal', 'draft', 'frozen', 'archived', 'deprecated']).optional(),
      description: z.string().optional(),
      owner: z.string().optional()
    }
  },
  async (args) => textResult(await callTool(repo, 'functree_upsert_feature_set', args))
);

server.registerTool(
  'functree_upsert_feature',
  {
    title: '写入功能',
    description: '在功能集下创建或更新功能，支持版本和父子功能。',
    inputSchema: {
      id: z.string().optional(),
      featureSetId: z.string(),
      parentFeatureId: z.string().nullable().optional(),
      stableKey: z.string(),
      name: z.string(),
      version: z.string().optional(),
      status: z.enum(['draft', 'in_progress', 'reviewing', 'completed', 'released', 'archived', 'deprecated', 'blocked']).optional(),
      kind: z.enum(['capability', 'module', 'page', 'api', 'component', 'process', 'rule', 'test', 'doc', 'other']).optional(),
      description: z.string().optional()
    }
  },
  async (args) => textResult(await callTool(repo, 'functree_upsert_feature', args))
);

server.registerTool(
  'functree_create_alignment',
  {
    title: '建立对齐关系',
    description: '连接项目、功能集、功能中的任意多个对象。',
    inputSchema: {
      id: z.string().optional(),
      projectId: z.string(),
      name: z.string(),
      relation: z
        .enum(['corresponds_to', 'implements', 'supports', 'validates', 'depends_on', 'replaces', 'conflicts_with', 'covers', 'decomposes_to', 'related_to'])
        .optional(),
      status: z.enum(['proposed', 'confirmed', 'rejected', 'stale']).optional(),
      description: z.string().optional(),
      members: z.array(
        z.object({
          targetType: z.enum(['project', 'feature_set', 'feature']),
          targetId: z.string(),
          role: z.enum(['source', 'target', 'peer', 'evidence']).optional(),
          note: z.string().optional()
        })
      )
    }
  },
  async (args) => textResult(await callTool(repo, 'functree_create_alignment', args))
);

server.registerTool(
  'functree_query_context',
  {
    title: '查询上下文',
    description: '按项目和关键词查询功能上下文。',
    inputSchema: {
      projectId: z.string().optional(),
      keyword: z.string().optional(),
      limit: z.number().optional()
    }
  },
  async (args) => textResult(await callTool(repo, 'functree_query_context', args))
);

await server.connect(new StdioServerTransport());
