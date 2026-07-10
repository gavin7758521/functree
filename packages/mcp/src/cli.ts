#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const VERSION = '0.2.0';
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
const queryContextTypes = ['project', 'feature_set', 'feature', 'alignment'] as const;

type Config = {
  serverUrl: string;
  timeoutMs: number;
};

const metadataSchema = z.record(z.string(), z.unknown()).optional().describe('Optional JSON metadata forwarded to FuncTree.');
const dryRunSchema = z.boolean().optional().describe('When true, return the planned operation and changed fields without writing data.');
const alignmentMemberSchema = z.object({
  targetType: z.enum(alignableTypes).describe('Type of aligned object.'),
  targetId: z.string().describe('ID of the aligned object.'),
  role: z.enum(alignmentRoles).optional().describe('Role of this member in the alignment. Defaults to peer.'),
  note: z.string().optional().describe('Optional member-specific note.')
});

const featureSetItemShape = {
  id: z.string().optional().describe('Optional concrete feature set ID. If omitted, FuncTree generates one.'),
  stableKey: z.string().optional().describe('Long-lived semantic key, for example backend.homeserver or web.frontend.'),
  name: z.string().describe('Feature set name, for example App frontend or Auth service.'),
  version: z.string().describe('Feature set version, release, or snapshot label.'),
  type: z.enum(featureSetTypes).describe('Feature set category.'),
  status: z.enum(featureSetStatuses).optional().describe('Feature set lifecycle status. Defaults to normal.'),
  description: z.string().optional().describe('Human-readable feature set summary.'),
  owner: z.string().optional().describe('Team, role, or person responsible for this feature set.'),
  metadata: metadataSchema
};

const featureItemShape = {
  id: z.string().optional().describe('Optional concrete feature object ID. If omitted, FuncTree generates one.'),
  parentFeatureId: z.string().nullable().optional().describe('Optional parent feature ID for child features.'),
  stableKey: z.string().describe('Long-lived semantic key, for example login or checkout.payment.'),
  name: z.string().describe('Feature display name.'),
  version: z.string().optional().describe('Feature version or release label. Defaults to 当前.'),
  status: z.enum(featureStatuses).optional().describe('Feature lifecycle status. Defaults to draft.'),
  kind: z.enum(featureKinds).optional().describe('Feature kind. Defaults to capability.'),
  description: z.string().optional().describe('Human-readable feature summary.'),
  sortOrder: z.number().int().min(0).max(100000).optional().describe('Optional sibling ordering value.'),
  metadata: metadataSchema
};

