import { z } from 'zod';

export const ProjectStatusSchema = z.enum(['active', 'paused', 'archived']);
export const MapAxisSchema = z.enum(['capability', 'product', 'web', 'backend', 'sdk', 'ops', 'data', 'test', 'docs', 'other']);
export const MapScopeSchema = z.enum(['capability', 'implementation', 'contract', 'operation', 'validation', 'documentation', 'data', 'other']);
export const MapKindSchema = z.enum(['domain', 'app', 'service', 'package', 'module', 'api', 'database', 'deployment', 'test_suite', 'document', 'other']);
export const MapStatusSchema = z.enum(['normal', 'draft', 'frozen', 'archived', 'deprecated']);
export const FeatureStatusSchema = z.enum([
  'draft',
  'in_progress',
  'reviewing',
  'completed',
  'released',
  'archived',
  'deprecated',
  'blocked',
  'mock_only'
]);
export const FeatureKindSchema = z.enum([
  'capability',
  'module',
  'page',
  'api',
  'component',
  'process',
  'rule',
  'test',
  'doc',
  'data',
  'operation',
  'other'
]);
export const EntryPointKindSchema = z.enum([
  'app_root',
  'router',
  'server_bootstrap',
  'http_api_root',
  'cli',
  'build',
  'config',
  'schema',
  'deployment',
  'test',
  'other'
]);
export const CodeReferenceKindSchema = z.enum([
  'file',
  'class',
  'function',
  'component',
  'api',
  'route',
  'table',
  'migration',
  'config',
  'test',
  'document',
  'other'
]);
export const AlignableTypeSchema = z.enum(['project', 'map', 'feature', 'entry_point', 'code_reference']);
export const AlignmentRelationSchema = z.enum([
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
  'mock_of',
  'backend_supports',
  'prototype_intent',
  'renames_or_aliases',
  'deprecated_by',
  'requires',
  'breaks_if_changed'
]);
export const AlignmentStatusSchema = z.enum(['proposed', 'confirmed', 'rejected', 'stale']);
export const AlignmentRoleSchema = z.enum(['source', 'target', 'peer', 'evidence']);
export const EvidenceTypeSchema = z.enum(['code_fact', 'doc_claim', 'inferred', 'planned', 'mock_only', 'deprecated']);
export const EvidenceSourceTypeSchema = z.enum(['runtime_code', 'test', 'api_route', 'migration_schema', 'product_prototype', 'docs', 'inference']);
export const EvidenceTargetTypeSchema = z.enum(['map', 'feature', 'alignment', 'entry_point', 'code_reference', 'capability_status', 'capability_gap']);
export const CodeReferenceRoleInFeatureSchema = z.enum([
  'entry',
  'core_logic',
  'permission_check',
  'storage',
  'rendering',
  'configuration',
  'test',
  'contract',
  'adapter',
  'other'
]);
export const QueryContextTypeSchema = z.enum(['project', 'map', 'feature', 'alignment', 'entry_point', 'code_reference', 'evidence']);
export const QueryContextViewSchema = z.enum(['full', 'lite']);
export const PathMatchModeSchema = z.enum(['contains', 'exact', 'prefix']);
export const ResolveStableKeyTypeSchema = z.enum(['project', 'map', 'feature', 'alignment', 'entry_point', 'code_reference']);
export const ScanRunStatusSchema = z.enum(['running', 'completed', 'failed', 'cancelled']);
export const ProgrammingContextIncludeSchema = z.enum(['entryPoints', 'codeReferences', 'alignments', 'risks', 'acceptanceCriteria', 'evidence', 'details', 'quality', 'statusMatrix', 'gaps']);
export const CapabilityImplementationStatusSchema = z.enum([
  'unknown',
  'none',
  'not_needed',
  'prototype',
  'spec',
  'approved',
  'mock',
  'partial',
  'live',
  'configured',
  'deployed',
  'deprecated'
]);
export const CapabilityGapTypeSchema = z.enum([
  'naming_conflict',
  'data_model_conflict',
  'entry_conflict',
  'status_conflict',
  'permission_conflict',
  'persistence_conflict',
  'mock_gap',
  'implementation_gap',
  'integration_gap',
  'behavior_conflict',
  'alias_conflict',
  'coverage_gap',
  'other'
]);
export const CapabilityGapSeveritySchema = z.enum(['high', 'medium', 'low']);
export const CapabilityGapStatusSchema = z.enum(['open', 'accepted', 'resolved', 'ignored']);

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type MapAxis = z.infer<typeof MapAxisSchema>;
export type MapScope = z.infer<typeof MapScopeSchema>;
export type MapKind = z.infer<typeof MapKindSchema>;
export type MapStatus = z.infer<typeof MapStatusSchema>;
export type FeatureStatus = z.infer<typeof FeatureStatusSchema>;
export type FeatureKind = z.infer<typeof FeatureKindSchema>;
export type EntryPointKind = z.infer<typeof EntryPointKindSchema>;
export type CodeReferenceKind = z.infer<typeof CodeReferenceKindSchema>;
export type AlignableType = z.infer<typeof AlignableTypeSchema>;
export type AlignmentRelation = z.infer<typeof AlignmentRelationSchema>;
export type AlignmentStatus = z.infer<typeof AlignmentStatusSchema>;
export type AlignmentRole = z.infer<typeof AlignmentRoleSchema>;
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;
export type EvidenceSourceType = z.infer<typeof EvidenceSourceTypeSchema>;
export type EvidenceTargetType = z.infer<typeof EvidenceTargetTypeSchema>;
export type CodeReferenceRoleInFeature = z.infer<typeof CodeReferenceRoleInFeatureSchema>;
export type QueryContextType = z.infer<typeof QueryContextTypeSchema>;
export type QueryContextView = z.infer<typeof QueryContextViewSchema>;
export type PathMatchMode = z.infer<typeof PathMatchModeSchema>;
export type ResolveStableKeyType = z.infer<typeof ResolveStableKeyTypeSchema>;
export type ScanRunStatus = z.infer<typeof ScanRunStatusSchema>;
export type ProgrammingContextInclude = z.infer<typeof ProgrammingContextIncludeSchema>;
export type CapabilityImplementationStatus = z.infer<typeof CapabilityImplementationStatusSchema>;
export type CapabilityGapType = z.infer<typeof CapabilityGapTypeSchema>;
export type CapabilityGapSeverity = z.infer<typeof CapabilityGapSeveritySchema>;
export type CapabilityGapStatus = z.infer<typeof CapabilityGapStatusSchema>;

const IdSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/u, 'ID 只能包含字母、数字、下划线和中划线，并且必须以字母或数字开头');

const TextSchema = z.string().trim().min(1).max(200);
const OptionalTextSchema = z.string().trim().max(4000).optional().default('');
const OptionalShortTextSchema = z.string().trim().max(200).optional().default('');
const VersionSchema = z.string().trim().min(1).max(80).default('当前');
const MetadataSchema = z.record(z.string(), z.unknown()).optional().default({});
const TagsSchema = z.array(z.string().trim().min(1).max(60)).max(40).optional().default([]);
const DetailListSchema = z.array(z.string().trim().min(1).max(800)).max(80).optional().default([]);
const EvidenceIdsSchema = z.array(IdSchema).max(100).optional().default([]);
const BooleanQuerySchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return value;
}, z.boolean());
export const QUERY_CONTEXT_MAX_LIMIT = 200;
const StableKeySchema = z.string().trim().min(1).max(180);
const PathSchema = z.string().trim().min(1).max(600);
const CommitShaSchema = z
  .string()
  .trim()
  .min(7)
  .max(64)
  .regex(/^[0-9a-fA-F]+$/u, 'commitSha 必须是 7 到 64 位十六进制 Git commit。');
const DryRunSchema = z.boolean().optional().default(false);

export const FeatureDetailSchema = z.object({
  intent: OptionalTextSchema,
  currentBehavior: OptionalTextSchema,
  expectedBehavior: OptionalTextSchema,
  scope: OptionalTextSchema,
  knownGaps: DetailListSchema,
  openQuestions: DetailListSchema,
  acceptanceCriteria: DetailListSchema,
  risks: DetailListSchema,
  blocker: OptionalTextSchema,
  replacement: OptionalTextSchema,
  deprecatedReason: OptionalTextSchema,
  mockBoundary: OptionalTextSchema,
  detailsMarkdown: z.string().trim().max(20000).optional().default(''),
  lastVerifiedAt: z.string().trim().max(80).optional().default(''),
  lastVerifiedCommit: CommitShaSchema.optional()
});

