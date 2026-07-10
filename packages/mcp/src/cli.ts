#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const VERSION = '0.1.1';
const DEFAULT_SERVER_URL = 'http://127.0.0.1:4174';
const DEFAULT_TIMEOUT_MS = 30_000;
const QUERY_CONTEXT_MAX_LIMIT = 200;

const projectStatus = ['active', 'paused', 'archived'] as const;
const featureSetTypes = ['frontend', 'backend', 'product', 'uiux', 'requirement', 'test', 'docs', 'ops', 'other'] as const;
const featureSetStatuses = ['normal', 'draft', 'frozen', 'archived', 'deprecated'] as const;
const featureStatuses = ['draft', 'in_progress', 'reviewing', 'completed', 'released', 'archived', 'deprecated', 'blocked'] as const;
const featureKinds = ['capability', 'module', 'page', 'api', 'component', 'process', 'rule', 'test', 'doc', 'other'] as const;
const alignableTypes = ['project', 'feature_set', 'feature'] as const;
const alignmentRelations = [
  'corresponds_to',
  'implements',
  'supports',
  'validates',
  'depends_on',
  'replaces',
  'conflicts_with',
  'covers',
  'decomposes_to',
  'related_to'
] as const;
const alignmentStatuses = ['proposed', 'confirmed', 'rejected', 'stale'] as const;
const alignmentRoles = ['source', 'target', 'peer', 'evidence'] as const;

type Config = {
  serverUrl: string;
  timeoutMs: number;
};

const config = readConfig(process.argv.slice(2), process.env);

const server = new McpServer(
  {
    name: 'functree',
    version: VERSION
  },
  {
    instructions: [
      'FuncTree is a remote feature knowledge-base service for software projects.',
      'Use it to record and query projects, feature sets, features, child features, versions, and cross-level alignment relationships.',
      'The MCP adapter is a stateless bridge. It forwards all calls to the configured FuncTree HTTP server and does not read local repositories or store business data.',
      'Use functree_query_context before writing when project IDs, feature set IDs, feature IDs, or existing alignments are uncertain.',
      'The create/upsert tools mutate the central FuncTree server and should normally require user approval. functree_query_context is read-only.',
      'stableKey should be a long-lived semantic key such as login or checkout.payment; id identifies a concrete FuncTree object instance.'
    ].join('\n')
  }
);

