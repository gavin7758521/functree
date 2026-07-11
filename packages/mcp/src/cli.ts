#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const VERSION = '0.4.0';
const DEFAULT_SERVER_URL = 'http://127.0.0.1:4174';
const DEFAULT_TIMEOUT_MS = 30_000;
const QUERY_CONTEXT_MAX_LIMIT = 200;

const projectStatuses = ['active', 'paused', 'archived'] as const;
const mapAxes = ['capability', 'product', 'web', 'backend', 'sdk', 'ops', 'data', 'test', 'docs', 'other'] as const;
const mapScopes = ['capability', 'implementation', 'contract', 'operation', 'validation', 'documentation', 'data', 'other'] as const;
const mapKinds = ['domain', 'app', 'service', 'package', 'module', 'api', 'database', 'deployment', 'test_suite', 'document', 'other'] as const;
const mapStatuses = ['normal', 'draft', 'frozen', 'archived', 'deprecated'] as const;
const featureStatuses = ['draft', 'in_progress', 'reviewing', 'completed', 'released', 'archived', 'deprecated', 'blocked', 'mock_only'] as const;
const featureKinds = ['capability', 'module', 'page', 'api', 'component', 'process', 'rule', 'test', 'doc', 'data', 'operation', 'other'] as const;
const entryPointKinds = ['app_root', 'router', 'server_bootstrap', 'http_api_root', 'cli', 'build', 'config', 'schema', 'deployment', 'test', 'other'] as const;
const codeReferenceKinds = ['file', 'class', 'function', 'component', 'api', 'route', 'table', 'migration', 'config', 'test', 'document', 'other'] as const;
const alignableTypes = ['project', 'map', 'feature', 'entry_point', 'code_reference'] as const;
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
  'related_to',
  'frontend_implements',
  'backend_implements',
  'sdk_exposes',
  'ops_deploys',
  'stores_data_for',
  'guards_permission_for',
  'mock_represents',
  'deprecated_by',
  'requires',
  'breaks_if_changed'
] as const;
const alignmentStatuses = ['proposed', 'confirmed', 'rejected', 'stale'] as const;
const alignmentRoles = ['source', 'target', 'peer', 'evidence'] as const;
const evidenceTypes = ['code_fact', 'doc_claim', 'inferred', 'planned', 'mock_only', 'deprecated'] as const;
const evidenceTargetTypes = ['map', 'feature', 'alignment', 'entry_point', 'code_reference'] as const;
const codeReferenceRoles = ['entry', 'core_logic', 'permission_check', 'storage', 'rendering', 'configuration', 'test', 'contract', 'adapter', 'other'] as const;
const queryContextTypes = ['project', 'map', 'feature', 'alignment', 'entry_point', 'code_reference', 'evidence'] as const;
const queryContextViews = ['full', 'lite'] as const;
const pathMatchModes = ['contains', 'exact', 'prefix'] as const;
const resolveStableKeyTypes = ['project', 'map', 'feature', 'alignment', 'entry_point', 'code_reference'] as const;
const scanRunStatuses = ['completed', 'failed', 'cancelled'] as const;
const programmingContextIncludes = ['entryPoints', 'codeReferences', 'alignments', 'risks', 'acceptanceCriteria', 'evidence', 'details', 'quality'] as const;

type Config = {
  serverUrl: string;
  timeoutMs: number;
};