export const CreateProjectSchema = z.object({
  id: IdSchema.optional(),
  name: TextSchema,
  status: ProjectStatusSchema.default('active'),
  currentVersion: VersionSchema,
  description: OptionalTextSchema,
  metadata: MetadataSchema
});

export const UpdateProjectSchema = CreateProjectSchema.partial().omit({ id: true });

export const CreateMapSchema = z.object({
  id: IdSchema.optional(),
  projectId: IdSchema.optional(),
  stableKey: StableKeySchema,
  name: TextSchema,
  version: VersionSchema,
  axis: MapAxisSchema,
  scope: MapScopeSchema,
  kind: MapKindSchema,
  status: MapStatusSchema.default('normal'),
  description: OptionalTextSchema,
  owner: OptionalShortTextSchema,
  tags: TagsSchema,
  metadata: MetadataSchema,
  dryRun: DryRunSchema
});

export const UpdateMapSchema = CreateMapSchema.partial().omit({ id: true, projectId: true, dryRun: true });

export const CreateFeatureSchema = z.object({
  id: IdSchema.optional(),
  projectId: IdSchema.optional(),
  mapId: IdSchema.optional(),
  mapStableKey: StableKeySchema.optional(),
  parentFeatureId: IdSchema.nullable().optional().default(null),
  stableKey: StableKeySchema,
  name: TextSchema,
  version: VersionSchema,
  status: FeatureStatusSchema.default('draft'),
  kind: FeatureKindSchema.default('capability'),
  description: OptionalTextSchema,
  sortOrder: z.number().int().min(0).max(100000).optional().default(0),
  tags: TagsSchema,
  details: FeatureDetailSchema.optional(),
  metadata: MetadataSchema,
  dryRun: DryRunSchema
});

export const UpdateFeatureSchema = CreateFeatureSchema.partial().omit({
  id: true,
  projectId: true,
  mapId: true,
  dryRun: true
});

export const CreateEntryPointSchema = z.object({
  id: IdSchema.optional(),
  projectId: IdSchema.optional(),
  mapId: IdSchema.optional(),
  mapStableKey: StableKeySchema.optional(),
  stableKey: StableKeySchema,
  name: TextSchema,
  path: PathSchema,
  kind: EntryPointKindSchema,
  description: OptionalTextSchema,
  confidence: z.number().min(0).max(1).optional().default(1),
  scanRunId: IdSchema.optional(),
  metadata: MetadataSchema,
  dryRun: DryRunSchema
});

export const UpdateEntryPointSchema = CreateEntryPointSchema.partial().omit({ id: true, projectId: true, dryRun: true });

export const CreateCodeReferenceSchema = z.object({
  id: IdSchema.optional(),
  projectId: IdSchema.optional(),
  mapId: IdSchema.optional(),
  mapStableKey: StableKeySchema.optional(),
  featureId: IdSchema.optional(),
  featureStableKey: StableKeySchema.optional(),
  featureVersion: z.string().trim().min(1).max(80).optional(),
  entryPointId: IdSchema.optional(),
  entryPointStableKey: StableKeySchema.optional(),
  stableKey: StableKeySchema.optional(),
  path: PathSchema,
  symbol: OptionalShortTextSchema,
  kind: CodeReferenceKindSchema,
  description: OptionalTextSchema,
  roleInFeature: CodeReferenceRoleInFeatureSchema.optional(),
  changeGuidance: z.string().trim().max(8000).optional(),
  verificationHint: z.string().trim().max(4000).optional(),
  blastRadius: z.string().trim().max(2000).optional(),
  lineStart: z.number().int().min(1).max(1000000).nullable().optional().default(null),
  lineEnd: z.number().int().min(1).max(1000000).nullable().optional().default(null),
  scanRunId: IdSchema.optional(),
  metadata: MetadataSchema,
  dryRun: DryRunSchema
});

export const UpdateCodeReferenceSchema = CreateCodeReferenceSchema.partial().omit({ id: true, projectId: true, dryRun: true });