server.registerTool(
  'functree_create_project',
  {
    title: 'Create or update FuncTree project',
    description:
      'Create or update the top-level FuncTree project representing a product, system, repository group, or long-lived business workspace.',
    inputSchema: {
      id: z.string().optional().describe('Optional stable project ID. If omitted, FuncTree generates one.'),
      name: z.string().describe('Project name shown in the FuncTree console.'),
      status: z.enum(projectStatus).optional().describe('Project lifecycle status. Defaults to active.'),
      currentVersion: z.string().optional().describe('Current project version or release label. Defaults to 当前.'),
      description: z.string().optional().describe('Human-readable project summary.')
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_create_project', args))
);

server.registerTool(
  'functree_upsert_feature_set',
  {
    title: 'Create or update feature set',
    description:
      'Create or update a versioned feature set under a FuncTree project, such as frontend, backend, product requirements, UI/UX, tests, docs, or ops.',
    inputSchema: {
      id: z.string().optional().describe('Optional stable feature set ID. If omitted, FuncTree generates one.'),
      projectId: z.string().describe('ID of the project that owns this feature set.'),
      name: z.string().describe('Feature set name, for example App frontend or Auth service.'),
      version: z.string().describe('Feature set version, release, or snapshot label.'),
      type: z.enum(featureSetTypes).describe('Feature set category.'),
      status: z.enum(featureSetStatuses).optional().describe('Feature set lifecycle status. Defaults to normal.'),
      description: z.string().optional().describe('Human-readable feature set summary.'),
      owner: z.string().optional().describe('Team, role, or person responsible for this feature set.')
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_upsert_feature_set', args))
);

server.registerTool(
  'functree_upsert_feature',
  {
    title: 'Create or update feature',
    description:
      'Create or update a feature inside a feature set. Features can represent capabilities, modules, pages, APIs, components, processes, rules, tests, or docs, and may form parent-child trees.',
    inputSchema: {
      id: z.string().optional().describe('Optional concrete feature object ID. If omitted, FuncTree generates one.'),
      featureSetId: z.string().describe('ID of the feature set that owns this feature.'),
      parentFeatureId: z.string().nullable().optional().describe('Optional parent feature ID for child features.'),
      stableKey: z.string().describe('Long-lived semantic key, for example login or checkout.payment.'),
      name: z.string().describe('Feature display name.'),
      version: z.string().optional().describe('Feature version or release label. Defaults to 当前.'),
      status: z.enum(featureStatuses).optional().describe('Feature lifecycle status. Defaults to draft.'),
      kind: z.enum(featureKinds).optional().describe('Feature kind. Defaults to capability.'),
      description: z.string().optional().describe('Human-readable feature summary.')
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_upsert_feature', args))
);

server.registerTool(
  'functree_create_alignment',
  {
    title: 'Create or update alignment relation',
    description:
      'Create or update a cross-level alignment relation connecting two or more projects, feature sets, or features in the same project. Use this for product-to-frontend, frontend-to-backend, requirement-to-test, dependency, validation, coverage, decomposition, or conflict relationships.',
    inputSchema: {
      id: z.string().optional().describe('Optional alignment ID. If omitted, FuncTree generates one.'),
      projectId: z.string().describe('ID of the project that owns the alignment.'),
      name: z.string().describe('Alignment name shown in FuncTree.'),
      relation: z.enum(alignmentRelations).optional().describe('Semantic relationship type. Defaults to corresponds_to.'),
      status: z.enum(alignmentStatuses).optional().describe('Alignment review status. Defaults to proposed.'),
      description: z.string().optional().describe('Human-readable alignment rationale.'),
      members: z
        .array(
          z.object({
            targetType: z.enum(alignableTypes).describe('Type of aligned object.'),
            targetId: z.string().describe('ID of the aligned object.'),
            role: z.enum(alignmentRoles).optional().describe('Role of this member in the alignment. Defaults to peer.'),
            note: z.string().optional().describe('Optional member-specific note.')
          })
        )
        .min(2)
        .describe('Two or more objects to align. All members must belong to the same FuncTree project.')
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_create_alignment', args))
);

server.registerTool(
  'functree_query_context',
  {
    title: 'Query FuncTree context',
    description:
      'Read project, feature set, feature, and alignment context from FuncTree. Use this before making changes when IDs or existing feature knowledge are uncertain.',
    inputSchema: {
      projectId: z.string().optional().describe('Optional project ID. When omitted, returns project overview context.'),
      keyword: z.string().optional().describe('Optional keyword matched against indexed feature names, stable keys, versions, and descriptions.'),
      limit: z.number().int().min(1).max(QUERY_CONTEXT_MAX_LIMIT).optional().describe('Maximum number of features or alignments to return. Defaults to 20.')
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_query_context', args))
);

await server.connect(new StdioServerTransport());

async function callHttpTool(config: Config, name: string, args: unknown): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(`${config.serverUrl}/api/mcp/call`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, arguments: args ?? {} }),
      signal: controller.signal
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`FuncTree Server call failed: ${response.status} ${message}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function textResult(value: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

function readConfig(argv: string[], env: NodeJS.ProcessEnv): Config {
  const args = parseArgs(argv);

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.version) {
    console.log(VERSION);
    process.exit(0);
  }

  const serverUrl = normalizeServerUrl(args.serverUrl ?? env.FUNCTREE_SERVER_URL ?? DEFAULT_SERVER_URL);
  const timeoutMs = parsePositiveInt(args.timeoutMs ?? env.FUNCTREE_TIMEOUT_MS, DEFAULT_TIMEOUT_MS, 'timeout-ms');

  return { serverUrl, timeoutMs };
}

function parseArgs(argv: string[]) {
  const result: {
    serverUrl?: string;
    timeoutMs?: string;
    help?: boolean;
    version?: boolean;
  } = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }
    if (arg === '--version' || arg === '-v') {
      result.version = true;
      continue;
    }
    if (arg === '--server-url') {
      result.serverUrl = requireValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith('--server-url=')) {
      result.serverUrl = arg.slice('--server-url='.length);
      continue;
    }
    if (arg === '--timeout-ms') {
      result.timeoutMs = requireValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith('--timeout-ms=')) {
      result.timeoutMs = arg.slice('--timeout-ms='.length);
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return result;
}

function requireValue(argv: string[], index: number, name: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

function normalizeServerUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid FUNCTREE_SERVER_URL: ${value}`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('FUNCTREE_SERVER_URL must use http or https.');
  }

  return url.toString().replace(/\/+$/u, '');
}

function parsePositiveInt(value: string | undefined, fallback: number, label: string): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return parsed;
}

function printHelp(): void {
  console.log(`FuncTree MCP adapter ${VERSION}

Usage:
  functree-mcp [--server-url <url>] [--timeout-ms <ms>]

Environment:
  FUNCTREE_SERVER_URL   FuncTree HTTP server URL. Default: ${DEFAULT_SERVER_URL}
  FUNCTREE_TIMEOUT_MS   HTTP request timeout in milliseconds. Default: ${DEFAULT_TIMEOUT_MS}

Examples:
  functree-mcp --server-url http://<functree-server>:4174
  FUNCTREE_SERVER_URL=http://<functree-server>:4174 functree-mcp
`);
}
