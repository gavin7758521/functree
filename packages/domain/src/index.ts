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
  'blocked'
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
  'related_to'
]);
export const AlignmentStatusSchema = z.enum(['proposed', 'confirmed', 'rejected', 'stale']);
export const AlignmentRoleSchema = z.enum(['source', 'target', 'peer', 'evidence']);
export const QueryContextTypeSchema = z.enum(['project', 'map', 'feature', 'alignment', 'entry_point', 'code_reference']);
export const QueryContextViewSchema = z.enum(['full', 'lite']);
export const PathMatchModeSchema = z.enum(['contains', 'exact', 'prefix']);
export const ResolveStableKeyTypeSchema = z.enum(['project', 'map', 'feature', 'alignment', 'entry_point', 'code_reference']);
export const ScanRunStatusSchema = z.enum(['running', 'completed', 'failed', 'cancelled']);

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
export type QueryContextType = z.infer<typeof QueryContextTypeSchema>;
export type QueryContextView = z.infer<typeof QueryContextViewSchema>;
export type PathMatchMode = z.infer<typeof PathMatchModeSchema>;
export type ResolveStableKeyType = z.infer<typeof ResolveStableKeyTypeSchema>;
export type ScanRunStatus = z.infer<typeof ScanRunStatusSchema>;

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

export const QueryContextSchema = z.object({
  projectId: IdSchema.optional(),
  keyword: z.string().trim().max(120).optional().default(''),
  types: z.array(QueryContextTypeSchema).min(1).max(6).optional(),
  view: QueryContextViewSchema.optional().default('full'),
  includeSummaryOnly: z.boolean().optional().default(false),
  includeMembers: z.boolean().optional().default(true),
  includeMetadata: z.boolean().optional().default(true),
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

export const QueryPathContextSchema = z.object({
  projectId: IdSchema,
  path: PathSchema,
  pathMode: PathMatchModeSchema.optional().default('contains'),
  includeAlignments: z.boolean().optional().default(true),
  includeReferences: z.boolean().optional().default(true)
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
export type QueryContextInput = z.input<typeof QueryContextSchema>;
export type BatchMapInput = z.input<typeof BatchMapSchema>;
export type BatchFeatureInput = z.input<typeof BatchFeatureSchema>;
export type BatchEntryPointInput = z.input<typeof BatchEntryPointSchema>;
export type BatchCodeReferenceInput = z.input<typeof BatchCodeReferenceSchema>;
export type BatchAlignmentInput = z.input<typeof BatchAlignmentSchema>;
export type ResolveStableKeysInput = z.input<typeof ResolveStableKeysSchema>;
export type ProjectSummaryInput = z.input<typeof ProjectSummarySchema>;
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
    blocked: '阻塞中'
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
    related_to: '关联'
  } satisfies Record<AlignmentRelation, string>,
  alignmentStatus: {
    proposed: '待确认',
    confirmed: '已确认',
    rejected: '已拒绝',
    stale: '已过期'
  } satisfies Record<AlignmentStatus, string>
};

export function newId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36).slice(2)}_${random}`;
}