export const AlignmentMemberSchema = z.object({
  targetType: AlignableTypeSchema,
  targetId: IdSchema.optional(),
  stableKey: StableKeySchema.optional(),
  mapId: IdSchema.optional(),
  mapStableKey: StableKeySchema.optional(),
  version: z.string().trim().min(1).max(80).optional(),
  role: AlignmentRoleSchema.default('peer'),
  note: z.string().trim().max(1000).optional().default('')
}).refine((member) => Boolean(member.targetId || member.stableKey), {
  message: 'alignment member 需要 targetId 或 stableKey。',
  path: ['targetId']
});

export const CreateAlignmentSchema = z.object({
  id: IdSchema.optional(),
  projectId: IdSchema.optional(),
  stableKey: StableKeySchema.optional(),
  name: TextSchema,
  relation: AlignmentRelationSchema.default('corresponds_to'),
  status: AlignmentStatusSchema.default('proposed'),
  description: OptionalTextSchema,
  members: z.array(AlignmentMemberSchema).min(2).max(20),
  metadata: MetadataSchema,
  dryRun: DryRunSchema
});

export const UpdateAlignmentSchema = CreateAlignmentSchema.partial().omit({ id: true, projectId: true, dryRun: true });

const CreateEvidenceBaseSchema = z.object({
  id: IdSchema.optional(),
  projectId: IdSchema.optional(),
  targetType: EvidenceTargetTypeSchema,
  targetId: IdSchema.optional(),
  targetStableKey: StableKeySchema.optional(),
  mapId: IdSchema.optional(),
  mapStableKey: StableKeySchema.optional(),
  version: z.string().trim().min(1).max(80).optional(),
  evidenceType: EvidenceTypeSchema,
  path: PathSchema.optional(),
  symbol: OptionalShortTextSchema,
  lineStart: z.number().int().min(1).max(1000000).nullable().optional().default(null),
  lineEnd: z.number().int().min(1).max(1000000).nullable().optional().default(null),
  summary: OptionalTextSchema,
  confidence: z.number().min(0).max(1).optional().default(1),
  sourceType: EvidenceSourceTypeSchema.optional().default('runtime_code'),
  sourcePriority: z.number().int().min(1).max(100).optional().default(80),
  commitSha: CommitShaSchema.optional(),
  verifiedAt: z.string().trim().max(80).optional().default(''),
  metadata: MetadataSchema,
  dryRun: DryRunSchema
});

export const CreateEvidenceSchema = CreateEvidenceBaseSchema.refine((input) => Boolean(input.targetId || input.targetStableKey), {
  message: 'evidence 需要 targetId 或 targetStableKey。',
  path: ['targetId']
});

const CapabilityTargetReferenceSchema = z.object({
  projectId: IdSchema.optional(),
  canonicalFeatureId: IdSchema.optional(),
  canonicalFeatureStableKey: StableKeySchema.optional(),
  canonicalMapId: IdSchema.optional(),
  canonicalMapStableKey: StableKeySchema.optional(),
  canonicalFeatureVersion: z.string().trim().min(1).max(80).optional(),
  mapId: IdSchema.optional(),
  mapStableKey: StableKeySchema.optional(),
  featureId: IdSchema.optional(),
  featureStableKey: StableKeySchema.optional(),
  featureVersion: z.string().trim().min(1).max(80).optional()
});

const CapabilityTargetRefinement = (input: z.infer<typeof CapabilityTargetReferenceSchema>) =>
  Boolean(input.canonicalFeatureId || input.canonicalFeatureStableKey);

const CreateCapabilityStatusBaseSchema = CapabilityTargetReferenceSchema.extend({
  id: IdSchema.optional(),
  status: CapabilityImplementationStatusSchema.default('unknown'),
  summary: OptionalTextSchema,
  gaps: DetailListSchema,
  recommendedAction: OptionalTextSchema,
  evidenceIds: EvidenceIdsSchema,
  metadata: MetadataSchema,
  dryRun: DryRunSchema
});

export const CreateCapabilityStatusSchema = CreateCapabilityStatusBaseSchema.refine(CapabilityTargetRefinement, {
  message: '能力状态需要 canonicalFeatureId 或 canonicalFeatureStableKey。',
  path: ['canonicalFeatureId']
}).refine((input) => Boolean(input.mapId || input.mapStableKey), {
  message: '能力状态需要 mapId 或 mapStableKey，用来表达哪个 map 的实现状态。',
  path: ['mapId']
});

