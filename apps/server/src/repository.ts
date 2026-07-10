import {
  type BatchAlignmentInput,
  type BatchFeatureInput,
  type BatchFeatureSetInput,
  type CreateAlignmentInput,
  type CreateFeatureInput,
  type CreateFeatureSetInput,
  type CreateProjectInput,
  type QueryContextInput,
  type QueryContextType,
  BatchAlignmentSchema,
  BatchFeatureSchema,
  BatchFeatureSetSchema,
  CreateAlignmentSchema,
  CreateFeatureSchema,
  CreateFeatureSetSchema,
  CreateProjectSchema,
  QueryContextSchema,
  newId
} from '@functree/domain';
import type { SQLInputValue } from 'node:sqlite';
import type { Db } from './database.js';

export type ProjectRow = {
  id: string;
  name: string;
  status: string;
  currentVersion: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type FeatureSetRow = {
  id: string;
  projectId: string;
  stableKey: string;
  name: string;
  version: string;
  type: string;
  status: string;
  description: string;
  owner: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type FeatureRow = {
  id: string;
  projectId: string;
  featureSetId: string;
  parentFeatureId: string | null;
  stableKey: string;
  name: string;
  version: string;
  status: string;
  kind: string;
  description: string;
  sortOrder: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  children?: FeatureRow[];
};

export type AlignmentRow = {
  id: string;
  projectId: string;
  stableKey: string;
  name: string;
  relation: string;
  status: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  members: AlignmentMemberRow[];
};

export type UpsertOperation = 'created' | 'updated' | 'unchanged' | 'dry_run';

export type UpsertResult<T> = {
  operation: UpsertOperation;
  changedFields: string[];
  data: T;
  dryRun: boolean;
};

export type BatchUpsertResult<T> = {
  success: boolean;
  dryRun: boolean;
  rolledBack: boolean;
  results: Array<UpsertResult<T> & { index: number }>;
  errors: Array<{
    index: number;
    code: string;
    message: string;
    hint: string;
  }>;
};

export type QueryContextResult = {
  projects: ProjectRow[];
  featureSets: FeatureSetRow[];
  features: FeatureRow[];
  alignments: AlignmentRow[];
  page: {
    limit: number;
    offset: number;
    nextCursor: string | null;
    hasMore: boolean;
    totals: Record<QueryContextType, number>;
  };
  summary: {
    featureSetCount: number;
    featureCount: number;
    alignmentCount: number;
    lastUpdatedAt: string | null;
    stableKeyConflictCount: number;
  };
};

type ParsedQueryContext = ReturnType<typeof QueryContextSchema.parse>;

export type AlignmentMemberRow = {
  id: string;
  alignmentId: string;
  targetType: string;
  targetId: string;
  role: string;
  note: string;
  label?: string;
};

export class FuncTreeRepository {
  constructor(private readonly db: Db) {}

  listProjects(): ProjectRow[] {
    return this.db
      .prepare('SELECT * FROM projects ORDER BY updated_at DESC')
      .all()
      .map(mapProject);
  }

  getProject(projectId: string): ProjectRow {
    const row = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!row) {
      throw new NotFoundError(`项目不存在: ${projectId}`);
    }
    return mapProject(row);
  }

  createProject(input: CreateProjectInput): ProjectRow {
    const data = CreateProjectSchema.parse(input);
    const now = nowIso();
    const id = data.id ?? newId('proj');
    this.db
      .prepare(
        `INSERT INTO projects (id, name, status, current_version, description, metadata_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           status = excluded.status,
           current_version = excluded.current_version,
           description = excluded.description,
           metadata_json = excluded.metadata_json,
           updated_at = excluded.updated_at`
      )
      .run(id, data.name, data.status, data.currentVersion, data.description, json(data.metadata), now, now);
    this.recordEvent(id, 'http', 'upsert_project', { id, name: data.name });
    return this.getProject(id);
  }

  createFeatureSet(projectId: string, input: CreateFeatureSetInput): FeatureSetRow {
    return this.upsertFeatureSet(projectId, input).data;
  }

  upsertFeatureSet(projectId: string, input: CreateFeatureSetInput): UpsertResult<FeatureSetRow> {
    const data = CreateFeatureSetSchema.parse(input);
    this.getProject(projectId);
    const now = nowIso();
    const existing = this.findFeatureSetForUpsert(projectId, data.id, data.stableKey);
    const id = existing?.id ?? data.id ?? newId('fs');
    const planned = {
      id,
      projectId,
      stableKey: data.stableKey ?? existing?.stableKey ?? '',
      name: data.name,
      version: data.version,
      type: data.type,
      status: data.status,
      description: data.description,
      owner: data.owner,
      metadata: data.metadata,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    } satisfies FeatureSetRow;
    const changedFields = existing ? changedFieldsFor(existing, planned, ['name', 'version', 'type', 'status', 'description', 'owner', 'metadata', 'stableKey']) : [];
    if (data.dryRun) {
      return { operation: 'dry_run', changedFields: existing ? changedFields : ['*'], data: existing ?? planned, dryRun: true };
    }
    if (existing && changedFields.length === 0) {
      return { operation: 'unchanged', changedFields, data: existing, dryRun: false };
    }
    this.db
      .prepare(
        `INSERT INTO feature_sets
          (id, project_id, stable_key, name, version, type, status, description, owner, metadata_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           stable_key = excluded.stable_key,
           name = excluded.name,
           version = excluded.version,
           type = excluded.type,
           status = excluded.status,
           description = excluded.description,
           owner = excluded.owner,
           metadata_json = excluded.metadata_json,
           updated_at = excluded.updated_at`
      )
      .run(
        id,
        projectId,
        planned.stableKey,
        planned.name,
        planned.version,
        planned.type,
        planned.status,
        planned.description,
        planned.owner,
        json(planned.metadata),
        now,
        now
      );
    this.touchProject(projectId);
    this.recordEvent(projectId, 'http', 'upsert_feature_set', { id, name: data.name });
    return {
      operation: existing ? (changedFields.length ? 'updated' : 'unchanged') : 'created',
      changedFields,
      data: this.getFeatureSet(id),
      dryRun: false
    };
  }

  upsertFeatureSetsBatch(input: BatchFeatureSetInput): BatchUpsertResult<FeatureSetRow> {
    const data = BatchFeatureSetSchema.parse(input);
    this.getProject(data.projectId);
    return this.runBatch(data.dryRun, data.items, (item) => this.upsertFeatureSet(data.projectId, { ...item, dryRun: data.dryRun }));
  }

  listFeatureSets(projectId: string): FeatureSetRow[] {
    return this.db
      .prepare('SELECT * FROM feature_sets WHERE project_id = ? ORDER BY type, version DESC, name')
      .all(projectId)
      .map(mapFeatureSet);
  }

  getFeatureSet(featureSetId: string): FeatureSetRow {
    const row = this.db.prepare('SELECT * FROM feature_sets WHERE id = ?').get(featureSetId);
    if (!row) {
      throw new NotFoundError(`功能集不存在: ${featureSetId}`);
    }
    return mapFeatureSet(row);
  }

  createFeature(featureSetId: string, input: CreateFeatureInput): FeatureRow {
    return this.upsertFeature(featureSetId, input).data;
  }

  upsertFeature(featureSetId: string, input: CreateFeatureInput): UpsertResult<FeatureRow> {
    const data = CreateFeatureSchema.parse(input);
    const featureSet = this.getFeatureSet(featureSetId);
    if (data.parentFeatureId) {
      const parent = this.getFeature(data.parentFeatureId);
      if (parent.featureSetId !== featureSetId) {
        throw new ValidationError('子功能必须和父功能位于同一个功能集。');
      }
    }
    const now = nowIso();
    const existing = this.findFeatureForUpsert(featureSetId, data.id, data.stableKey, data.version);
    const id = existing?.id ?? data.id ?? newId('feat');
    const planned = {
      id,
      projectId: featureSet.projectId,
      featureSetId,
      parentFeatureId: data.parentFeatureId,
      stableKey: data.stableKey,
      name: data.name,
      version: data.version,
      status: data.status,
      kind: data.kind,
      description: data.description,
      sortOrder: data.sortOrder,
      metadata: data.metadata,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    } satisfies FeatureRow;
    const changedFields = existing
      ? changedFieldsFor(existing, planned, ['parentFeatureId', 'stableKey', 'name', 'version', 'status', 'kind', 'description', 'sortOrder', 'metadata'])
      : [];
    if (data.dryRun) {
      return { operation: 'dry_run', changedFields: existing ? changedFields : ['*'], data: existing ?? planned, dryRun: true };
    }
    if (existing && changedFields.length === 0) {
      return { operation: 'unchanged', changedFields, data: existing, dryRun: false };
    }
    this.db
      .prepare(
        `INSERT INTO features
          (id, project_id, feature_set_id, parent_feature_id, stable_key, name, version, status, kind, description, sort_order, metadata_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           parent_feature_id = excluded.parent_feature_id,
           stable_key = excluded.stable_key,
           name = excluded.name,
           version = excluded.version,
           status = excluded.status,
           kind = excluded.kind,
           description = excluded.description,
           sort_order = excluded.sort_order,
           metadata_json = excluded.metadata_json,
           updated_at = excluded.updated_at`
      )
      .run(
        id,
        planned.projectId,
        featureSetId,
        planned.parentFeatureId,
        planned.stableKey,
        planned.name,
        planned.version,
        planned.status,
        planned.kind,
        planned.description,
        planned.sortOrder,
        json(planned.metadata),
        now,
        now
      );
    this.syncFeatureFts(id);
    this.touchProject(featureSet.projectId);
    this.recordEvent(featureSet.projectId, 'http', 'upsert_feature', { id, name: data.name });
    return {
      operation: existing ? (changedFields.length ? 'updated' : 'unchanged') : 'created',
      changedFields,
      data: this.getFeature(id),
      dryRun: false
    };
  }

  upsertFeaturesBatch(input: BatchFeatureInput): BatchUpsertResult<FeatureRow> {
    const data = BatchFeatureSchema.parse(input);
    this.getFeatureSet(data.featureSetId);
    return this.runBatch(data.dryRun, data.items, (item) => this.upsertFeature(data.featureSetId, { ...item, dryRun: data.dryRun }));
  }

  getFeature(featureId: string): FeatureRow {
    const row = this.db.prepare('SELECT * FROM features WHERE id = ?').get(featureId);
    if (!row) {
      throw new NotFoundError(`功能不存在: ${featureId}`);
    }
    return mapFeature(row);
  }

  listFeatures(projectId: string): FeatureRow[] {
    return this.db
      .prepare('SELECT * FROM features WHERE project_id = ? ORDER BY feature_set_id, parent_feature_id, sort_order, name')
      .all(projectId)
      .map(mapFeature);
  }

  getProjectTree(projectId: string) {
    const project = this.getProject(projectId);
    const featureSets = this.listFeatureSets(projectId);
    const features = this.listFeatures(projectId);
    return {
      project,
      featureSets: featureSets.map((featureSet) => ({
        ...featureSet,
        features: buildFeatureTree(features.filter((feature) => feature.featureSetId === featureSet.id))
      })),
      alignments: this.listAlignments(projectId)
    };
  }

  createAlignment(projectId: string, input: CreateAlignmentInput): AlignmentRow {
    return this.upsertAlignment(projectId, input).data;
  }

  upsertAlignment(projectId: string, input: CreateAlignmentInput): UpsertResult<AlignmentRow> {
    const data = CreateAlignmentSchema.parse(input);
    this.getProject(projectId);
    for (const member of data.members) {
      this.assertAlignable(projectId, member.targetType, member.targetId);
    }

    const now = nowIso();
    const memberSignature = alignmentMemberSignature(data.members);
    const existing = this.findAlignmentForUpsert(projectId, data.id, data.stableKey, memberSignature);
    const id = existing?.id ?? data.id ?? newId('aln');
    const planned = {
      id,
      projectId,
      stableKey: data.stableKey ?? existing?.stableKey ?? '',
      name: data.name,
      relation: data.relation,
      status: data.status,
      description: data.description,
      metadata: data.metadata,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      members: data.members.map((member) => ({
        id: newId('am'),
        alignmentId: id,
        targetType: member.targetType,
        targetId: member.targetId,
        role: member.role,
        note: member.note
      }))
    } satisfies AlignmentRow;
    const changedFields = existing
      ? [
          ...changedFieldsFor(existing, planned, ['stableKey', 'name', 'relation', 'status', 'description', 'metadata']),
          ...(alignmentMemberSignature(existing.members) === memberSignature ? [] : ['members'])
        ]
      : [];
    if (data.dryRun) {
      return { operation: 'dry_run', changedFields: existing ? changedFields : ['*'], data: existing ?? planned, dryRun: true };
    }
    if (existing && changedFields.length === 0) {
      return { operation: 'unchanged', changedFields, data: existing, dryRun: false };
    }
    this.withSavepoint('alignment', () => {
      this.db
        .prepare(
          `INSERT INTO alignments (id, project_id, stable_key, member_signature, name, relation, status, description, metadata_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             stable_key = excluded.stable_key,
             member_signature = excluded.member_signature,
             name = excluded.name,
             relation = excluded.relation,
             status = excluded.status,
             description = excluded.description,
             metadata_json = excluded.metadata_json,
             updated_at = excluded.updated_at`
        )
        .run(
          id,
          projectId,
          planned.stableKey,
          memberSignature,
          planned.name,
          planned.relation,
          planned.status,
          planned.description,
          json(planned.metadata),
          now,
          now
        );
      this.db.prepare('DELETE FROM alignment_members WHERE alignment_id = ?').run(id);
      const insert = this.db.prepare(
        `INSERT INTO alignment_members (id, alignment_id, target_type, target_id, role, note)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
      for (const member of data.members) {
        insert.run(newId('am'), id, member.targetType, member.targetId, member.role, member.note);
      }
    });
    this.touchProject(projectId);
    this.recordEvent(projectId, 'http', 'upsert_alignment', { id, name: data.name });
    return {
      operation: existing ? (changedFields.length ? 'updated' : 'unchanged') : 'created',
      changedFields,
      data: this.getAlignment(id),
      dryRun: false
    };
  }

  upsertAlignmentsBatch(input: BatchAlignmentInput): BatchUpsertResult<AlignmentRow> {
    const data = BatchAlignmentSchema.parse(input);
    this.getProject(data.projectId);
    return this.runBatch(data.dryRun, data.items, (item) => this.upsertAlignment(data.projectId, { ...item, dryRun: data.dryRun }));
  }

  listAlignments(projectId: string): AlignmentRow[] {
    const rows = this.db
      .prepare('SELECT * FROM alignments WHERE project_id = ? ORDER BY updated_at DESC')
      .all(projectId)
      .map((row) => mapAlignment(row, this.listAlignmentMembers((row as { id: string }).id)));
    return rows;
  }

  getAlignment(alignmentId: string): AlignmentRow {
    const row = this.db.prepare('SELECT * FROM alignments WHERE id = ?').get(alignmentId);
    if (!row) {
      throw new NotFoundError(`对齐关系不存在: ${alignmentId}`);
    }
    return mapAlignment(row, this.listAlignmentMembers(alignmentId));
  }

  queryContext(input: QueryContextInput): QueryContextResult {
    const query = QueryContextSchema.parse(input);
    const types = new Set<QueryContextType>(query.types ?? ['project', 'feature_set', 'feature', 'alignment']);
    const offset = parseCursor(query.cursor) ?? query.offset;
    const limit = query.limit;
    const projects = types.has('project') ? this.queryProjects(query, limit, offset) : [];
    const featureSets = types.has('feature_set') ? this.queryFeatureSets(query, limit, offset) : [];
    const features = types.has('feature') ? this.queryFeatures(query, limit, offset) : [];
    const alignments = types.has('alignment') ? this.queryAlignments(query, limit, offset) : [];
    const totals: Record<QueryContextType, number> = {
      project: types.has('project') ? this.countProjects(query) : 0,
      feature_set: types.has('feature_set') ? this.countFeatureSets(query) : 0,
      feature: types.has('feature') ? this.countFeatures(query) : 0,
      alignment: types.has('alignment') ? this.countAlignments(query) : 0
    };
    const hasMore = Object.values(totals).some((total) => total > offset + limit);

    return {
      projects,
      featureSets,
      features,
      alignments,
      page: {
        limit,
        offset,
        nextCursor: hasMore ? String(offset + limit) : null,
        hasMore,
        totals
      },
      summary: this.contextSummary(query.projectId)
    };
  }

  overview() {
    const projects = this.listProjects();
    return {
      projects,
      totals: {
        projects: projects.length,
        featureSets: (this.db.prepare('SELECT COUNT(*) AS count FROM feature_sets').get() as { count: number }).count,
        features: (this.db.prepare('SELECT COUNT(*) AS count FROM features').get() as { count: number }).count,
        alignments: (this.db.prepare('SELECT COUNT(*) AS count FROM alignments').get() as { count: number }).count
      }
    };
  }

  private runBatch<T, I>(dryRun: boolean, items: I[], handler: (item: I) => UpsertResult<T>): BatchUpsertResult<T> {
    const results: Array<UpsertResult<T> & { index: number }> = [];
    const errors: BatchUpsertResult<T>['errors'] = [];

    const execute = () => {
      for (const [index, item] of items.entries()) {
        try {
          results.push({ index, ...handler(item) });
        } catch (error) {
          errors.push({ index, ...errorInfo(error) });
          if (!dryRun) {
            throw new BatchRollbackError();
          }
        }
      }
    };

    if (dryRun) {
      execute();
      return { success: errors.length === 0, dryRun, rolledBack: false, results, errors };
    }

    try {
      this.withSavepoint('batch', execute);
    } catch (error) {
      if (!(error instanceof BatchRollbackError)) {
        throw error;
      }
    }

    return {
      success: errors.length === 0,
      dryRun,
      rolledBack: errors.length > 0,
      results,
      errors
    };
  }

  private withSavepoint<T>(label: string, operation: () => T): T {
    const savepoint = `functree_${label}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    this.db.exec(`SAVEPOINT ${savepoint}`);
    try {
      const result = operation();
      this.db.exec(`RELEASE ${savepoint}`);
      return result;
    } catch (error) {
      this.db.exec(`ROLLBACK TO ${savepoint}`);
      this.db.exec(`RELEASE ${savepoint}`);
      throw error;
    }
  }

  private queryProjects(query: ParsedQueryContext, limit: number, offset: number): ProjectRow[] {
    const { where, args } = this.projectQueryParts(query);
    return this.db
      .prepare(`SELECT * FROM projects WHERE ${where.join(' AND ')} ORDER BY updated_at DESC LIMIT ? OFFSET ?`)
      .all(...args, limit, offset)
      .map(mapProject);
  }

  private countProjects(query: ParsedQueryContext): number {
    const { where, args } = this.projectQueryParts(query);
    return scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM projects WHERE ${where.join(' AND ')}`).get(...args));
  }

  private queryFeatureSets(query: ParsedQueryContext, limit: number, offset: number): FeatureSetRow[] {
    const { where, args } = this.featureSetQueryParts(query);
    return this.db
      .prepare(`SELECT fs.* FROM feature_sets fs WHERE ${where.join(' AND ')} ORDER BY fs.type, fs.version DESC, fs.name LIMIT ? OFFSET ?`)
      .all(...args, limit, offset)
      .map(mapFeatureSet);
  }

  private countFeatureSets(query: ParsedQueryContext): number {
    const { where, args } = this.featureSetQueryParts(query);
    return scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM feature_sets fs WHERE ${where.join(' AND ')}`).get(...args));
  }

  private queryFeatures(query: ParsedQueryContext, limit: number, offset: number): FeatureRow[] {
    const { where, args } = this.featureQueryParts(query);
    return this.db
      .prepare(
        `SELECT f.*
         FROM features f
         WHERE ${where.join(' AND ')}
         ORDER BY f.feature_set_id, f.parent_feature_id, f.sort_order, f.name
         LIMIT ? OFFSET ?`
      )
      .all(...args, limit, offset)
      .map(mapFeature);
  }

  private countFeatures(query: ParsedQueryContext): number {
    const { where, args } = this.featureQueryParts(query);
    return scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM features f WHERE ${where.join(' AND ')}`).get(...args));
  }

  private queryAlignments(query: ParsedQueryContext, limit: number, offset: number): AlignmentRow[] {
    const { where, args } = this.alignmentQueryParts(query);
    return this.db
      .prepare(`SELECT a.* FROM alignments a WHERE ${where.join(' AND ')} ORDER BY a.updated_at DESC LIMIT ? OFFSET ?`)
      .all(...args, limit, offset)
      .map((row) => mapAlignment(row, this.listAlignmentMembers((row as { id: string }).id)));
  }

  private countAlignments(query: ParsedQueryContext): number {
    const { where, args } = this.alignmentQueryParts(query);
    return scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM alignments a WHERE ${where.join(' AND ')}`).get(...args));
  }

  private projectQueryParts(query: ParsedQueryContext): QueryParts {
    const where = ['1=1'];
    const args: SQLInputValue[] = [];
    if (query.projectId) {
      where.push('id = ?');
      args.push(query.projectId);
    }
    if (query.stableKey || query.featureSetId || query.alignmentId || query.parentFeatureId !== undefined) {
      where.push('0=1');
    }
    appendKeywordClause(where, args, 'projects', ['id', 'name', 'current_version', 'description'], query.keyword);
    return { where, args };
  }

  private featureSetQueryParts(query: ParsedQueryContext): QueryParts {
    const where = ['1=1'];
    const args: SQLInputValue[] = [];
    if (query.projectId) {
      where.push('fs.project_id = ?');
      args.push(query.projectId);
    }
    if (query.featureSetId) {
      where.push('fs.id = ?');
      args.push(query.featureSetId);
    }
    if (query.stableKey) {
      where.push('fs.stable_key = ?');
      args.push(query.stableKey);
    }
    if (query.alignmentId) {
      where.push(
        `EXISTS (
          SELECT 1 FROM alignment_members am
          WHERE am.alignment_id = ? AND am.target_type = 'feature_set' AND am.target_id = fs.id
        )`
      );
      args.push(query.alignmentId);
    }
    if (query.parentFeatureId !== undefined) {
      where.push('0=1');
    }
    appendKeywordClause(where, args, 'fs', ['id', 'stable_key', 'name', 'version', 'type', 'status', 'description', 'owner'], query.keyword);
    return { where, args };
  }

  private featureQueryParts(query: ParsedQueryContext): QueryParts {
    const where = ['1=1'];
    const args: SQLInputValue[] = [];
    if (query.projectId) {
      where.push('f.project_id = ?');
      args.push(query.projectId);
    }
    if (query.featureSetId) {
      where.push('f.feature_set_id = ?');
      args.push(query.featureSetId);
    }
    if (query.stableKey) {
      where.push('f.stable_key = ?');
      args.push(query.stableKey);
    }
    if (query.alignmentId) {
      where.push(
        `EXISTS (
          SELECT 1 FROM alignment_members am
          WHERE am.alignment_id = ? AND am.target_type = 'feature' AND am.target_id = f.id
        )`
      );
      args.push(query.alignmentId);
    }
    if (query.parentFeatureId === null) {
      where.push('f.parent_feature_id IS NULL');
    } else if (query.parentFeatureId) {
      where.push('f.parent_feature_id = ?');
      args.push(query.parentFeatureId);
    }
    appendKeywordClause(where, args, 'f', ['id', 'stable_key', 'name', 'version', 'status', 'kind', 'description'], query.keyword);
    return { where, args };
  }

  private alignmentQueryParts(query: ParsedQueryContext): QueryParts {
    const where = ['1=1'];
    const args: SQLInputValue[] = [];
    if (query.projectId) {
      where.push('a.project_id = ?');
      args.push(query.projectId);
    }
    if (query.alignmentId) {
      where.push('a.id = ?');
      args.push(query.alignmentId);
    }
    if (query.stableKey) {
      where.push('a.stable_key = ?');
      args.push(query.stableKey);
    }
    if (query.featureSetId) {
      where.push(
        `EXISTS (
          SELECT 1
          FROM alignment_members am
          LEFT JOIN features f ON am.target_type = 'feature' AND f.id = am.target_id
          WHERE am.alignment_id = a.id
            AND (
              (am.target_type = 'feature_set' AND am.target_id = ?)
              OR (am.target_type = 'feature' AND f.feature_set_id = ?)
            )
        )`
      );
      args.push(query.featureSetId, query.featureSetId);
    }
    if (query.parentFeatureId === null) {
      where.push(
        `EXISTS (
          SELECT 1
          FROM alignment_members am
          JOIN features f ON am.target_type = 'feature' AND f.id = am.target_id
          WHERE am.alignment_id = a.id AND f.parent_feature_id IS NULL
        )`
      );
    } else if (query.parentFeatureId) {
      where.push(
        `EXISTS (
          SELECT 1
          FROM alignment_members am
          JOIN features f ON am.target_type = 'feature' AND f.id = am.target_id
          WHERE am.alignment_id = a.id AND f.parent_feature_id = ?
        )`
      );
      args.push(query.parentFeatureId);
    }
    appendKeywordClause(where, args, 'a', ['id', 'stable_key', 'name', 'relation', 'status', 'description'], query.keyword);
    return { where, args };
  }

  private contextSummary(projectId: string | undefined): QueryContextResult['summary'] {
    const projectWhere = projectId ? 'WHERE project_id = ?' : '';
    const projectArgs = projectId ? [projectId] : [];
    return {
      featureSetCount: scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM feature_sets ${projectWhere}`).get(...projectArgs)),
      featureCount: scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM features ${projectWhere}`).get(...projectArgs)),
      alignmentCount: scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM alignments ${projectWhere}`).get(...projectArgs)),
      lastUpdatedAt: this.lastUpdatedAt(projectId),
      stableKeyConflictCount: this.stableKeyConflictCount(projectId)
    };
  }

  private lastUpdatedAt(projectId: string | undefined): string | null {
    const rows = projectId
      ? (this.db
          .prepare(
            `SELECT MAX(updated_at) AS updated_at
             FROM (
               SELECT updated_at FROM projects WHERE id = ?
               UNION ALL SELECT updated_at FROM feature_sets WHERE project_id = ?
               UNION ALL SELECT updated_at FROM features WHERE project_id = ?
               UNION ALL SELECT updated_at FROM alignments WHERE project_id = ?
             )`
          )
          .get(projectId, projectId, projectId, projectId) as { updated_at: string | null })
      : (this.db
          .prepare(
            `SELECT MAX(updated_at) AS updated_at
             FROM (
               SELECT updated_at FROM projects
               UNION ALL SELECT updated_at FROM feature_sets
               UNION ALL SELECT updated_at FROM features
               UNION ALL SELECT updated_at FROM alignments
             )`
          )
          .get() as { updated_at: string | null });
    return rows.updated_at;
  }

  private stableKeyConflictCount(projectId: string | undefined): number {
    const filter = projectId ? 'AND project_id = ?' : '';
    const args = projectId ? [projectId, projectId, projectId] : [];
    return scalarCount(
      this.db
        .prepare(
          `SELECT COALESCE(SUM(conflicts), 0) AS count
           FROM (
             SELECT COUNT(*) - 1 AS conflicts FROM feature_sets WHERE stable_key <> '' ${filter} GROUP BY project_id, stable_key HAVING COUNT(*) > 1
             UNION ALL
             SELECT COUNT(*) - 1 AS conflicts FROM features WHERE stable_key <> '' ${filter} GROUP BY project_id, feature_set_id, stable_key, version HAVING COUNT(*) > 1
             UNION ALL
             SELECT COUNT(*) - 1 AS conflicts FROM alignments WHERE stable_key <> '' ${filter} GROUP BY project_id, stable_key HAVING COUNT(*) > 1
           )`
        )
        .get(...args)
    );
  }

  private findFeatureSetForUpsert(projectId: string, id: string | undefined, stableKey: string | undefined): FeatureSetRow | null {
    const byId = id ? this.findFeatureSetById(id) : null;
    if (byId && byId.projectId !== projectId) {
      throw new ValidationError('功能集 ID 不属于当前项目。');
    }
    const byStableKey = stableKey ? this.findFeatureSetByStableKey(projectId, stableKey) : null;
    if (byId && byStableKey && byId.id !== byStableKey.id) {
      throw new ValidationError('功能集 id 和 stableKey 指向不同对象，请先查询上下文确认。');
    }
    return byId ?? byStableKey;
  }

  private findFeatureById(featureId: string): FeatureRow | null {
    const row = this.db.prepare('SELECT * FROM features WHERE id = ?').get(featureId);
    return row ? mapFeature(row) : null;
  }

  private findFeatureSetById(featureSetId: string): FeatureSetRow | null {
    const row = this.db.prepare('SELECT * FROM feature_sets WHERE id = ?').get(featureSetId);
    return row ? mapFeatureSet(row) : null;
  }

  private findFeatureSetByStableKey(projectId: string, stableKey: string): FeatureSetRow | null {
    const row = this.db.prepare('SELECT * FROM feature_sets WHERE project_id = ? AND stable_key = ?').get(projectId, stableKey);
    return row ? mapFeatureSet(row) : null;
  }

  private findFeatureForUpsert(featureSetId: string, id: string | undefined, stableKey: string, version: string): FeatureRow | null {
    const byId = id ? this.findFeatureById(id) : null;
    if (byId && byId.featureSetId !== featureSetId) {
      throw new ValidationError('功能 ID 不属于当前功能集。');
    }
    const byStableKey = this.findFeatureByStableKey(featureSetId, stableKey, version);
    if (byId && byStableKey && byId.id !== byStableKey.id) {
      throw new ValidationError('功能 id 和 stableKey/version 指向不同对象，请先查询上下文确认。');
    }
    return byId ?? byStableKey;
  }

  private findFeatureByStableKey(featureSetId: string, stableKey: string, version: string): FeatureRow | null {
    const row = this.db
      .prepare('SELECT * FROM features WHERE feature_set_id = ? AND stable_key = ? AND version = ?')
      .get(featureSetId, stableKey, version);
    return row ? mapFeature(row) : null;
  }

  private findAlignmentForUpsert(projectId: string, id: string | undefined, stableKey: string | undefined, memberSignature: string): AlignmentRow | null {
    const matches = [
      id ? this.findAlignmentById(id) : null,
      stableKey ? this.findAlignmentByStableKey(projectId, stableKey) : null,
      memberSignature ? this.findAlignmentByMemberSignature(projectId, memberSignature) : null
    ].filter((alignment): alignment is AlignmentRow => Boolean(alignment));

    for (const alignment of matches) {
      if (alignment.projectId !== projectId) {
        throw new ValidationError('对齐关系 ID 不属于当前项目。');
      }
    }

    const [first] = matches;
    if (first && matches.some((alignment) => alignment.id !== first.id)) {
      throw new ValidationError('对齐关系 id、stableKey 或成员集合指向不同对象，请先查询上下文确认。');
    }
    return first ?? null;
  }

  private findAlignmentById(alignmentId: string): AlignmentRow | null {
    const row = this.db.prepare('SELECT * FROM alignments WHERE id = ?').get(alignmentId);
    return row ? mapAlignment(row, this.listAlignmentMembers(alignmentId)) : null;
  }

  private findAlignmentByStableKey(projectId: string, stableKey: string): AlignmentRow | null {
    const row = this.db.prepare('SELECT * FROM alignments WHERE project_id = ? AND stable_key = ?').get(projectId, stableKey);
    return row ? mapAlignment(row, this.listAlignmentMembers((row as { id: string }).id)) : null;
  }

  private findAlignmentByMemberSignature(projectId: string, memberSignature: string): AlignmentRow | null {
    const direct = this.db.prepare('SELECT * FROM alignments WHERE project_id = ? AND member_signature = ?').get(projectId, memberSignature);
    if (direct) {
      return mapAlignment(direct, this.listAlignmentMembers((direct as { id: string }).id));
    }
    const rows = this.db.prepare('SELECT * FROM alignments WHERE project_id = ?').all(projectId);
    for (const row of rows) {
      const alignment = mapAlignment(row, this.listAlignmentMembers((row as { id: string }).id));
      if (alignmentMemberSignature(alignment.members) === memberSignature) {
        return alignment;
      }
    }
    return null;
  }

  private listAlignmentMembers(alignmentId: string): AlignmentMemberRow[] {
    return this.db
      .prepare('SELECT * FROM alignment_members WHERE alignment_id = ? ORDER BY role, target_type')
      .all(alignmentId)
      .map((row) => {
        const member = mapAlignmentMember(row);
        return { ...member, label: this.alignableLabel(member.targetType, member.targetId) };
      });
  }

  private assertAlignable(projectId: string, targetType: string, targetId: string): void {
    if (targetType === 'project') {
      const project = this.getProject(targetId);
      if (project.id !== projectId) {
        throw new ValidationError('对齐关系只能引用同一项目内的对象。');
      }
      return;
    }
    if (targetType === 'feature_set') {
      const featureSet = this.getFeatureSet(targetId);
      if (featureSet.projectId !== projectId) {
        throw new ValidationError('功能集不属于当前项目。');
      }
      return;
    }
    const feature = this.getFeature(targetId);
    if (feature.projectId !== projectId) {
      throw new ValidationError('功能不属于当前项目。');
    }
  }

  private alignableLabel(targetType: string, targetId: string): string {
    try {
      if (targetType === 'project') return this.getProject(targetId).name;
      if (targetType === 'feature_set') return this.getFeatureSet(targetId).name;
      return this.getFeature(targetId).name;
    } catch {
      return targetId;
    }
  }

  private syncFeatureFts(featureId: string): void {
    const feature = this.getFeature(featureId);
    this.db.prepare('DELETE FROM features_fts WHERE id = ?').run(featureId);
    this.db
      .prepare(
        `INSERT INTO features_fts (id, project_id, feature_set_id, name, stable_key, version, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(feature.id, feature.projectId, feature.featureSetId, feature.name, feature.stableKey, feature.version, feature.description);
  }

  private touchProject(projectId: string): void {
    this.db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(nowIso(), projectId);
  }

  private recordEvent(projectId: string | null, source: string, action: string, payload: unknown): void {
    this.db
      .prepare('INSERT INTO sync_events (id, project_id, source, action, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(newId('evt'), projectId, source, action, json(payload), nowIso());
  }
}

export class NotFoundError extends Error {
  readonly code = 'NOT_FOUND';
  readonly hint = '先通过 functree_query_context 确认项目、功能集、功能或对齐关系 ID 是否存在。';
}

export class ValidationError extends Error {
  readonly code = 'INVALID_ARGUMENT';
  readonly hint = '检查传入字段、stableKey、成员集合或对象归属关系后重试。';
}

class BatchRollbackError extends Error {}

type QueryParts = {
  where: string[];
  args: SQLInputValue[];
};

function buildFeatureTree(features: FeatureRow[]): FeatureRow[] {
  const byId = new Map(features.map((feature) => [feature.id, { ...feature, children: [] as FeatureRow[] }]));
  const roots: FeatureRow[] = [];
  for (const feature of byId.values()) {
    if (feature.parentFeatureId && byId.has(feature.parentFeatureId)) {
      byId.get(feature.parentFeatureId)?.children?.push(feature);
    } else {
      roots.push(feature);
    }
  }
  return roots;
}

function mapProject(row: unknown): ProjectRow {
  const value = row as Record<string, unknown>;
  return {
    id: String(value.id),
    name: String(value.name),
    status: String(value.status),
    currentVersion: String(value.current_version),
    description: String(value.description ?? ''),
    metadata: parseJson(value.metadata_json),
    createdAt: String(value.created_at),
    updatedAt: String(value.updated_at)
  };
}

function mapFeatureSet(row: unknown): FeatureSetRow {
  const value = row as Record<string, unknown>;
  return {
    id: String(value.id),
    projectId: String(value.project_id),
    stableKey: String(value.stable_key ?? ''),
    name: String(value.name),
    version: String(value.version),
    type: String(value.type),
    status: String(value.status),
    description: String(value.description ?? ''),
    owner: String(value.owner ?? ''),
    metadata: parseJson(value.metadata_json),
    createdAt: String(value.created_at),
    updatedAt: String(value.updated_at)
  };
}

function mapFeature(row: unknown): FeatureRow {
  const value = row as Record<string, unknown>;
  return {
    id: String(value.id),
    projectId: String(value.project_id),
    featureSetId: String(value.feature_set_id),
    parentFeatureId: value.parent_feature_id ? String(value.parent_feature_id) : null,
    stableKey: String(value.stable_key),
    name: String(value.name),
    version: String(value.version),
    status: String(value.status),
    kind: String(value.kind),
    description: String(value.description ?? ''),
    sortOrder: Number(value.sort_order ?? 0),
    metadata: parseJson(value.metadata_json),
    createdAt: String(value.created_at),
    updatedAt: String(value.updated_at)
  };
}

function mapAlignment(row: unknown, members: AlignmentMemberRow[]): AlignmentRow {
  const value = row as Record<string, unknown>;
  return {
    id: String(value.id),
    projectId: String(value.project_id),
    stableKey: String(value.stable_key ?? ''),
    name: String(value.name),
    relation: String(value.relation),
    status: String(value.status),
    description: String(value.description ?? ''),
    metadata: parseJson(value.metadata_json),
    createdAt: String(value.created_at),
    updatedAt: String(value.updated_at),
    members
  };
}

function mapAlignmentMember(row: unknown): AlignmentMemberRow {
  const value = row as Record<string, unknown>;
  return {
    id: String(value.id),
    alignmentId: String(value.alignment_id),
    targetType: String(value.target_type),
    targetId: String(value.target_id),
    role: String(value.role),
    note: String(value.note ?? '')
  };
}

function parseJson(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string' || !value) {
    return {};
  }
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function json(value: unknown): string {
  return JSON.stringify(value ?? {});
}

function changedFieldsFor(existing: Record<string, unknown>, planned: Record<string, unknown>, fields: string[]): string[] {
  return fields.filter((field) => stableStringify(existing[field]) !== stableStringify(planned[field]));
}

function alignmentMemberSignature(members: Array<{ targetType: string; targetId: string; role: string }>): string {
  return members
    .map((member) => `${member.role}:${member.targetType}:${member.targetId}`)
    .sort()
    .join('|');
}

function appendKeywordClause(where: string[], args: SQLInputValue[], alias: string, columns: string[], keyword: string): void {
  const value = keyword.trim();
  if (!value) return;
  const pattern = likePattern(value);
  where.push(`(${columns.map((column) => `LOWER(${alias}.${column}) LIKE ? ESCAPE '\\'`).join(' OR ')})`);
  args.push(...columns.map(() => pattern));
}

function likePattern(value: string): string {
  return `%${value.toLowerCase().replace(/[\\%_]/gu, '\\$&')}%`;
}

function parseCursor(cursor: string | undefined): number | null {
  if (!cursor) return null;
  if (!/^\d+$/u.test(cursor)) {
    throw new ValidationError('cursor 无效，请使用 functree_query_context 返回的 nextCursor。');
  }
  const value = Number(cursor);
  if (!Number.isSafeInteger(value) || value < 0 || value > 100000) {
    throw new ValidationError('cursor 超出可查询范围，请从较小分页重新查询。');
  }
  return value;
}

function scalarCount(row: unknown): number {
  return Number((row as { count?: unknown } | null)?.count ?? 0);
}

function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeJson(value));
}

function normalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeJson);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, normalizeJson(entry)])
    );
  }
  return value ?? null;
}

function errorInfo(error: unknown): { code: string; message: string; hint: string } {
  if (error instanceof NotFoundError || error instanceof ValidationError) {
    return { code: error.code, message: error.message, hint: error.hint };
  }
  if (error instanceof Error) {
    return {
      code: 'ITEM_ERROR',
      message: error.message || '批量写入项处理失败。',
      hint: '检查该项输入是否满足 schema、唯一键和对象归属约束。'
    };
  }
  return {
    code: 'ITEM_ERROR',
    message: '批量写入项处理失败。',
    hint: '检查该项输入是否满足 schema、唯一键和对象归属约束。'
  };
}

function nowIso(): string {
  return new Date().toISOString();
}