const metadataSchema = z.record(z.string(), z.unknown()).optional().describe('Optional JSON metadata forwarded to FuncTree.');
const tagsSchema = z.array(z.string().min(1).max(60)).max(40).optional().describe('Optional tags for secondary grouping, not primary frontend/backend classification.');
const dryRunSchema = z.boolean().optional().describe('When true, return the planned operation and changed fields without writing data.');
const detailListSchema = z.array(z.string().min(1).max(800)).max(80).optional();
const featureDetailsSchema = z.object({
  intent: z.string().optional().describe('Problem or user/developer need this feature is intended to solve.'),
  currentBehavior: z.string().optional().describe('What the current running code actually does.'),
  expectedBehavior: z.string().optional().describe('Target behavior or desired end state.'),
  scope: z.string().optional().describe('What is in scope and out of scope for this feature.'),
  knownGaps: detailListSchema.describe('Known missing pieces or incomplete parts.'),
  openQuestions: detailListSchema.describe('Unresolved questions or decisions.'),
  acceptanceCriteria: detailListSchema.describe('Checks that prove the feature is acceptable.'),
  risks: detailListSchema.describe('Risks, edge cases, or boundary conditions.'),
  blocker: z.string().optional().describe('Blocking issue when status is blocked.'),
  replacement: z.string().optional().describe('Replacement feature or path when deprecated.'),
  deprecatedReason: z.string().optional().describe('Reason this feature is deprecated.'),
  mockBoundary: z.string().optional().describe('Boundary that explains why mock/prototype behavior is not real capability.'),
  detailsMarkdown: z.string().optional().describe('Long-form feature details in Markdown.'),
  lastVerifiedAt: z.string().optional().describe('Last verification timestamp or date.'),
  lastVerifiedCommit: z.string().optional().describe('Last verified Git commit SHA.')
});
const alignmentMemberSchema = z.object({
  targetType: z.enum(alignableTypes).describe('Type of aligned object.'),
  targetId: z.string().optional().describe('ID of the aligned object. Optional when stableKey is provided.'),
  stableKey: z.string().optional().describe('Stable key of the aligned object. For features, include mapStableKey or mapId when needed.'),
  mapId: z.string().optional().describe('Optional map ID used to disambiguate feature stableKey members.'),
  mapStableKey: z.string().optional().describe('Optional map stableKey used to disambiguate feature stableKey members.'),
  version: z.string().optional().describe('Optional feature version used to disambiguate feature stableKey members.'),
  role: z.enum(alignmentRoles).optional().describe('Role of this member in the alignment. Defaults to peer.'),
  note: z.string().optional().describe('Optional member-specific note.')
});

const mapItemShape = {
  id: z.string().optional().describe('Optional concrete map ID. If omitted, FuncTree generates one.'),
  stableKey: z.string().describe('Long-lived map key, for example product.chat, web.chat-ui, backend.matrix-chat-core, sdk.public-user-sdk, or ops.deployment.'),
  name: z.string().describe('Map display name, for example Chat product capability or Matrix backend core.'),
  version: z.string().optional().describe('Map version, release, or snapshot label. Defaults to 当前.'),
  axis: z.enum(mapAxes).describe('Primary axis. Use this instead of tags for product/web/backend/sdk/ops classification.'),
  scope: z.enum(mapScopes).describe('Scope of the map, such as capability, implementation, contract, operation, validation, documentation, or data.'),
  kind: z.enum(mapKinds).describe('Concrete map kind, such as domain, app, service, package, module, api, database, deployment, test_suite, or document.'),
  status: z.enum(mapStatuses).optional().describe('Map lifecycle status. Defaults to normal.'),
  description: z.string().optional().describe('Human-readable map summary.'),
  owner: z.string().optional().describe('Team, role, or person responsible for this map.'),
  tags: tagsSchema,
  metadata: metadataSchema
};

const featureItemShape = {
  id: z.string().optional().describe('Optional concrete feature object ID. If omitted, FuncTree generates one.'),
  mapId: z.string().optional().describe('Optional map ID. Batch items can override the batch-level map.'),
  mapStableKey: z.string().optional().describe('Optional map stableKey, for example web.chat-ui or backend.matrix-chat-core. Requires projectId.'),
  parentFeatureId: z.string().nullable().optional().describe('Optional parent feature ID for child features.'),
  stableKey: z.string().describe('Long-lived feature key inside the map, for example send-message or timeline.sync.'),
  name: z.string().describe('Feature display name.'),
  version: z.string().optional().describe('Feature version or release label. Defaults to 当前.'),
  status: z.enum(featureStatuses).optional().describe('Feature lifecycle status. Defaults to draft.'),
  kind: z.enum(featureKinds).optional().describe('Feature kind. Defaults to capability.'),
  description: z.string().optional().describe('Human-readable feature summary.'),
  sortOrder: z.number().int().min(0).max(100000).optional().describe('Optional sibling ordering value.'),
  tags: tagsSchema,
  details: featureDetailsSchema.optional().describe('Structured feature details. Use this especially for draft, in_progress, blocked, deprecated, or mock_only features.'),
  metadata: metadataSchema
};