const CreateCapabilityGapBaseSchema = CapabilityTargetReferenceSchema.extend({
  id: IdSchema.optional(),
  stableKey: StableKeySchema.optional(),
  title: TextSchema,
  gapType: CapabilityGapTypeSchema,
  severity: CapabilityGapSeveritySchema.default('medium'),
  status: CapabilityGapStatusSchema.default('open'),
  description: OptionalTextSchema,
  evidenceIds: EvidenceIdsSchema,
  recommendedAction: OptionalTextSchema,
  ownerMapId: IdSchema.optional(),
  ownerMapStableKey: StableKeySchema.optional(),
  metadata: MetadataSchema,
  dryRun: DryRunSchema
});

export const CreateCapabilityGapSchema = CreateCapabilityGapBaseSchema.refine(CapabilityTargetRefinement, {
  message: '缺口/冲突需要 canonicalFeatureId 或 canonicalFeatureStableKey。',
  path: ['canonicalFeatureId']
});

export const QueryContextSchema = z.object({
  projectId: IdSchema.optional(),
  keyword: z.string().trim().max(120).optional().default(''),
  types: z.array(QueryContextTypeSchema).min(1).max(7).optional(),
  view: QueryContextViewSchema.optional().default('full'),
  includeSummaryOnly: BooleanQuerySchema.optional().default(false),
  includeMembers: BooleanQuerySchema.optional().default(true),
  includeMetadata: BooleanQuerySchema.optional().default(true),
  includeDetails: BooleanQuerySchema.optional().default(false),
  mapId: IdSchema.optional(),
  mapStableKey: StableKeySchema.optional(),
  stableKey: z.string().trim().min(1).max(180).optional(),
  alignmentId: IdSchema.optional(),
  parentFeatureId: IdSchema.nullable().optional(),
  entryPointId: IdSchema.optional(),
  codeReferenceId: IdSchema.optional(),
  path: z.string().trim().min(1).max(600).optional(),
  pathMode: PathMatchModeSchema.optional().default('contains'),
  limit: z.number().int().min(1).max(QUERY_CONTEXT_MAX_LIMIT).optional().default(20),
  offset: z.number().int().min(0).max(100000).optional().default(0),
  cursor: z.string().trim().max(40).optional()
});

export const BatchMapSchema = z.object({
  projectId: IdSchema,
  dryRun: DryRunSchema,
  items: z.array(CreateMapSchema.omit({ projectId: true, dryRun: true })).min(1).max(100)
});

export const BatchFeatureSchema = z.object({
  projectId: IdSchema.optional(),
  mapId: IdSchema.optional(),
  mapStableKey: StableKeySchema.optional(),
  dryRun: DryRunSchema,
  items: z.array(CreateFeatureSchema.omit({ projectId: true, dryRun: true })).min(1).max(300)
}).superRefine((batch, context) => {
  const hasItemWithoutMap = batch.items.some((item) => !item.mapId && !item.mapStableKey);
  if (hasItemWithoutMap && !batch.mapId && !batch.mapStableKey) {
    context.addIssue({
      code: 'custom',
      message: '批量写入功能时，需要提供顶层 mapId/mapStableKey，或在每个 item 上提供 mapId/mapStableKey。',
      path: ['items']
    });
  }
  const needsProjectId = Boolean(batch.mapStableKey || batch.items.some((item) => item.mapStableKey));
  if (needsProjectId && !batch.projectId) {
    context.addIssue({
      code: 'custom',
      message: '使用 mapStableKey 写入功能时 projectId 必填。',
      path: ['projectId']
    });
  }
});

export const BatchEntryPointSchema = z.object({
  projectId: IdSchema,
  dryRun: DryRunSchema,
  items: z.array(CreateEntryPointSchema.omit({ projectId: true, dryRun: true })).min(1).max(200)
});

export const BatchCodeReferenceSchema = z.object({
  projectId: IdSchema,
  dryRun: DryRunSchema,
  items: z.array(CreateCodeReferenceSchema.omit({ projectId: true, dryRun: true })).min(1).max(500)
});

