import { z } from 'zod';

export const ProjectStatusSchema = z.enum(['active', 'paused', 'archived']);
export const FeatureSetTypeSchema = z.enum([
  'frontend',
  'backend',
  'product',
  'uiux',
  'requirement',
  'test',
  'docs',
  'ops',
  'other'
]);
export const FeatureSetStatusSchema = z.enum(['normal', 'draft', 'frozen', 'archived', 'deprecated']);
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
  'other'
]);
export const AlignableTypeSchema = z.enum(['project', 'feature_set', 'feature']);
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

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type FeatureSetType = z.infer<typeof FeatureSetTypeSchema>;
export type FeatureSetStatus = z.infer<typeof FeatureSetStatusSchema>;
export type FeatureStatus = z.infer<typeof FeatureStatusSchema>;
export type FeatureKind = z.infer<typeof FeatureKindSchema>;
export type AlignableType = z.infer<typeof AlignableTypeSchema>;
export type AlignmentRelation = z.infer<typeof AlignmentRelationSchema>;
export type AlignmentStatus = z.infer<typeof AlignmentStatusSchema>;
export type AlignmentRole = z.infer<typeof AlignmentRoleSchema>;

const IdSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/u, 'ID 只能包含字母、数字、下划线和中划线，并且必须以字母或数字开头');

const TextSchema = z.string().trim().min(1).max(200);
const OptionalTextSchema = z.string().trim().max(4000).optional().default('');
const VersionSchema = z.string().trim().min(1).max(80).default('当前');
const MetadataSchema = z.record(z.string(), z.unknown()).optional().default({});
export const QUERY_CONTEXT_MAX_LIMIT = 200;

export const CreateProjectSchema = z.object({
  id: IdSchema.optional(),
  name: TextSchema,
  status: ProjectStatusSchema.default('active'),
  currentVersion: VersionSchema,
  description: OptionalTextSchema,
  metadata: MetadataSchema
});

export const UpdateProjectSchema = CreateProjectSchema.partial().omit({ id: true });

export const CreateFeatureSetSchema = z.object({
  id: IdSchema.optional(),
  projectId: IdSchema.optional(),
  name: TextSchema,
  version: VersionSchema,
  type: FeatureSetTypeSchema,
  status: FeatureSetStatusSchema.default('normal'),
  description: OptionalTextSchema,
  owner: z.string().trim().max(120).optional().default(''),
  metadata: MetadataSchema
});

export const UpdateFeatureSetSchema = CreateFeatureSetSchema.partial().omit({ id: true, projectId: true });

export const CreateFeatureSchema = z.object({
  id: IdSchema.optional(),
  projectId: IdSchema.optional(),
  featureSetId: IdSchema.optional(),
  parentFeatureId: IdSchema.nullable().optional().default(null),
  stableKey: z.string().trim().min(1).max(120),
  name: TextSchema,
  version: VersionSchema,
  status: FeatureStatusSchema.default('draft'),
  kind: FeatureKindSchema.default('capability'),
  description: OptionalTextSchema,
  sortOrder: z.number().int().min(0).max(100000).optional().default(0),
  metadata: MetadataSchema
});

export const UpdateFeatureSchema = CreateFeatureSchema.partial().omit({
  id: true,
  projectId: true,
  featureSetId: true
});

export const AlignmentMemberSchema = z.object({
  targetType: AlignableTypeSchema,
  targetId: IdSchema,
  role: AlignmentRoleSchema.default('peer'),
  note: z.string().trim().max(1000).optional().default('')
});

export const CreateAlignmentSchema = z.object({
  id: IdSchema.optional(),
  projectId: IdSchema.optional(),
  name: TextSchema,
  relation: AlignmentRelationSchema.default('corresponds_to'),
  status: AlignmentStatusSchema.default('proposed'),
  description: OptionalTextSchema,
  members: z.array(AlignmentMemberSchema).min(2).max(20),
  metadata: MetadataSchema
});

export const UpdateAlignmentSchema = CreateAlignmentSchema.partial().omit({ id: true, projectId: true });

export const QueryContextSchema = z.object({
  projectId: IdSchema.optional(),
  keyword: z.string().trim().max(120).optional().default(''),
  limit: z.number().int().min(1).max(QUERY_CONTEXT_MAX_LIMIT).optional().default(20)
});

export type CreateProjectInput = z.input<typeof CreateProjectSchema>;
export type CreateFeatureSetInput = z.input<typeof CreateFeatureSetSchema>;
export type CreateFeatureInput = z.input<typeof CreateFeatureSchema>;
export type CreateAlignmentInput = z.input<typeof CreateAlignmentSchema>;
export type QueryContextInput = z.input<typeof QueryContextSchema>;

export const labels = {
  projectStatus: {
    active: '活跃',
    paused: '暂停',
    archived: '归档'
  } satisfies Record<ProjectStatus, string>,
  featureSetType: {
    frontend: '前端',
    backend: '后端',
    product: '产品',
    uiux: 'UI/UX',
    requirement: '需求',
    test: '测试',
    docs: '文档',
    ops: '运维',
    other: '其他'
  } satisfies Record<FeatureSetType, string>,
  featureSetStatus: {
    normal: '正常',
    draft: '草稿',
    frozen: '冻结',
    archived: '归档',
    deprecated: '废弃'
  } satisfies Record<FeatureSetStatus, string>,
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
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}