const entryPointItemShape = {
  id: z.string().optional().describe('Optional concrete entry point ID. If omitted, FuncTree generates one.'),
  mapId: z.string().optional().describe('Optional map ID this entry point belongs to.'),
  mapStableKey: z.string().optional().describe('Optional map stableKey this entry point belongs to.'),
  stableKey: z.string().describe('Long-lived entry point key, for example web.app-root, backend.server-bootstrap, or ops.deploy-config.'),
  name: z.string().describe('Entry point display name.'),
  path: z.string().describe('Repository path or config path used as an analysis starting point.'),
  kind: z.enum(entryPointKinds).describe('Entry point kind.'),
  description: z.string().optional().describe('Why this file/config is an entry point.'),
  confidence: z.number().min(0).max(1).optional().describe('Confidence score from 0 to 1. Defaults to 1.'),
  scanRunId: z.string().optional().describe('Optional scan run ID marking where this entry point was discovered.'),
  metadata: metadataSchema
};

const codeReferenceItemShape = {
  id: z.string().optional().describe('Optional concrete code reference ID. If omitted, FuncTree generates one.'),
  mapId: z.string().optional().describe('Optional map ID this reference belongs to.'),
  mapStableKey: z.string().optional().describe('Optional map stableKey this reference belongs to.'),
  featureId: z.string().optional().describe('Optional feature ID this reference implements or documents.'),
  featureStableKey: z.string().optional().describe('Optional feature stableKey this reference implements or documents. Provide mapStableKey/mapId if ambiguous.'),
  featureVersion: z.string().optional().describe('Optional feature version used with featureStableKey.'),
  entryPointId: z.string().optional().describe('Optional entry point ID this reference is discovered from.'),
  entryPointStableKey: z.string().optional().describe('Optional entry point stableKey this reference is discovered from.'),
  stableKey: z.string().optional().describe('Optional long-lived reference key. If omitted, FuncTree de-duplicates by project, path, symbol, kind, and ownership.'),
  path: z.string().describe('Repository file path or document path.'),
  symbol: z.string().optional().describe('Optional symbol, route, table, component, function, class, or section name.'),
  kind: z.enum(codeReferenceKinds).describe('Reference kind.'),
  description: z.string().optional().describe('Human-readable reason this code reference matters.'),
  roleInFeature: z.enum(codeReferenceRoles).optional().describe('Why this reference matters to the feature, such as entry, core_logic, permission_check, storage, rendering, configuration, test, contract, adapter, or other.'),
  changeGuidance: z.string().optional().describe('Guidance for future agents when changing this file or symbol.'),
  verificationHint: z.string().optional().describe('How to verify changes touching this reference.'),
  blastRadius: z.string().optional().describe('Likely impact scope if this reference changes.'),
  lineStart: z.number().int().min(1).max(1000000).nullable().optional().describe('Optional 1-based start line.'),
  lineEnd: z.number().int().min(1).max(1000000).nullable().optional().describe('Optional 1-based end line.'),
  scanRunId: z.string().optional().describe('Optional scan run ID marking where this code reference was discovered.'),
  metadata: metadataSchema
};

const resolveStableKeyItemSchema = z.object({
  type: z.enum(resolveStableKeyTypes).describe('Object type to resolve.'),
  id: z.string().optional().describe('Optional concrete ID to validate within this project.'),
  stableKey: z.string().optional().describe('Stable key to resolve.'),
  mapId: z.string().optional().describe('Optional map ID for feature disambiguation.'),
  mapStableKey: z.string().optional().describe('Optional map stableKey for feature disambiguation.'),
  version: z.string().optional().describe('Optional feature version for feature disambiguation.'),
  path: z.string().optional().describe('Optional path fallback for entry_point or code_reference lookup.'),
  symbol: z.string().optional().describe('Optional code reference symbol used with path.'),
  kind: z.string().optional().describe('Optional code reference kind used with path.')
});

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