export const BatchAlignmentSchema = z.object({
  projectId: IdSchema,
  dryRun: DryRunSchema,
  items: z.array(CreateAlignmentSchema.omit({ projectId: true, dryRun: true })).min(1).max(100)
});

export const BatchEvidenceSchema = z.object({
  projectId: IdSchema,
  dryRun: DryRunSchema,
  items: z.array(CreateEvidenceBaseSchema.omit({ projectId: true, dryRun: true })).min(1).max(500)
});

export const BatchCapabilityStatusSchema = z.object({
  projectId: IdSchema,
  dryRun: DryRunSchema,
  items: z.array(CreateCapabilityStatusBaseSchema.omit({ projectId: true, dryRun: true })).min(1).max(500)
});

export const BatchCapabilityGapSchema = z.object({
  projectId: IdSchema,
  dryRun: DryRunSchema,
  items: z.array(CreateCapabilityGapBaseSchema.omit({ projectId: true, dryRun: true })).min(1).max(500)
});

export const ResolveStableKeyItemSchema = z.object({
  type: ResolveStableKeyTypeSchema,
  id: IdSchema.optional(),
  stableKey: StableKeySchema.optional(),
  mapId: IdSchema.optional(),
  mapStableKey: StableKeySchema.optional(),
  version: z.string().trim().min(1).max(80).optional(),
  path: PathSchema.optional(),
  symbol: OptionalShortTextSchema,
  kind: z.union([FeatureKindSchema, EntryPointKindSchema, CodeReferenceKindSchema]).optional()
}).refine((item) => Boolean(item.id || item.stableKey || item.path), {
  message: '解析 stableKey 时需要 id、stableKey 或 path。',
  path: ['stableKey']
});

export const ResolveStableKeysSchema = z.object({
  projectId: IdSchema,
  items: z.array(ResolveStableKeyItemSchema).min(1).max(500)
});

export const ProjectSummarySchema = z.object({
  projectId: IdSchema
});

export const CapabilityMatrixSchema = z.object({
  projectId: IdSchema,
  canonicalFeatureId: IdSchema.optional(),
  canonicalFeatureStableKey: StableKeySchema.optional(),
  canonicalMapId: IdSchema.optional(),
  canonicalMapStableKey: StableKeySchema.optional(),
  canonicalFeatureVersion: z.string().trim().min(1).max(80).optional(),
  mapId: IdSchema.optional(),
  mapStableKey: StableKeySchema.optional(),
  includeGaps: BooleanQuerySchema.optional().default(true),
  includeEvidence: BooleanQuerySchema.optional().default(true)
});

export const ProgrammingContextSchema = z.object({
  projectId: IdSchema,
  featureId: IdSchema.optional(),
  featureStableKey: StableKeySchema.optional(),
  mapId: IdSchema.optional(),
  mapStableKey: StableKeySchema.optional(),
  featureVersion: z.string().trim().min(1).max(80).optional(),
  depth: z.number().int().min(0).max(3).optional().default(1),
  include: z.array(ProgrammingContextIncludeSchema).min(1).max(10).optional().default([
    'entryPoints',
    'codeReferences',
    'alignments',
    'risks',
    'acceptanceCriteria',
    'evidence',
    'details',
    'quality',
    'statusMatrix',
    'gaps'
  ])
}).refine((input) => Boolean(input.featureId || input.featureStableKey), {
  message: 'programming context 需要 featureId 或 featureStableKey。',
  path: ['featureId']
});

export const QualityReportSchema = z.object({
  projectId: IdSchema,
  repoRoot: z.string().trim().max(800).optional(),
  includePathChecks: BooleanQuerySchema.optional().default(false)
});

export const QueryPathContextSchema = z.object({
  projectId: IdSchema,
  path: PathSchema,
  pathMode: PathMatchModeSchema.optional().default('contains'),
  includeAlignments: BooleanQuerySchema.optional().default(true),
  includeReferences: BooleanQuerySchema.optional().default(true)
});