const alignmentItemShape = {
  id: z.string().optional().describe('Optional alignment ID. If omitted, FuncTree generates one.'),
  stableKey: z.string().optional().describe('Optional long-lived semantic key for this alignment.'),
  name: z.string().describe('Alignment name shown in FuncTree.'),
  relation: z.enum(alignmentRelations).optional().describe('Semantic relationship type. Defaults to corresponds_to.'),
  status: z.enum(alignmentStatuses).optional().describe('Alignment review status. Defaults to proposed.'),
  description: z.string().optional().describe('Human-readable alignment rationale.'),
  members: z.array(alignmentMemberSchema).min(2).describe('Two or more objects to align. All members must belong to the same FuncTree project.'),
  metadata: metadataSchema
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
      'Use functree_query_context before writing when IDs, stableKeys, existing feature sets, features, or alignments are uncertain.',
      'functree_query_context is read-only and supports keyword, types, stableKey, featureSetId, alignmentId, parentFeatureId, offset, and cursor filters.',
      'Write tools return operation, changedFields, data, and dryRun. operation is created, updated, unchanged, or dry_run.',
      'Use dryRun: true before large syncs to preview diffs. Use batch tools for bulk feature sets, features, or alignments.',
      'Alignment upsert de-duplicates by id, stableKey, or member set, so repeated frontend/backend relationship writes should update instead of duplicating.',
      'stableKey should be a long-lived semantic key such as backend.bots, web.frontend, login, or checkout.payment; id identifies a concrete FuncTree object instance.',
      'The create/upsert tools mutate the central FuncTree server and should normally require user approval.'
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
      description: z.string().optional().describe('Human-readable project summary.'),
      metadata: metadataSchema
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
      'Create or update a versioned feature set under a FuncTree project. Upserts by id or stableKey and returns operation plus changedFields.',
    inputSchema: {
      ...featureSetItemShape,
      projectId: z.string().describe('ID of the project that owns this feature set.'),
      dryRun: dryRunSchema
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
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
      'Create or update a feature inside a feature set. Upserts by id or stableKey+version and returns operation plus changedFields.',
    inputSchema: {
      ...featureItemShape,
      featureSetId: z.string().describe('ID of the feature set that owns this feature.'),
      dryRun: dryRunSchema
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_upsert_feature', args))
);

server.registerTool(
  'functree_upsert_alignment',
  {
    title: 'Create or update alignment relation',
    description:
      'Create or update a cross-level alignment relation. Upserts by id, stableKey, or member set to avoid duplicate frontend/backend/product/test relationships.',
    inputSchema: {
      ...alignmentItemShape,
      projectId: z.string().describe('ID of the project that owns the alignment.'),
      dryRun: dryRunSchema
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_upsert_alignment', args))
);

server.registerTool(
  'functree_create_alignment',
  {
    title: 'Create or update alignment relation',
    description:
      'Compatibility alias for functree_upsert_alignment. New clients should call functree_upsert_alignment.',
    inputSchema: {
      ...alignmentItemShape,
      projectId: z.string().describe('ID of the project that owns the alignment.'),
      dryRun: dryRunSchema
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_create_alignment', args))
);

server.registerTool(
  'functree_upsert_feature_sets_batch',
  {
    title: 'Batch upsert feature sets',
    description:
      'Batch upsert feature sets under one project. Supports dryRun and returns per-item operation, changedFields, and errors with rollback on write failure.',
    inputSchema: {
      projectId: z.string().describe('ID of the project that owns all feature sets in this batch.'),
      dryRun: dryRunSchema,
      items: z.array(z.object(featureSetItemShape)).min(1).max(100).describe('Feature sets to upsert.')
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_upsert_feature_sets_batch', args))
);

server.registerTool(
  'functree_upsert_features_batch',
  {
    title: 'Batch upsert features',
    description:
      'Batch upsert features under one feature set. Supports dryRun and returns per-item operation, changedFields, and errors with rollback on write failure.',
    inputSchema: {
      featureSetId: z.string().describe('ID of the feature set that owns all features in this batch.'),
      dryRun: dryRunSchema,
      items: z.array(z.object(featureItemShape)).min(1).max(300).describe('Features to upsert.')
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_upsert_features_batch', args))
);

server.registerTool(
  'functree_upsert_alignments_batch',
  {
    title: 'Batch upsert alignments',
    description:
      'Batch upsert alignments under one project. Each item upserts by id, stableKey, or member set and supports dryRun plus rollback on write failure.',
    inputSchema: {
      projectId: z.string().describe('ID of the project that owns all alignments in this batch.'),
      dryRun: dryRunSchema,
      items: z.array(z.object(alignmentItemShape)).min(1).max(100).describe('Alignments to upsert.')
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_upsert_alignments_batch', args))
);

server.registerTool(
  'functree_query_context',
  {
    title: 'Query FuncTree context',
    description:
      'Read project, feature set, feature, and alignment context from FuncTree. Use before writing when IDs, stableKeys, or existing relationships are uncertain.',
    inputSchema: {
      projectId: z.string().optional().describe('Optional project ID. When omitted, can return project overview context.'),
      keyword: z
        .string()
        .optional()
        .describe('Optional keyword matched against names, descriptions, versions, stableKeys, and IDs. Supports dot and hyphen fragments.'),
      types: z.array(z.enum(queryContextTypes)).min(1).max(4).optional().describe('Object types to return, for example ["feature"].'),
      featureSetId: z.string().optional().describe('Filter feature sets, features, or related alignments by feature set ID.'),
      stableKey: z.string().optional().describe('Exact stableKey filter for feature sets, features, or alignments.'),
      alignmentId: z.string().optional().describe('Filter alignments or alignment members by alignment ID.'),
      parentFeatureId: z.string().nullable().optional().describe('Filter features by parent feature ID. Use null for root features.'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(QUERY_CONTEXT_MAX_LIMIT)
        .optional()
        .describe('Maximum number of rows per returned object type. Defaults to 20.'),
      offset: z.number().int().min(0).max(100000).optional().describe('Offset for pagination. Defaults to 0.'),
      cursor: z.string().optional().describe('Cursor from the previous response page.nextCursor. Overrides offset when supplied.')
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
      throw new Error(`FuncTree Server call failed: ${response.status} ${formatHttpError(message)}`);
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

function formatHttpError(body: string): string {
  try {
    const parsed = JSON.parse(body) as { code?: string; message?: string; hint?: string; requestId?: string };
    return [parsed.code, parsed.message, parsed.hint ? `hint=${parsed.hint}` : '', parsed.requestId ? `requestId=${parsed.requestId}` : '']
      .filter(Boolean)
      .join(' ');
  } catch {
    return body;
  }
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