const evidenceItemShape = {
  id: z.string().optional().describe('Optional concrete evidence ID. If omitted, FuncTree generates one.'),
  targetType: z.enum(evidenceTargetTypes).describe('Object type this evidence supports: map, feature, alignment, entry_point, or code_reference.'),
  targetId: z.string().optional().describe('Concrete target ID. Optional when targetStableKey is provided.'),
  targetStableKey: z.string().optional().describe('Stable key of the target object. For features, include mapStableKey/mapId and optionally version.'),
  mapId: z.string().optional().describe('Optional map ID used to disambiguate feature targets.'),
  mapStableKey: z.string().optional().describe('Optional map stableKey used to disambiguate feature targets.'),
  version: z.string().optional().describe('Optional feature version used with feature targetStableKey.'),
  evidenceType: z.enum(evidenceTypes).describe('Evidence type. Use code_fact for running-code facts, doc_claim for docs, inferred for analysis, planned for future work, mock_only for prototypes, deprecated for legacy behavior.'),
  path: z.string().optional().describe('Optional source path for this evidence.'),
  symbol: z.string().optional().describe('Optional source symbol, route, section, test, or API name.'),
  lineStart: z.number().int().min(1).max(1000000).nullable().optional().describe('Optional 1-based source line start.'),
  lineEnd: z.number().int().min(1).max(1000000).nullable().optional().describe('Optional 1-based source line end.'),
  summary: z.string().optional().describe('Short evidence summary.'),
  confidence: z.number().min(0).max(1).optional().describe('Confidence from 0 to 1. Defaults to 1.'),
  commitSha: z.string().optional().describe('Git commit SHA where this evidence was verified.'),
  verifiedAt: z.string().optional().describe('Verification timestamp or date.'),
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
      'Use it after analyzing a repository to record Project -> Map -> Feature structure, important entry points, code references, and cross-layer alignments.',
      'Maps are first-class views such as product.chat, web.chat-ui, backend.matrix-chat-core, sdk.public-user-sdk, or ops.deployment.',
      'Use map axis/scope/kind for primary classification. Tags are only secondary labels.',
      'Entry points tell future agents where project analysis should start. A project can have multiple entry points across frontend, backend, CLI, config, schema, deployment, and test surfaces.',
      'Code references connect features and maps to concrete files, symbols, routes, tables, migrations, configs, tests, or documents.',
      'Use feature details for unfinished or uncertain work: intent, currentBehavior, expectedBehavior, scope, knownGaps, openQuestions, acceptanceCriteria, risks, and detailsMarkdown.',
      'Use evidence to separate running-code facts from documentation claims, inference, plans, mock-only behavior, and deprecated behavior. Never treat mock_only or planned evidence as real backend capability.',
      'Use functree_get_programming_context when preparing to change a feature; it returns prioritized entry points, key code references, alignments, impacted features, risks, acceptance criteria, evidence, and quality issues.',
      'Use functree_quality_report after syncs to find missing code references, missing alignments, missing code_fact evidence, thin draft/in_progress details, mock boundaries, and stale paths.',
      'The MCP adapter is a stateless bridge. It forwards all calls to the configured FuncTree HTTP server and does not store business data.',
      'Use functree_query_context before writing when IDs, stableKeys, existing maps, features, entry points, code references, or alignments are uncertain.',
      'Use functree_resolve_stable_keys when you need a stableKey -> id mapping for many objects before creating alignments.',
      'Use functree_project_summary after large syncs to confirm counts, latest scan, conflicts, evidence count, and orphan references.',
      'Use functree_query_path_context before updating code references for a file path to avoid duplicate near-identical references.',
      'functree_query_context is read-only and supports keyword, types, view: "lite", includeSummaryOnly, includeMembers, stableKey, mapId/mapStableKey, alignmentId, parentFeatureId, entryPointId, codeReferenceId, path/pathMode, offset, and cursor filters.',
      'Write tools return operation, changedFields, data, dryRun, and sometimes previewId. dryRun-created IDs are prefixed with preview_ and must not be reused as real IDs.',
      'Use dryRun: true before large syncs to preview diffs. Use batch tools for bulk maps, features, entry points, code references, or alignments.',
      'Alignment upsert de-duplicates by id, stableKey, or member set. Alignment members can use targetId or stableKey plus mapStableKey/version for features.',
      'Use functree_begin_scan and functree_finish_scan to record repoKey, branch, commitSha, summary, and incremental scan state.',
      'stableKey should be a long-lived semantic key. id identifies a concrete FuncTree object instance.',
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
      status: z.enum(projectStatuses).optional().describe('Project lifecycle status. Defaults to active.'),
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
  'functree_upsert_map',
  {
    title: 'Create or update FuncTree map',
    description:
      'Create or update a project map. Upserts by id or stableKey and returns operation plus changedFields.',
    inputSchema: {
      ...mapItemShape,
      projectId: z.string().describe('ID of the project that owns this map.'),
      dryRun: dryRunSchema
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_upsert_map', args))
);

server.registerTool(
  'functree_upsert_feature',
  {
    title: 'Create or update feature',
    description:
      'Create or update a feature inside a FuncTree map. Upserts by id or stableKey+version and returns operation plus changedFields.',
    inputSchema: {
      ...featureItemShape,
      projectId: z.string().optional().describe('Project ID. Required when using mapStableKey instead of mapId.'),
      mapId: z.string().optional().describe('ID of the map that owns this feature. Required unless mapStableKey is provided.'),
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
  'functree_upsert_entry_point',
  {
    title: 'Create or update entry point',
    description:
      'Create or update a repository analysis entry point such as app root, router, server bootstrap, API root, CLI, config, schema, deployment, or test entry.',
    inputSchema: {
      ...entryPointItemShape,
      projectId: z.string().describe('ID of the project that owns this entry point.'),
      dryRun: dryRunSchema
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_upsert_entry_point', args))
);

server.registerTool(
  'functree_upsert_code_reference',
  {
    title: 'Create or update code reference',
    description:
      'Create or update a concrete code reference for a map, feature, or entry point. Upserts by id, stableKey, or path signature.',
    inputSchema: {
      ...codeReferenceItemShape,
      projectId: z.string().describe('ID of the project that owns this code reference.'),
      dryRun: dryRunSchema
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_upsert_code_reference', args))
);

server.registerTool(
  'functree_upsert_evidence',
  {
    title: 'Create or update evidence',
    description:
      'Create or update first-class evidence for a feature, map, alignment, entry point, or code reference. Use evidenceType to separate code_fact, doc_claim, inferred, planned, mock_only, and deprecated facts.',
    inputSchema: {
      ...evidenceItemShape,
      projectId: z.string().describe('ID of the project that owns this evidence.'),
      dryRun: dryRunSchema
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_upsert_evidence', args))
);

server.registerTool(
  'functree_upsert_alignment',
  {
    title: 'Create or update alignment relation',
    description:
      'Create or update a cross-layer alignment relation. Upserts by id, stableKey, or member set to avoid duplicate product/frontend/backend/sdk/test relationships.',
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
  'functree_upsert_maps_batch',
  {
    title: 'Batch upsert maps',
    description:
      'Batch upsert maps under one project. Supports dryRun and returns per-item operation, changedFields, and errors with rollback on write failure.',
    inputSchema: {
      projectId: z.string().describe('ID of the project that owns all maps in this batch.'),
      dryRun: dryRunSchema,
      items: z.array(z.object(mapItemShape)).min(1).max(100).describe('Maps to upsert.')
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_upsert_maps_batch', args))
);

server.registerTool(
  'functree_upsert_features_batch',
  {
    title: 'Batch upsert features',
    description:
      'Batch upsert features under one or more maps. Supports item-level mapId/mapStableKey, dryRun, per-item operation, changedFields, and rollback on write failure.',
    inputSchema: {
      projectId: z.string().optional().describe('Project ID. Required when using mapStableKey at batch or item level.'),
      mapId: z.string().optional().describe('Default map ID for items that do not specify mapId/mapStableKey.'),
      mapStableKey: z.string().optional().describe('Default map stableKey for items that do not specify mapId/mapStableKey.'),
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
  'functree_upsert_entry_points_batch',
  {
    title: 'Batch upsert entry points',
    description:
      'Batch upsert entry points under one project. Supports dryRun and returns per-item operation, changedFields, and errors with rollback on write failure.',
    inputSchema: {
      projectId: z.string().describe('ID of the project that owns all entry points in this batch.'),
      dryRun: dryRunSchema,
      items: z.array(z.object(entryPointItemShape)).min(1).max(200).describe('Entry points to upsert.')
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_upsert_entry_points_batch', args))
);

server.registerTool(
  'functree_upsert_code_references_batch',
  {
    title: 'Batch upsert code references',
    description:
      'Batch upsert code references under one project. Supports dryRun and returns per-item operation, changedFields, and errors with rollback on write failure.',
    inputSchema: {
      projectId: z.string().describe('ID of the project that owns all code references in this batch.'),
      dryRun: dryRunSchema,
      items: z.array(z.object(codeReferenceItemShape)).min(1).max(500).describe('Code references to upsert.')
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_upsert_code_references_batch', args))
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
  'functree_upsert_evidence_batch',
  {
    title: 'Batch upsert evidence',
    description:
      'Batch upsert evidence under one project. Supports dryRun, per-item operation, changedFields, and rollback on write failure.',
    inputSchema: {
      projectId: z.string().describe('ID of the project that owns all evidence in this batch.'),
      dryRun: dryRunSchema,
      items: z.array(z.object(evidenceItemShape)).min(1).max(500).describe('Evidence items to upsert.')
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_upsert_evidence_batch', args))
);

server.registerTool(
  'functree_query_context',
  {
    title: 'Query FuncTree context',
    description:
      'Read project, map, feature, entry point, code reference, and alignment context from FuncTree. Use before writing when IDs, stableKeys, or existing relationships are uncertain.',
    inputSchema: {
      projectId: z.string().optional().describe('Optional project ID. When omitted, can return project overview context.'),
      keyword: z
        .string()
        .optional()
        .describe('Optional keyword matched against names, descriptions, versions, stableKeys, IDs, paths, and symbols. Supports dot and hyphen fragments.'),
      types: z.array(z.enum(queryContextTypes)).min(1).max(7).optional().describe('Object types to return, for example ["feature"], ["evidence"], or ["entry_point"].'),
      view: z.enum(queryContextViews).optional().describe('Use "lite" to return compact id/stableKey/name/type/mapId/path rows instead of full objects.'),
      includeSummaryOnly: z.boolean().optional().describe('When true, return only page totals and project summary without row arrays.'),
      includeMembers: z.boolean().optional().describe('When false, alignment rows omit members to reduce response size. Defaults to true.'),
      includeMetadata: z.boolean().optional().describe('When false in full view, omit metadata fields. Defaults to true.'),
      includeDetails: z.boolean().optional().describe('When true, feature rows include structured details. Defaults to false to keep broad queries light.'),
      mapId: z.string().optional().describe('Filter maps, features, entry points, code references, or related alignments by map ID.'),
      mapStableKey: z.string().optional().describe('Filter by map stableKey. Requires projectId.'),
      stableKey: z.string().optional().describe('Exact stableKey filter for maps, features, entry points, code references, or alignments.'),
      alignmentId: z.string().optional().describe('Filter alignments or alignment members by alignment ID.'),
      parentFeatureId: z.string().nullable().optional().describe('Filter features by parent feature ID. Use null for root features.'),
      entryPointId: z.string().optional().describe('Filter entry points, code references, features, or alignments by entry point ID.'),
      codeReferenceId: z.string().optional().describe('Filter code references, owning objects, or alignments by code reference ID.'),
      path: z.string().optional().describe('Filter entry points or code references by path fragment.'),
      pathMode: z.enum(pathMatchModes).optional().describe('Path match mode: contains, exact, or prefix. Defaults to contains.'),
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

server.registerTool(
  'functree_resolve_stable_keys',
  {
    title: 'Resolve FuncTree stable keys',
    description:
      'Resolve many stableKey references to concrete FuncTree IDs. Use this before writing alignments or code references when you only know stable keys.',
    inputSchema: {
      projectId: z.string().describe('Project ID that owns all resolved objects.'),
      items: z.array(resolveStableKeyItemSchema).min(1).max(500).describe('Objects to resolve.')
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_resolve_stable_keys', args))
);

server.registerTool(
  'functree_project_summary',
  {
    title: 'Get FuncTree project summary',
    description:
      'Return lightweight project counts, latest scan run, stableKey conflicts, orphan code references, and path coverage. Use after large syncs.',
    inputSchema: {
      projectId: z.string().describe('Project ID to summarize.')
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_project_summary', args))
);

server.registerTool(
  'functree_get_programming_context',
  {
    title: 'Get programming context for a feature',
    description:
      'Return action-oriented programming context for a feature: required entry points, key code references, related product capabilities, alignments, impacted features, evidence, risks, acceptance criteria, verification hints, and quality issues.',
    inputSchema: {
      projectId: z.string().describe('Project ID.'),
      featureId: z.string().optional().describe('Concrete feature ID. Optional when featureStableKey is provided.'),
      featureStableKey: z.string().optional().describe('Feature stableKey to resolve. Use with mapStableKey/mapId when needed.'),
      mapId: z.string().optional().describe('Optional map ID for featureStableKey disambiguation.'),
      mapStableKey: z.string().optional().describe('Optional map stableKey for featureStableKey disambiguation.'),
      featureVersion: z.string().optional().describe('Optional feature version for featureStableKey disambiguation.'),
      depth: z.number().int().min(0).max(3).optional().describe('How far to include parent/child/aligned features. Defaults to 1.'),
      include: z.array(z.enum(programmingContextIncludes)).min(1).max(8).optional().describe('Context sections to include. Defaults to all sections.')
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_get_programming_context', args))
);

server.registerTool(
  'functree_quality_report',
  {
    title: 'Get FuncTree quality report',
    description:
      'Return quality gaps for a project: missing code references, missing alignments, missing code_fact evidence, thin draft/in_progress/blocked details, missing mock boundaries, and optionally missing file paths.',
    inputSchema: {
      projectId: z.string().describe('Project ID.'),
      repoRoot: z.string().optional().describe('Optional local repository root used for path existence checks.'),
      includePathChecks: z.boolean().optional().describe('When true and repoRoot is set, check whether code reference paths exist.')
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_quality_report', args))
);

server.registerTool(
  'functree_query_path_context',
  {
    title: 'Query FuncTree path context',
    description:
      'Return entry points, code references, owning maps/features, and alignments for a file path. Use before incremental updates for a changed file.',
    inputSchema: {
      projectId: z.string().describe('Project ID.'),
      path: z.string().describe('Repository path or path fragment.'),
      pathMode: z.enum(pathMatchModes).optional().describe('Path match mode: contains, exact, or prefix. Defaults to contains.'),
      includeAlignments: z.boolean().optional().describe('Include alignments connected to matched objects. Defaults to true.'),
      includeReferences: z.boolean().optional().describe('Include code references. Defaults to true.')
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_query_path_context', args))
);

server.registerTool(
  'functree_begin_scan',
  {
    title: 'Begin FuncTree scan run',
    description:
      'Record the start of a repository scan with repoKey, branch, commitSha, baseCommitSha, and dirty state. Use the returned scanRunId on entry points and code references discovered by the scan.',
    inputSchema: {
      id: z.string().optional().describe('Optional scan run ID. If omitted, FuncTree generates one.'),
      projectId: z.string().describe('Project ID.'),
      repoKey: z.string().describe('Stable repository key, for example github:gavin7758521/functree or local monorepo package name.'),
      repoUrl: z.string().optional().describe('Optional repository URL.'),
      branch: z.string().optional().describe('Optional branch name.'),
      commitSha: z.string().min(7).max(64).describe('Git commit SHA scanned.'),
      baseCommitSha: z.string().min(7).max(64).optional().describe('Optional previous/base commit SHA for incremental scans.'),
      worktreeDirty: z.boolean().optional().describe('Whether uncommitted changes were present during scanning.'),
      metadata: metadataSchema
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_begin_scan', args))
);

server.registerTool(
  'functree_finish_scan',
  {
    title: 'Finish FuncTree scan run',
    description:
      'Complete a scan run with status and summary. Use after all entry points, code references, and alignments for the scan have been written.',
    inputSchema: {
      scanRunId: z.string().describe('Scan run ID returned by functree_begin_scan.'),
      status: z.enum(scanRunStatuses).optional().describe('Final scan status. Defaults to completed.'),
      summary: z.record(z.string(), z.unknown()).optional().describe('Counts or analysis summary from this scan.'),
      metadata: metadataSchema
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (args) => textResult(await callHttpTool(config, 'functree_finish_scan', args))
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

function formatHttpError(value: string): string {
  try {
    const parsed = JSON.parse(value) as { code?: string; message?: string; hint?: string; requestId?: string };
    return [parsed.code, parsed.message, parsed.hint, parsed.requestId ? `requestId=${parsed.requestId}` : ''].filter(Boolean).join(' ');
  } catch {
    return value;
  }
}

function printHelp(): void {
  console.log(`FuncTree MCP adapter ${VERSION}

Usage:
  functree-mcp --server-url http://192.168.124.82:4174

Options:
  --server-url <url>   FuncTree HTTP server URL. Defaults to FUNCTREE_SERVER_URL or ${DEFAULT_SERVER_URL}
  --timeout-ms <ms>    HTTP request timeout. Defaults to ${DEFAULT_TIMEOUT_MS}
  --version, -v        Print version
  --help, -h           Print help
`);
}