export const BeginScanSchema = z.object({
  id: IdSchema.optional(),
  projectId: IdSchema,
  repoKey: z.string().trim().min(1).max(180),
  repoUrl: z.string().trim().max(500).optional().default(''),
  branch: z.string().trim().max(180).optional().default(''),
  commitSha: CommitShaSchema,
  baseCommitSha: CommitShaSchema.optional(),
  worktreeDirty: z.boolean().optional().default(false),
  metadata: MetadataSchema
});

export const FinishScanSchema = z.object({
  scanRunId: IdSchema,
  status: ScanRunStatusSchema.exclude(['running']).default('completed'),
  summary: z.record(z.string(), z.unknown()).optional().default({}),
  metadata: MetadataSchema
});

export type CreateProjectInput = z.input<typeof CreateProjectSchema>;
export type CreateMapInput = z.input<typeof CreateMapSchema>;
export type CreateFeatureInput = z.input<typeof CreateFeatureSchema>;
export type CreateEntryPointInput = z.input<typeof CreateEntryPointSchema>;
export type CreateCodeReferenceInput = z.input<typeof CreateCodeReferenceSchema>;
export type CreateAlignmentInput = z.input<typeof CreateAlignmentSchema>;
export type CreateEvidenceInput = z.input<typeof CreateEvidenceSchema>;
export type CreateCapabilityStatusInput = z.input<typeof CreateCapabilityStatusSchema>;
export type CreateCapabilityGapInput = z.input<typeof CreateCapabilityGapSchema>;
export type QueryContextInput = z.input<typeof QueryContextSchema>;
export type BatchMapInput = z.input<typeof BatchMapSchema>;
export type BatchFeatureInput = z.input<typeof BatchFeatureSchema>;
export type BatchEntryPointInput = z.input<typeof BatchEntryPointSchema>;
export type BatchCodeReferenceInput = z.input<typeof BatchCodeReferenceSchema>;
export type BatchAlignmentInput = z.input<typeof BatchAlignmentSchema>;
export type BatchEvidenceInput = z.input<typeof BatchEvidenceSchema>;
export type BatchCapabilityStatusInput = z.input<typeof BatchCapabilityStatusSchema>;
export type BatchCapabilityGapInput = z.input<typeof BatchCapabilityGapSchema>;
export type ResolveStableKeysInput = z.input<typeof ResolveStableKeysSchema>;
export type ProjectSummaryInput = z.input<typeof ProjectSummarySchema>;
export type CapabilityMatrixInput = z.input<typeof CapabilityMatrixSchema>;
export type ProgrammingContextInput = z.input<typeof ProgrammingContextSchema>;
export type QualityReportInput = z.input<typeof QualityReportSchema>;
export type QueryPathContextInput = z.input<typeof QueryPathContextSchema>;
export type BeginScanInput = z.input<typeof BeginScanSchema>;
export type FinishScanInput = z.input<typeof FinishScanSchema>;

export const labels = {
  projectStatus: {
    active: '活跃',
    paused: '暂停',
    archived: '归档'
  } satisfies Record<ProjectStatus, string>,
  mapAxis: {
    capability: '业务能力',
    product: '产品',
    web: '前端',
    backend: '后端',
    sdk: 'SDK',
    ops: '运维',
    data: '数据',
    test: '测试',
    docs: '文档',
    other: '其他'
  } satisfies Record<MapAxis, string>,
  mapScope: {
    capability: '能力',
    implementation: '实现',
    contract: '契约',
    operation: '运维',
    validation: '验证',
    documentation: '文档',
    data: '数据',
    other: '其他'
  } satisfies Record<MapScope, string>,
  mapKind: {
    domain: '领域',
    app: '应用',
    service: '服务',
    package: '包',
    module: '模块',
    api: 'API',
    database: '数据库',
    deployment: '部署',
    test_suite: '测试集',
    document: '文档',
    other: '其他'
  } satisfies Record<MapKind, string>,
  mapStatus: {
    normal: '正常',
    draft: '草稿',
    frozen: '冻结',
    archived: '归档',
    deprecated: '废弃'
  } satisfies Record<MapStatus, string>,
  featureStatus: {
    draft: '草稿',
    in_progress: '进行中',
    reviewing: '待评审',
    completed: '已完成',
    released: '已上线',
    archived: '已归档',
    deprecated: '已废弃',
    blocked: '阻塞中',
    mock_only: '仅 Mock'
  } satisfies Record<FeatureStatus, string>,
  entryPointKind: {
    app_root: '应用入口',
    router: '路由入口',
    server_bootstrap: '服务启动',
    http_api_root: 'HTTP API 入口',
    cli: 'CLI',
    build: '构建',
    config: '配置',
    schema: 'Schema',
    deployment: '部署',
    test: '测试',
    other: '其他'
  } satisfies Record<EntryPointKind, string>,
  codeReferenceKind: {
    file: '文件',
    class: '类',
    function: '函数',
    component: '组件',
    api: 'API',
    route: '路由',
    table: '表',
    migration: '迁移',
    config: '配置',
    test: '测试',
    document: '文档',
    other: '其他'
  } satisfies Record<CodeReferenceKind, string>,
  alignmentRelation: {
    corresponds_to: '对应',
    implements: '实现',
    supports: '支撑',
    validates: '验证',
    depends_on: '依赖',
    replaces: '替代',
    conflicts_with: '冲突',
    covers: '覆盖',
    decomposes_to: '拆解',
    related_to: '关联',
    frontend_implements: '前端实现',
    backend_implements: '后端实现',
    sdk_exposes: 'SDK 暴露',
    ops_deploys: '运维部署',
    stores_data_for: '存储数据',
    guards_permission_for: '权限保护',
    mock_represents: 'Mock 表示',
    mock_of: '是 Mock',
    backend_supports: '后端支撑',
    prototype_intent: '原型意图',
    renames_or_aliases: '别名/重命名',
    deprecated_by: '被替代',
    requires: '需要',
    breaks_if_changed: '变更会破坏'
  } satisfies Record<AlignmentRelation, string>,
  alignmentStatus: {
    proposed: '待确认',
    confirmed: '已确认',
    rejected: '已拒绝',
    stale: '已过期'
  } satisfies Record<AlignmentStatus, string>,
  evidenceType: {
    code_fact: '代码事实',
    doc_claim: '文档声称',
    inferred: '推断',
    planned: '计划',
    mock_only: '仅 Mock',
    deprecated: '废弃'
  } satisfies Record<EvidenceType, string>,
  evidenceSourceType: {
    runtime_code: '运行代码',
    test: '测试',
    api_route: 'API 路由',
    migration_schema: '迁移/Schema',
    product_prototype: '产品原型',
    docs: '文档',
    inference: '推断'
  } satisfies Record<EvidenceSourceType, string>,
  codeReferenceRoleInFeature: {
    entry: '入口',
    core_logic: '核心逻辑',
    permission_check: '权限检查',
    storage: '存储',
    rendering: '渲染',
    configuration: '配置',
    test: '测试',
    contract: '契约',
    adapter: '适配',
    other: '其他'
  } satisfies Record<CodeReferenceRoleInFeature, string>,
  capabilityImplementationStatus: {
    unknown: '未知',
    none: '无实现',
    not_needed: '不需要',
    prototype: '原型',
    spec: '规格',
    approved: '已确认',
    mock: 'Mock',
    partial: '部分实现',
    live: '真实可用',
    configured: '已配置',
    deployed: '已部署',
    deprecated: '已废弃'
  } satisfies Record<CapabilityImplementationStatus, string>,
  capabilityGapType: {
    naming_conflict: '命名冲突',
    data_model_conflict: '数据模型冲突',
    entry_conflict: '入口冲突',
    status_conflict: '状态冲突',
    permission_conflict: '权限冲突',
    persistence_conflict: '持久化冲突',
    mock_gap: 'Mock 缺口',
    implementation_gap: '实现缺口',
    integration_gap: '集成缺口',
    behavior_conflict: '行为冲突',
    alias_conflict: '别名冲突',
    coverage_gap: '覆盖缺口',
    other: '其他'
  } satisfies Record<CapabilityGapType, string>,
  capabilityGapSeverity: {
    high: '高',
    medium: '中',
    low: '低'
  } satisfies Record<CapabilityGapSeverity, string>,
  capabilityGapStatus: {
    open: '未解决',
    accepted: '已接受',
    resolved: '已解决',
    ignored: '已忽略'
  } satisfies Record<CapabilityGapStatus, string>
};

export function newId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36).slice(2)}_${random}`;
}
