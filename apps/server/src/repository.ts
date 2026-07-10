import {
  type BatchAlignmentInput,
  type BatchCodeReferenceInput,
  type BatchEntryPointInput,
  type BatchFeatureInput,
  type BatchMapInput,
  type BeginScanInput,
  type CreateAlignmentInput,
  type CreateCodeReferenceInput,
  type CreateEntryPointInput,
  type CreateFeatureInput,
  type CreateMapInput,
  type CreateProjectInput,
  type FinishScanInput,
  type ProjectSummaryInput,
  type QueryContextInput,
  type QueryContextType,
  type QueryPathContextInput,
  type ResolveStableKeysInput,
  type ResolveStableKeyType,
  BeginScanSchema,
  BatchAlignmentSchema,
  BatchCodeReferenceSchema,
  BatchEntryPointSchema,
  BatchFeatureSchema,
  BatchMapSchema,
  CreateAlignmentSchema,
  CreateCodeReferenceSchema,
  CreateEntryPointSchema,
  CreateFeatureSchema,
  CreateMapSchema,
  CreateProjectSchema,
  FinishScanSchema,
  ProjectSummarySchema,
  QueryPathContextSchema,
  QueryContextSchema,
  ResolveStableKeysSchema,
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

export type FeatureMapRow = {
  id: string;
  projectId: string;
  stableKey: string;
  name: string;
  version: string;
  axis: string;
  scope: string;
  kind: string;
  status: string;
  description: string;
  owner: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type FeatureRow = {
  id: string;
  projectId: string;
  mapId: string;
  parentFeatureId: string | null;
  stableKey: string;
  name: string;
  version: string;
  status: string;
  kind: string;
  description: string;
  sortOrder: number;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  children?: FeatureRow[];
};

export type EntryPointRow = {
  id: string;
  projectId: string;
  mapId: string | null;
  stableKey: string;
  name: string;
  path: string;
  kind: string;
  description: string;
  confidence: number;
  firstSeenScanRunId: string | null;
  lastSeenScanRunId: string | null;
  lastSeenCommitSha: string;
  lastScannedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CodeReferenceRow = {
  id: string;
  projectId: string;
  mapId: string | null;
  featureId: string | null;
  entryPointId: string | null;
  stableKey: string;
  path: string;
  symbol: string;
  kind: string;
  description: string;
  lineStart: number | null;
  lineEnd: number | null;
  firstSeenScanRunId: string | null;
  lastSeenScanRunId: string | null;
  lastSeenCommitSha: string;
  lastScannedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ScanRunRow = {
  id: string;
  projectId: string;
  repoKey: string;
  repoUrl: string;
  branch: string;
  commitSha: string;
  baseCommitSha: string;
  worktreeDirty: boolean;
  status: string;
  summary: Record<string, unknown>;
  metadata: Record<string, unknown>;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export type AlignmentMemberRow = {
  id: string;
  alignmentId: string;
  targetType: string;
  targetId: string;
  role: string;
  note: string;
  label?: string;
};

export type UpsertOperation = 'created' | 'updated' | 'unchanged' | 'dry_run';

export type UpsertResult<T> = {
  operation: UpsertOperation;
  changedFields: string[];
  data: T;
  dryRun: boolean;
  previewId?: string;
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
  projects: Array<ProjectRow | QueryLiteRow>;
  maps: Array<FeatureMapRow | QueryLiteRow>;
  features: Array<FeatureRow | QueryLiteRow>;
  alignments: Array<AlignmentRow | QueryLiteRow>;
  entryPoints: Array<EntryPointRow | QueryLiteRow>;
  codeReferences: Array<CodeReferenceRow | QueryLiteRow>;
  page: {
    limit: number;
    offset: number;
    nextCursor: string | null;
    hasMore: boolean;
    totals: Record<QueryContextType, number>;
  };
  summary: {
    mapCount: number;
    featureCount: number;
    alignmentCount: number;
    entryPointCount: number;
    codeReferenceCount: number;
    scanRunCount: number;
    lastUpdatedAt: string | null;
    stableKeyConflictCount: number;
    orphanCodeReferenceCount: number;
    latestScanRun: ScanRunRow | null;
  };
};

export type QueryLiteRow = {
  id: string;
  stableKey?: string;
  name?: string;
  type: QueryContextType;
  mapId?: string | null;
  projectId?: string;
  path?: string;
  symbol?: string;
  kind?: string;
  updatedAt?: string;
};

export type ResolveStableKeysResult = {
  projectId: string;
  results: Array<{
    index: number;
    type: ResolveStableKeyType;
    stableKey: string;
    mapStableKey?: string;
    found: boolean;
    id: string | null;
    reason: string;
    candidates?: Array<{ id: string; stableKey: string; mapId?: string | null; version?: string; name?: string }>;
  }>;
};

export type ProjectSummaryResult = QueryContextResult['summary'] & {
  projectId: string;
  pathReferenceCount: number;
};

export type QueryPathContextResult = {
  projectId: string;
  path: string;
  pathMode: string;
  entryPoints: EntryPointRow[];
  codeReferences: CodeReferenceRow[];
  maps: FeatureMapRow[];
  features: FeatureRow[];
  alignments: AlignmentRow[];
};

type ParsedQueryContext = ReturnType<typeof QueryContextSchema.parse>;

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

  createMap(projectId: string, input: CreateMapInput): FeatureMapRow {
    return this.upsertMap(projectId, input).data;
  }

  upsertMap(projectId: string, input: CreateMapInput): UpsertResult<FeatureMapRow> {
    const data = CreateMapSchema.parse(input);
    if (data.projectId && data.projectId !== projectId) {
      throw new ValidationError('projectId 与路径项目不一致。');
    }
    this.getProject(projectId);
    const now = nowIso();
    const existing = this.findMapForUpsert(projectId, data.id, data.stableKey);
    const id = existing?.id ?? data.id ?? (data.dryRun ? previewId('map') : newId('map'));
    const planned = {
      id,
      projectId,
      stableKey: data.stableKey,
      name: data.name,
      version: data.version,
      axis: data.axis,
      scope: data.scope,
      kind: data.kind,
      status: data.status,
      description: data.description,
      owner: data.owner,
      tags: data.tags,
      metadata: data.metadata,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    } satisfies FeatureMapRow;
    const changedFields = existing
      ? changedFieldsFor(existing, planned, ['stableKey', 'name', 'version', 'axis', 'scope', 'kind', 'status', 'description', 'owner', 'tags', 'metadata'])
      : [];
    if (data.dryRun) {
      return { operation: 'dry_run', changedFields: existing ? changedFields : ['*'], data: planned, dryRun: true, previewId: existing ? undefined : id };
    }
    if (existing && changedFields.length === 0) {
      return { operation: 'unchanged', changedFields, data: existing, dryRun: false };
    }
    this.db
      .prepare(
        `INSERT INTO maps
          (id, project_id, stable_key, name, version, axis, scope, kind, status, description, owner, tags_json, metadata_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           stable_key = excluded.stable_key,
           name = excluded.name,
           version = excluded.version,
           axis = excluded.axis,
           scope = excluded.scope,
           kind = excluded.kind,
           status = excluded.status,
           description = excluded.description,
           owner = excluded.owner,
           tags_json = excluded.tags_json,
           metadata_json = excluded.metadata_json,
           updated_at = excluded.updated_at`
      )
      .run(
        id,
        projectId,
        planned.stableKey,
        planned.name,
        planned.version,
        planned.axis,
        planned.scope,
        planned.kind,
        planned.status,
        planned.description,
        planned.owner,
        jsonArray(planned.tags),
        json(planned.metadata),
        now,
        now
      );
    this.touchProject(projectId);
    this.recordEvent(projectId, 'http', 'upsert_map', { id, stableKey: data.stableKey, name: data.name });
    return {
      operation: existing ? 'updated' : 'created',
      changedFields,
      data: this.getMap(id),
      dryRun: false
    };
  }

  upsertMapsBatch(input: BatchMapInput): BatchUpsertResult<FeatureMapRow> {
    const data = BatchMapSchema.parse(input);
    this.getProject(data.projectId);
    return this.runBatch(data.dryRun, data.items, (item) => this.upsertMap(data.projectId, { ...item, dryRun: data.dryRun }));
  }

  listMaps(projectId: string): FeatureMapRow[] {
    return this.db
      .prepare('SELECT * FROM maps WHERE project_id = ? ORDER BY axis, scope, kind, name')
      .all(projectId)
      .map(mapFeatureMap);
  }

  getMap(mapId: string): FeatureMapRow {
    const row = this.db.prepare('SELECT * FROM maps WHERE id = ?').get(mapId);
    if (!row) {
      throw new NotFoundError(`功能地图不存在: ${mapId}`);
    }
    return mapFeatureMap(row);
  }

  createFeature(mapId: string, input: CreateFeatureInput): FeatureRow {
    return this.upsertFeature(mapId, input).data;
  }

  upsertFeatureByReference(input: CreateFeatureInput): UpsertResult<FeatureRow> {
    const data = CreateFeatureSchema.parse(input);
    const mapId = this.resolveMapIdForFeatureBatch(data.projectId, data.mapId, data.mapStableKey);
    return this.upsertFeature(mapId, data);
  }

  upsertFeature(mapId: string, input: CreateFeatureInput): UpsertResult<FeatureRow> {
    const data = CreateFeatureSchema.parse(input);
    if (data.mapId && data.mapId !== mapId) {
      throw new ValidationError('mapId 与路径功能地图不一致。');
    }
    const featureMap = this.getMap(mapId);
    if (data.projectId && data.projectId !== featureMap.projectId) {
      throw new ValidationError('projectId 与功能地图所属项目不一致。');
    }
    if (data.mapStableKey && data.mapStableKey !== featureMap.stableKey) {
      throw new ValidationError('mapStableKey 与功能地图 stableKey 不一致。');
    }
    if (data.parentFeatureId) {
      const parent = this.getFeature(data.parentFeatureId);
      if (parent.mapId !== mapId) {
        throw new ValidationError('子功能必须和父功能位于同一个功能地图。');
      }
    }
    const now = nowIso();
    const existing = this.findFeatureForUpsert(mapId, data.id, data.stableKey, data.version);
    const id = existing?.id ?? data.id ?? (data.dryRun ? previewId('feat') : newId('feat'));
    if (data.parentFeatureId === id) {
      throw new ValidationError('功能不能把自己设置为父功能。');
    }
    const planned = {
      id,
      projectId: featureMap.projectId,
      mapId,
      parentFeatureId: data.parentFeatureId,
      stableKey: data.stableKey,
      name: data.name,
      version: data.version,
      status: data.status,
      kind: data.kind,
      description: data.description,
      sortOrder: data.sortOrder,
      tags: data.tags,
      metadata: data.metadata,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    } satisfies FeatureRow;
    const changedFields = existing
      ? changedFieldsFor(existing, planned, ['parentFeatureId', 'stableKey', 'name', 'version', 'status', 'kind', 'description', 'sortOrder', 'tags', 'metadata'])
      : [];
    if (data.dryRun) {
      return { operation: 'dry_run', changedFields: existing ? changedFields : ['*'], data: planned, dryRun: true, previewId: existing ? undefined : id };
    }
    if (existing && changedFields.length === 0) {
      return { operation: 'unchanged', changedFields, data: existing, dryRun: false };
    }
    this.db
      .prepare(
        `INSERT INTO features
          (id, project_id, map_id, parent_feature_id, stable_key, name, version, status, kind, description, sort_order, tags_json, metadata_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           parent_feature_id = excluded.parent_feature_id,
           stable_key = excluded.stable_key,
           name = excluded.name,
           version = excluded.version,
           status = excluded.status,
           kind = excluded.kind,
           description = excluded.description,
           sort_order = excluded.sort_order,
           tags_json = excluded.tags_json,
           metadata_json = excluded.metadata_json,
           updated_at = excluded.updated_at`
      )
      .run(
        id,
        planned.projectId,
        mapId,
        planned.parentFeatureId,
        planned.stableKey,
        planned.name,
        planned.version,
        planned.status,
        planned.kind,
        planned.description,
        planned.sortOrder,
        jsonArray(planned.tags),
        json(planned.metadata),
        now,
        now
      );
    this.touchProject(featureMap.projectId);
    this.recordEvent(featureMap.projectId, 'http', 'upsert_feature', { id, mapId, stableKey: data.stableKey, name: data.name });
    return {
      operation: existing ? 'updated' : 'created',
      changedFields,
      data: this.getFeature(id),
      dryRun: false
    };
  }

  upsertFeaturesBatch(input: BatchFeatureInput): BatchUpsertResult<FeatureRow> {
    const data = BatchFeatureSchema.parse(input);
    if (data.projectId) {
      this.getProject(data.projectId);
    }
    if (data.mapId) {
      this.getMap(data.mapId);
    }
    return this.runBatch(data.dryRun, data.items, (item) => {
      const resolvedMapId = this.resolveMapIdForFeatureBatch(data.projectId, item.mapId ?? data.mapId, item.mapStableKey ?? data.mapStableKey);
      return this.upsertFeature(resolvedMapId, { ...item, mapId: resolvedMapId, dryRun: data.dryRun });
    });
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
      .prepare('SELECT * FROM features WHERE project_id = ? ORDER BY map_id, parent_feature_id, sort_order, name')
      .all(projectId)
      .map(mapFeature);
  }

  createEntryPoint(projectId: string, input: CreateEntryPointInput): EntryPointRow {
    return this.upsertEntryPoint(projectId, input).data;
  }

  upsertEntryPoint(projectId: string, input: CreateEntryPointInput): UpsertResult<EntryPointRow> {
    const data = CreateEntryPointSchema.parse(input);
    if (data.projectId && data.projectId !== projectId) {
      throw new ValidationError('projectId 与路径项目不一致。');
    }
    this.getProject(projectId);
    const mapId = this.resolveOptionalMapId(projectId, data.mapId, data.mapStableKey);
    const scanRun = data.scanRunId ? this.assertScanRunInProject(projectId, data.scanRunId) : null;
    const now = nowIso();
    const existing = this.findEntryPointForUpsert(projectId, data.id, data.stableKey);
    const id = existing?.id ?? data.id ?? (data.dryRun ? previewId('ep') : newId('ep'));
    const planned = {
      id,
      projectId,
      mapId,
      stableKey: data.stableKey,
      name: data.name,
      path: data.path,
      kind: data.kind,
      description: data.description,
      confidence: data.confidence,
      firstSeenScanRunId: existing?.firstSeenScanRunId ?? scanRun?.id ?? null,
      lastSeenScanRunId: scanRun?.id ?? existing?.lastSeenScanRunId ?? null,
      lastSeenCommitSha: scanRun?.commitSha ?? existing?.lastSeenCommitSha ?? '',
      lastScannedAt: scanRun ? now : existing?.lastScannedAt ?? null,
      metadata: data.metadata,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    } satisfies EntryPointRow;
    const changedFields = existing
      ? changedFieldsFor(existing, planned, [
          'mapId',
          'stableKey',
          'name',
          'path',
          'kind',
          'description',
          'confidence',
          'firstSeenScanRunId',
          'lastSeenScanRunId',
          'lastSeenCommitSha',
          'lastScannedAt',
          'metadata'
        ])
      : [];
    if (data.dryRun) {
      return { operation: 'dry_run', changedFields: existing ? changedFields : ['*'], data: planned, dryRun: true, previewId: existing ? undefined : id };
    }
    if (existing && changedFields.length === 0) {
      return { operation: 'unchanged', changedFields, data: existing, dryRun: false };
    }
    this.db
      .prepare(
        `INSERT INTO entry_points
          (id, project_id, map_id, stable_key, name, path, kind, description, confidence, first_seen_scan_run_id, last_seen_scan_run_id, last_seen_commit_sha, last_scanned_at, metadata_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           map_id = excluded.map_id,
           stable_key = excluded.stable_key,
           name = excluded.name,
           path = excluded.path,
           kind = excluded.kind,
           description = excluded.description,
           confidence = excluded.confidence,
           first_seen_scan_run_id = excluded.first_seen_scan_run_id,
           last_seen_scan_run_id = excluded.last_seen_scan_run_id,
           last_seen_commit_sha = excluded.last_seen_commit_sha,
           last_scanned_at = excluded.last_scanned_at,
           metadata_json = excluded.metadata_json,
           updated_at = excluded.updated_at`
      )
      .run(
        id,
        projectId,
        planned.mapId,
        planned.stableKey,
        planned.name,
        planned.path,
        planned.kind,
        planned.description,
        planned.confidence,
        planned.firstSeenScanRunId,
        planned.lastSeenScanRunId,
        planned.lastSeenCommitSha,
        planned.lastScannedAt,
        json(planned.metadata),
        now,
        now
      );
    this.touchProject(projectId);
    this.recordEvent(projectId, 'http', 'upsert_entry_point', { id, stableKey: data.stableKey, path: data.path });
    return {
      operation: existing ? 'updated' : 'created',
      changedFields,
      data: this.getEntryPoint(id),
      dryRun: false
    };
  }

  upsertEntryPointsBatch(input: BatchEntryPointInput): BatchUpsertResult<EntryPointRow> {
    const data = BatchEntryPointSchema.parse(input);
    this.getProject(data.projectId);
    return this.runBatch(data.dryRun, data.items, (item) => this.upsertEntryPoint(data.projectId, { ...item, dryRun: data.dryRun }));
  }

  getEntryPoint(entryPointId: string): EntryPointRow {
    const row = this.db.prepare('SELECT * FROM entry_points WHERE id = ?').get(entryPointId);
    if (!row) {
      throw new NotFoundError(`入口文件不存在: ${entryPointId}`);
    }
    return mapEntryPoint(row);
  }

  listEntryPoints(projectId: string): EntryPointRow[] {
    return this.db
      .prepare('SELECT * FROM entry_points WHERE project_id = ? ORDER BY kind, path, name')
      .all(projectId)
      .map(mapEntryPoint);
  }

  createCodeReference(projectId: string, input: CreateCodeReferenceInput): CodeReferenceRow {
    return this.upsertCodeReference(projectId, input).data;
  }

  upsertCodeReference(projectId: string, input: CreateCodeReferenceInput): UpsertResult<CodeReferenceRow> {
    const data = CreateCodeReferenceSchema.parse(input);
    if (data.projectId && data.projectId !== projectId) {
      throw new ValidationError('projectId 与路径项目不一致。');
    }
    this.getProject(projectId);
    const resolved = this.resolveCodeReferenceOwnership(projectId, {
      mapId: data.mapId,
      mapStableKey: data.mapStableKey,
      featureId: data.featureId,
      featureStableKey: data.featureStableKey,
      featureVersion: data.featureVersion,
      entryPointId: data.entryPointId,
      entryPointStableKey: data.entryPointStableKey
    });
    const scanRun = data.scanRunId ? this.assertScanRunInProject(projectId, data.scanRunId) : null;
    const now = nowIso();
    const existing = this.findCodeReferenceForUpsert(projectId, data.id, data.stableKey, {
      mapId: resolved.mapId,
      featureId: resolved.featureId,
      entryPointId: resolved.entryPointId,
      path: data.path,
      symbol: data.symbol,
      kind: data.kind
    });
    const id = existing?.id ?? data.id ?? (data.dryRun ? previewId('ref') : newId('ref'));
    const planned = {
      id,
      projectId,
      mapId: resolved.mapId,
      featureId: resolved.featureId,
      entryPointId: resolved.entryPointId,
      stableKey: data.stableKey ?? existing?.stableKey ?? '',
      path: data.path,
      symbol: data.symbol,
      kind: data.kind,
      description: data.description,
      lineStart: data.lineStart,
      lineEnd: data.lineEnd,
      firstSeenScanRunId: existing?.firstSeenScanRunId ?? scanRun?.id ?? null,
      lastSeenScanRunId: scanRun?.id ?? existing?.lastSeenScanRunId ?? null,
      lastSeenCommitSha: scanRun?.commitSha ?? existing?.lastSeenCommitSha ?? '',
      lastScannedAt: scanRun ? now : existing?.lastScannedAt ?? null,
      metadata: data.metadata,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    } satisfies CodeReferenceRow;
    const changedFields = existing
      ? changedFieldsFor(existing, planned, [
          'mapId',
          'featureId',
          'entryPointId',
          'stableKey',
          'path',
          'symbol',
          'kind',
          'description',
          'lineStart',
          'lineEnd',
          'firstSeenScanRunId',
          'lastSeenScanRunId',
          'lastSeenCommitSha',
          'lastScannedAt',
          'metadata'
        ])
      : [];
    if (data.dryRun) {
      return { operation: 'dry_run', changedFields: existing ? changedFields : ['*'], data: planned, dryRun: true, previewId: existing ? undefined : id };
    }
    if (existing && changedFields.length === 0) {
      return { operation: 'unchanged', changedFields, data: existing, dryRun: false };
    }
    this.db
      .prepare(
        `INSERT INTO code_references
          (id, project_id, map_id, feature_id, entry_point_id, stable_key, path, symbol, kind, description, line_start, line_end, first_seen_scan_run_id, last_seen_scan_run_id, last_seen_commit_sha, last_scanned_at, metadata_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           map_id = excluded.map_id,
           feature_id = excluded.feature_id,
           entry_point_id = excluded.entry_point_id,
           stable_key = excluded.stable_key,
           path = excluded.path,
           symbol = excluded.symbol,
           kind = excluded.kind,
           description = excluded.description,
           line_start = excluded.line_start,
           line_end = excluded.line_end,
           first_seen_scan_run_id = excluded.first_seen_scan_run_id,
           last_seen_scan_run_id = excluded.last_seen_scan_run_id,
           last_seen_commit_sha = excluded.last_seen_commit_sha,
           last_scanned_at = excluded.last_scanned_at,
           metadata_json = excluded.metadata_json,
           updated_at = excluded.updated_at`
      )
      .run(
        id,
        projectId,
        planned.mapId,
        planned.featureId,
        planned.entryPointId,
        planned.stableKey,
        planned.path,
        planned.symbol,
        planned.kind,
        planned.description,
        planned.lineStart,
        planned.lineEnd,
        planned.firstSeenScanRunId,
        planned.lastSeenScanRunId,
        planned.lastSeenCommitSha,
        planned.lastScannedAt,
        json(planned.metadata),
        now,
        now
      );
    this.touchProject(projectId);
    this.recordEvent(projectId, 'http', 'upsert_code_reference', { id, stableKey: data.stableKey, path: data.path, symbol: data.symbol });
    return {
      operation: existing ? 'updated' : 'created',
      changedFields,
      data: this.getCodeReference(id),
      dryRun: false
    };
  }

  upsertCodeReferencesBatch(input: BatchCodeReferenceInput): BatchUpsertResult<CodeReferenceRow> {
    const data = BatchCodeReferenceSchema.parse(input);
    this.getProject(data.projectId);
    return this.runBatch(data.dryRun, data.items, (item) => this.upsertCodeReference(data.projectId, { ...item, dryRun: data.dryRun }));
  }

  getCodeReference(codeReferenceId: string): CodeReferenceRow {
    const row = this.db.prepare('SELECT * FROM code_references WHERE id = ?').get(codeReferenceId);
    if (!row) {
      throw new NotFoundError(`代码引用不存在: ${codeReferenceId}`);
    }
    return mapCodeReference(row);
  }

  listCodeReferences(projectId: string): CodeReferenceRow[] {
    return this.db
      .prepare('SELECT * FROM code_references WHERE project_id = ? ORDER BY path, symbol, kind')
      .all(projectId)
      .map(mapCodeReference);
  }

  getProjectTree(projectId: string) {
    const project = this.getProject(projectId);
    const maps = this.listMaps(projectId);
    const features = this.listFeatures(projectId);
    return {
      project,
      maps: maps.map((featureMap) => ({
        ...featureMap,
        features: buildFeatureTree(features.filter((feature) => feature.mapId === featureMap.id))
      })),
      entryPoints: this.listEntryPoints(projectId),
      codeReferences: this.listCodeReferences(projectId),
      alignments: this.listAlignments(projectId)
    };
  }

  createAlignment(projectId: string, input: CreateAlignmentInput): AlignmentRow {
    return this.upsertAlignment(projectId, input).data;
  }

  upsertAlignment(projectId: string, input: CreateAlignmentInput): UpsertResult<AlignmentRow> {
    const data = CreateAlignmentSchema.parse(input);
    if (data.projectId && data.projectId !== projectId) {
      throw new ValidationError('projectId 与路径项目不一致。');
    }
    this.getProject(projectId);
    const resolvedMembers = data.members.map((member) => this.resolveAlignmentMember(projectId, member));

    const now = nowIso();
    const memberSignature = alignmentMemberSignature(resolvedMembers);
    const existing = this.findAlignmentForUpsert(projectId, data.id, data.stableKey, memberSignature);
    const id = existing?.id ?? data.id ?? (data.dryRun ? previewId('aln') : newId('aln'));
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
      members: resolvedMembers.map((member) => ({
        id: data.dryRun ? previewId('am') : newId('am'),
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
      return { operation: 'dry_run', changedFields: existing ? changedFields : ['*'], data: planned, dryRun: true, previewId: existing ? undefined : id };
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
        .run(id, projectId, planned.stableKey, memberSignature, planned.name, planned.relation, planned.status, planned.description, json(planned.metadata), now, now);
      this.db.prepare('DELETE FROM alignment_members WHERE alignment_id = ?').run(id);
      const insert = this.db.prepare(
        `INSERT INTO alignment_members (id, alignment_id, target_type, target_id, role, note)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
      for (const member of resolvedMembers) {
        insert.run(newId('am'), id, member.targetType, member.targetId, member.role, member.note);
      }
    });
    this.touchProject(projectId);
    this.recordEvent(projectId, 'http', 'upsert_alignment', { id, stableKey: data.stableKey, name: data.name });
    return {
      operation: existing ? 'updated' : 'created',
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
    return this.db
      .prepare('SELECT * FROM alignments WHERE project_id = ? ORDER BY updated_at DESC')
      .all(projectId)
      .map((row) => mapAlignment(row, this.listAlignmentMembers((row as { id: string }).id)));
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
    const resolvedMapId = this.resolveQueryMapId(query);
    const resolvedQuery = { ...query, mapId: resolvedMapId ?? query.mapId } satisfies ParsedQueryContext;
    const types = new Set<QueryContextType>(query.types ?? ['project', 'map', 'feature', 'alignment', 'entry_point', 'code_reference']);
    const offset = parseCursor(query.cursor) ?? query.offset;
    const limit = query.limit;
    const projects = query.includeSummaryOnly || !types.has('project') ? [] : this.queryProjects(resolvedQuery, limit, offset);
    const maps = query.includeSummaryOnly || !types.has('map') ? [] : this.queryMaps(resolvedQuery, limit, offset);
    const features = query.includeSummaryOnly || !types.has('feature') ? [] : this.queryFeatures(resolvedQuery, limit, offset);
    const alignments = query.includeSummaryOnly || !types.has('alignment') ? [] : this.queryAlignments(resolvedQuery, limit, offset, query.includeMembers);
    const entryPoints = query.includeSummaryOnly || !types.has('entry_point') ? [] : this.queryEntryPoints(resolvedQuery, limit, offset);
    const codeReferences = query.includeSummaryOnly || !types.has('code_reference') ? [] : this.queryCodeReferences(resolvedQuery, limit, offset);
    const totals: Record<QueryContextType, number> = {
      project: types.has('project') ? this.countProjects(resolvedQuery) : 0,
      map: types.has('map') ? this.countMaps(resolvedQuery) : 0,
      feature: types.has('feature') ? this.countFeatures(resolvedQuery) : 0,
      alignment: types.has('alignment') ? this.countAlignments(resolvedQuery) : 0,
      entry_point: types.has('entry_point') ? this.countEntryPoints(resolvedQuery) : 0,
      code_reference: types.has('code_reference') ? this.countCodeReferences(resolvedQuery) : 0
    };
    const hasMore = Object.values(totals).some((total) => total > offset + limit);

    return {
      projects: presentRows('project', projects, query.view, query.includeMetadata),
      maps: presentRows('map', maps, query.view, query.includeMetadata),
      features: presentRows('feature', features, query.view, query.includeMetadata),
      alignments: presentRows('alignment', alignments, query.view, query.includeMetadata),
      entryPoints: presentRows('entry_point', entryPoints, query.view, query.includeMetadata),
      codeReferences: presentRows('code_reference', codeReferences, query.view, query.includeMetadata),
      page: {
        limit,
        offset,
        nextCursor: hasMore ? String(offset + limit) : null,
        hasMore,
        totals
      },
      summary: this.contextSummary(resolvedQuery.projectId)
    };
  }

  overview() {
    const projects = this.listProjects();
    return {
      projects,
      totals: {
        projects: projects.length,
        maps: scalarCount(this.db.prepare('SELECT COUNT(*) AS count FROM maps').get()),
        features: scalarCount(this.db.prepare('SELECT COUNT(*) AS count FROM features').get()),
        entryPoints: scalarCount(this.db.prepare('SELECT COUNT(*) AS count FROM entry_points').get()),
        codeReferences: scalarCount(this.db.prepare('SELECT COUNT(*) AS count FROM code_references').get()),
        alignments: scalarCount(this.db.prepare('SELECT COUNT(*) AS count FROM alignments').get()),
        scanRuns: scalarCount(this.db.prepare('SELECT COUNT(*) AS count FROM scan_runs').get())
      }
    };
  }

  projectSummary(input: ProjectSummaryInput): ProjectSummaryResult {
    const data = ProjectSummarySchema.parse(input);
    this.getProject(data.projectId);
    return {
      projectId: data.projectId,
      ...this.contextSummary(data.projectId),
      pathReferenceCount: scalarCount(
        this.db
          .prepare(
            `SELECT COUNT(*) AS count
             FROM (
               SELECT path FROM entry_points WHERE project_id = ?
               UNION
               SELECT path FROM code_references WHERE project_id = ?
             )`
          )
          .get(data.projectId, data.projectId)
      )
    };
  }

  beginScan(input: BeginScanInput): ScanRunRow {
    const data = BeginScanSchema.parse(input);
    this.getProject(data.projectId);
    const now = nowIso();
    const id = data.id ?? newId('scan');
    this.db
      .prepare(
        `INSERT INTO scan_runs
          (id, project_id, repo_key, repo_url, branch, commit_sha, base_commit_sha, worktree_dirty, status, summary_json, metadata_json, started_at, finished_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'running', '{}', ?, ?, NULL, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           repo_key = excluded.repo_key,
           repo_url = excluded.repo_url,
           branch = excluded.branch,
           commit_sha = excluded.commit_sha,
           base_commit_sha = excluded.base_commit_sha,
           worktree_dirty = excluded.worktree_dirty,
           status = 'running',
           metadata_json = excluded.metadata_json,
           started_at = excluded.started_at,
           finished_at = NULL,
           updated_at = excluded.updated_at`
      )
      .run(
        id,
        data.projectId,
        data.repoKey,
        data.repoUrl,
        data.branch,
        data.commitSha,
        data.baseCommitSha ?? '',
        data.worktreeDirty ? 1 : 0,
        json(data.metadata),
        now,
        now,
        now
      );
    this.touchProject(data.projectId);
    this.recordEvent(data.projectId, 'http', 'begin_scan', { id, repoKey: data.repoKey, branch: data.branch, commitSha: data.commitSha });
    return this.getScanRun(id);
  }

  finishScan(input: FinishScanInput): ScanRunRow {
    const data = FinishScanSchema.parse(input);
    const existing = this.getScanRun(data.scanRunId);
    const metadata = { ...existing.metadata, ...data.metadata };
    const now = nowIso();
    this.db
      .prepare(
        `UPDATE scan_runs
         SET status = ?, summary_json = ?, metadata_json = ?, finished_at = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(data.status, json(data.summary), json(metadata), now, now, data.scanRunId);
    this.touchProject(existing.projectId);
    this.recordEvent(existing.projectId, 'http', 'finish_scan', { id: data.scanRunId, status: data.status });
    return this.getScanRun(data.scanRunId);
  }

  resolveStableKeys(input: ResolveStableKeysInput): ResolveStableKeysResult {
    const data = ResolveStableKeysSchema.parse(input);
    this.getProject(data.projectId);
    return {
      projectId: data.projectId,
      results: data.items.map((item, index) => {
        try {
          const resolved = this.resolveStableKeyItem(data.projectId, item);
          return {
            index,
            type: item.type,
            stableKey: item.stableKey ?? item.id ?? item.path ?? '',
            mapStableKey: item.mapStableKey,
            found: Boolean(resolved),
            id: resolved?.id ?? null,
            reason: resolved ? 'resolved' : 'not_found',
            candidates: resolved?.candidates
          };
        } catch (error) {
          return {
            index,
            type: item.type,
            stableKey: item.stableKey ?? item.id ?? item.path ?? '',
            mapStableKey: item.mapStableKey,
            found: false,
            id: null,
            reason: error instanceof Error ? error.message : '解析失败。'
          };
        }
      })
    };
  }

  queryPathContext(input: QueryPathContextInput): QueryPathContextResult {
    const data = QueryPathContextSchema.parse(input);
    this.getProject(data.projectId);
    const { clause, args } = pathPredicate(data.path, data.pathMode);
    const entryPoints = this.db
      .prepare(`SELECT * FROM entry_points WHERE project_id = ? AND ${clause('path')} ORDER BY kind, path, name`)
      .all(data.projectId, ...args)
      .map(mapEntryPoint);
    const codeReferences = data.includeReferences
      ? this.db
          .prepare(`SELECT * FROM code_references WHERE project_id = ? AND ${clause('path')} ORDER BY path, symbol, kind`)
          .all(data.projectId, ...args)
          .map(mapCodeReference)
      : [];
    const mapIds = unique([...entryPoints.map((entryPoint) => entryPoint.mapId).filter(isString), ...codeReferences.map((reference) => reference.mapId).filter(isString)]);
    const featureIds = unique(codeReferences.map((reference) => reference.featureId).filter(isString));
    const maps = mapIds.map((mapId) => this.findMapById(mapId)).filter(isNonNull);
    const features = featureIds.map((featureId) => this.findFeatureById(featureId)).filter(isNonNull);
    const alignableIds = new Set<string>([
      ...maps.map((featureMap) => `map:${featureMap.id}`),
      ...features.map((feature) => `feature:${feature.id}`),
      ...entryPoints.map((entryPoint) => `entry_point:${entryPoint.id}`),
      ...codeReferences.map((reference) => `code_reference:${reference.id}`)
    ]);
    const alignments = data.includeAlignments ? this.findAlignmentsForTargets(data.projectId, alignableIds) : [];
    return {
      projectId: data.projectId,
      path: data.path,
      pathMode: data.pathMode,
      entryPoints,
      codeReferences,
      maps,
      features,
      alignments
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

  private queryMaps(query: ParsedQueryContext, limit: number, offset: number): FeatureMapRow[] {
    const { where, args } = this.mapQueryParts(query);
    return this.db
      .prepare(`SELECT m.* FROM maps m WHERE ${where.join(' AND ')} ORDER BY m.axis, m.scope, m.kind, m.name LIMIT ? OFFSET ?`)
      .all(...args, limit, offset)
      .map(mapFeatureMap);
  }

  private countMaps(query: ParsedQueryContext): number {
    const { where, args } = this.mapQueryParts(query);
    return scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM maps m WHERE ${where.join(' AND ')}`).get(...args));
  }

  private queryFeatures(query: ParsedQueryContext, limit: number, offset: number): FeatureRow[] {
    const { where, args } = this.featureQueryParts(query);
    return this.db
      .prepare(
        `SELECT f.*
         FROM features f
         WHERE ${where.join(' AND ')}
         ORDER BY f.map_id, f.parent_feature_id, f.sort_order, f.name
         LIMIT ? OFFSET ?`
      )
      .all(...args, limit, offset)
      .map(mapFeature);
  }

  private countFeatures(query: ParsedQueryContext): number {
    const { where, args } = this.featureQueryParts(query);
    return scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM features f WHERE ${where.join(' AND ')}`).get(...args));
  }

  private queryEntryPoints(query: ParsedQueryContext, limit: number, offset: number): EntryPointRow[] {
    const { where, args } = this.entryPointQueryParts(query);
    return this.db
      .prepare(`SELECT ep.* FROM entry_points ep WHERE ${where.join(' AND ')} ORDER BY ep.kind, ep.path, ep.name LIMIT ? OFFSET ?`)
      .all(...args, limit, offset)
      .map(mapEntryPoint);
  }

  private countEntryPoints(query: ParsedQueryContext): number {
    const { where, args } = this.entryPointQueryParts(query);
    return scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM entry_points ep WHERE ${where.join(' AND ')}`).get(...args));
  }

  private queryCodeReferences(query: ParsedQueryContext, limit: number, offset: number): CodeReferenceRow[] {
    const { where, args } = this.codeReferenceQueryParts(query);
    return this.db
      .prepare(`SELECT cr.* FROM code_references cr WHERE ${where.join(' AND ')} ORDER BY cr.path, cr.symbol, cr.kind LIMIT ? OFFSET ?`)
      .all(...args, limit, offset)
      .map(mapCodeReference);
  }

  private countCodeReferences(query: ParsedQueryContext): number {
    const { where, args } = this.codeReferenceQueryParts(query);
    return scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM code_references cr WHERE ${where.join(' AND ')}`).get(...args));
  }

  private queryAlignments(query: ParsedQueryContext, limit: number, offset: number, includeMembers = true): AlignmentRow[] {
    const { where, args } = this.alignmentQueryParts(query);
    return this.db
      .prepare(`SELECT a.* FROM alignments a WHERE ${where.join(' AND ')} ORDER BY a.updated_at DESC LIMIT ? OFFSET ?`)
      .all(...args, limit, offset)
      .map((row) => mapAlignment(row, includeMembers ? this.listAlignmentMembers((row as { id: string }).id) : []));
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
    if (query.stableKey || query.mapId || query.alignmentId || query.parentFeatureId !== undefined || query.entryPointId || query.codeReferenceId || query.path) {
      where.push('0=1');
    }
    appendKeywordClause(where, args, 'projects', ['id', 'name', 'current_version', 'description'], query.keyword);
    return { where, args };
  }

  private mapQueryParts(query: ParsedQueryContext): QueryParts {
    const where = ['1=1'];
    const args: SQLInputValue[] = [];
    if (query.projectId) {
      where.push('m.project_id = ?');
      args.push(query.projectId);
    }
    if (query.mapId) {
      where.push('m.id = ?');
      args.push(query.mapId);
    }
    if (query.stableKey) {
      where.push('m.stable_key = ?');
      args.push(query.stableKey);
    }
    if (query.alignmentId) {
      where.push(
        `EXISTS (
          SELECT 1 FROM alignment_members am
          WHERE am.alignment_id = ? AND am.target_type = 'map' AND am.target_id = m.id
        )`
      );
      args.push(query.alignmentId);
    }
    if (query.entryPointId) {
      where.push('EXISTS (SELECT 1 FROM entry_points ep WHERE ep.id = ? AND ep.map_id = m.id)');
      args.push(query.entryPointId);
    }
    if (query.codeReferenceId) {
      where.push('EXISTS (SELECT 1 FROM code_references cr WHERE cr.id = ? AND cr.map_id = m.id)');
      args.push(query.codeReferenceId);
    }
    if (query.parentFeatureId !== undefined) {
      where.push(
        `EXISTS (
          SELECT 1 FROM features f
          WHERE f.map_id = m.id AND ${query.parentFeatureId === null ? 'f.parent_feature_id IS NULL' : 'f.parent_feature_id = ?'}
        )`
      );
      if (query.parentFeatureId) args.push(query.parentFeatureId);
    }
    if (query.path) {
      where.push(
        `(EXISTS (SELECT 1 FROM entry_points ep WHERE ep.map_id = m.id AND LOWER(ep.path) LIKE ? ESCAPE '\\')
          OR EXISTS (SELECT 1 FROM code_references cr WHERE cr.map_id = m.id AND LOWER(cr.path) LIKE ? ESCAPE '\\'))`
      );
      const pattern = pathPattern(query.path, query.pathMode);
      args.push(pattern, pattern);
    }
    appendKeywordClause(where, args, 'm', ['id', 'stable_key', 'name', 'version', 'axis', 'scope', 'kind', 'status', 'description', 'owner'], query.keyword);
    return { where, args };
  }

  private featureQueryParts(query: ParsedQueryContext): QueryParts {
    const where = ['1=1'];
    const args: SQLInputValue[] = [];
    if (query.projectId) {
      where.push('f.project_id = ?');
      args.push(query.projectId);
    }
    if (query.mapId) {
      where.push('f.map_id = ?');
      args.push(query.mapId);
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
    if (query.entryPointId) {
      where.push('EXISTS (SELECT 1 FROM code_references cr WHERE cr.feature_id = f.id AND cr.entry_point_id = ?)');
      args.push(query.entryPointId);
    }
    if (query.codeReferenceId) {
      where.push('EXISTS (SELECT 1 FROM code_references cr WHERE cr.id = ? AND cr.feature_id = f.id)');
      args.push(query.codeReferenceId);
    }
    if (query.path) {
      where.push('EXISTS (SELECT 1 FROM code_references cr WHERE cr.feature_id = f.id AND LOWER(cr.path) LIKE ? ESCAPE \'\\\')');
      args.push(pathPattern(query.path, query.pathMode));
    }
    appendKeywordClause(where, args, 'f', ['id', 'stable_key', 'name', 'version', 'status', 'kind', 'description'], query.keyword);
    return { where, args };
  }

  private entryPointQueryParts(query: ParsedQueryContext): QueryParts {
    const where = ['1=1'];
    const args: SQLInputValue[] = [];
    if (query.projectId) {
      where.push('ep.project_id = ?');
      args.push(query.projectId);
    }
    if (query.mapId) {
      where.push('ep.map_id = ?');
      args.push(query.mapId);
    }
    if (query.entryPointId) {
      where.push('ep.id = ?');
      args.push(query.entryPointId);
    }
    if (query.codeReferenceId) {
      where.push('EXISTS (SELECT 1 FROM code_references cr WHERE cr.id = ? AND cr.entry_point_id = ep.id)');
      args.push(query.codeReferenceId);
    }
    if (query.stableKey) {
      where.push('ep.stable_key = ?');
      args.push(query.stableKey);
    }
    if (query.alignmentId) {
      where.push(
        `EXISTS (
          SELECT 1 FROM alignment_members am
          WHERE am.alignment_id = ? AND am.target_type = 'entry_point' AND am.target_id = ep.id
        )`
      );
      args.push(query.alignmentId);
    }
    if (query.parentFeatureId === null) {
      where.push(
        `EXISTS (
          SELECT 1 FROM code_references cr
          JOIN features f ON f.id = cr.feature_id
          WHERE cr.entry_point_id = ep.id AND f.parent_feature_id IS NULL
        )`
      );
    } else if (query.parentFeatureId) {
      where.push(
        `EXISTS (
          SELECT 1 FROM code_references cr
          JOIN features f ON f.id = cr.feature_id
          WHERE cr.entry_point_id = ep.id AND f.parent_feature_id = ?
        )`
      );
      args.push(query.parentFeatureId);
    }
    if (query.path) {
      where.push('LOWER(ep.path) LIKE ? ESCAPE \'\\\'');
      args.push(pathPattern(query.path, query.pathMode));
    }
    appendKeywordClause(where, args, 'ep', ['id', 'stable_key', 'name', 'path', 'kind', 'description'], query.keyword);
    return { where, args };
  }

  private codeReferenceQueryParts(query: ParsedQueryContext): QueryParts {
    const where = ['1=1'];
    const args: SQLInputValue[] = [];
    if (query.projectId) {
      where.push('cr.project_id = ?');
      args.push(query.projectId);
    }
    if (query.mapId) {
      where.push('cr.map_id = ?');
      args.push(query.mapId);
    }
    if (query.entryPointId) {
      where.push('cr.entry_point_id = ?');
      args.push(query.entryPointId);
    }
    if (query.codeReferenceId) {
      where.push('cr.id = ?');
      args.push(query.codeReferenceId);
    }
    if (query.stableKey) {
      where.push('cr.stable_key = ?');
      args.push(query.stableKey);
    }
    if (query.alignmentId) {
      where.push(
        `EXISTS (
          SELECT 1 FROM alignment_members am
          WHERE am.alignment_id = ? AND am.target_type = 'code_reference' AND am.target_id = cr.id
        )`
      );
      args.push(query.alignmentId);
    }
    if (query.parentFeatureId === null) {
      where.push(
        `EXISTS (
          SELECT 1 FROM features f
          WHERE f.id = cr.feature_id AND f.parent_feature_id IS NULL
        )`
      );
    } else if (query.parentFeatureId) {
      where.push(
        `EXISTS (
          SELECT 1 FROM features f
          WHERE f.id = cr.feature_id AND f.parent_feature_id = ?
        )`
      );
      args.push(query.parentFeatureId);
    }
    if (query.path) {
      where.push('LOWER(cr.path) LIKE ? ESCAPE \'\\\'');
      args.push(pathPattern(query.path, query.pathMode));
    }
    appendKeywordClause(where, args, 'cr', ['id', 'stable_key', 'path', 'symbol', 'kind', 'description'], query.keyword);
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
    if (query.mapId) {
      where.push(
        `EXISTS (
          SELECT 1
          FROM alignment_members am
          LEFT JOIN features f ON am.target_type = 'feature' AND f.id = am.target_id
          LEFT JOIN entry_points ep ON am.target_type = 'entry_point' AND ep.id = am.target_id
          LEFT JOIN code_references cr ON am.target_type = 'code_reference' AND cr.id = am.target_id
          WHERE am.alignment_id = a.id
            AND (
              (am.target_type = 'map' AND am.target_id = ?)
              OR (am.target_type = 'feature' AND f.map_id = ?)
              OR (am.target_type = 'entry_point' AND ep.map_id = ?)
              OR (am.target_type = 'code_reference' AND cr.map_id = ?)
            )
        )`
      );
      args.push(query.mapId, query.mapId, query.mapId, query.mapId);
    }
    if (query.parentFeatureId === null) {
      where.push(
        `EXISTS (
          SELECT 1
          FROM alignment_members am
          LEFT JOIN features f ON am.target_type = 'feature' AND f.id = am.target_id
          LEFT JOIN code_references cr ON am.target_type = 'code_reference' AND cr.id = am.target_id
          LEFT JOIN features rf ON rf.id = cr.feature_id
          WHERE am.alignment_id = a.id
            AND ((am.target_type = 'feature' AND f.parent_feature_id IS NULL)
              OR (am.target_type = 'code_reference' AND rf.parent_feature_id IS NULL))
        )`
      );
    } else if (query.parentFeatureId) {
      where.push(
        `EXISTS (
          SELECT 1
          FROM alignment_members am
          LEFT JOIN features f ON am.target_type = 'feature' AND f.id = am.target_id
          LEFT JOIN code_references cr ON am.target_type = 'code_reference' AND cr.id = am.target_id
          WHERE am.alignment_id = a.id
            AND ((am.target_type = 'feature' AND f.parent_feature_id = ?)
              OR (am.target_type = 'code_reference' AND cr.feature_id IN (SELECT id FROM features WHERE parent_feature_id = ?)))
        )`
      );
      args.push(query.parentFeatureId, query.parentFeatureId);
    }
    if (query.entryPointId) {
      where.push(
        `EXISTS (
          SELECT 1
          FROM alignment_members am
          LEFT JOIN code_references cr ON am.target_type = 'code_reference' AND cr.id = am.target_id
          WHERE am.alignment_id = a.id
            AND ((am.target_type = 'entry_point' AND am.target_id = ?) OR (am.target_type = 'code_reference' AND cr.entry_point_id = ?))
        )`
      );
      args.push(query.entryPointId, query.entryPointId);
    }
    if (query.codeReferenceId) {
      where.push(
        `EXISTS (
          SELECT 1 FROM alignment_members am
          WHERE am.alignment_id = a.id AND am.target_type = 'code_reference' AND am.target_id = ?
        )`
      );
      args.push(query.codeReferenceId);
    }
    if (query.path) {
      where.push(
        `EXISTS (
          SELECT 1
          FROM alignment_members am
          LEFT JOIN entry_points ep ON am.target_type = 'entry_point' AND ep.id = am.target_id
          LEFT JOIN code_references cr ON am.target_type = 'code_reference' AND cr.id = am.target_id
          WHERE am.alignment_id = a.id
            AND ((am.target_type = 'entry_point' AND LOWER(ep.path) LIKE ? ESCAPE '\\')
              OR (am.target_type = 'code_reference' AND LOWER(cr.path) LIKE ? ESCAPE '\\'))
        )`
      );
      const pattern = pathPattern(query.path, query.pathMode);
      args.push(pattern, pattern);
    }
    appendKeywordClause(where, args, 'a', ['id', 'stable_key', 'name', 'relation', 'status', 'description'], query.keyword);
    return { where, args };
  }

  private contextSummary(projectId: string | undefined): QueryContextResult['summary'] {
    const projectWhere = projectId ? 'WHERE project_id = ?' : '';
    const projectArgs = projectId ? [projectId] : [];
    return {
      mapCount: scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM maps ${projectWhere}`).get(...projectArgs)),
      featureCount: scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM features ${projectWhere}`).get(...projectArgs)),
      alignmentCount: scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM alignments ${projectWhere}`).get(...projectArgs)),
      entryPointCount: scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM entry_points ${projectWhere}`).get(...projectArgs)),
      codeReferenceCount: scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM code_references ${projectWhere}`).get(...projectArgs)),
      scanRunCount: scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM scan_runs ${projectWhere}`).get(...projectArgs)),
      lastUpdatedAt: this.lastUpdatedAt(projectId),
      stableKeyConflictCount: this.stableKeyConflictCount(projectId),
      orphanCodeReferenceCount: scalarCount(
        this.db
          .prepare(`SELECT COUNT(*) AS count FROM code_references ${projectWhere ? `${projectWhere} AND` : 'WHERE'} map_id IS NULL AND feature_id IS NULL AND entry_point_id IS NULL`)
          .get(...projectArgs)
      ),
      latestScanRun: this.latestScanRun(projectId)
    };
  }

  private lastUpdatedAt(projectId: string | undefined): string | null {
    const rows = projectId
      ? (this.db
          .prepare(
            `SELECT MAX(updated_at) AS updated_at
             FROM (
               SELECT updated_at FROM projects WHERE id = ?
               UNION ALL SELECT updated_at FROM maps WHERE project_id = ?
               UNION ALL SELECT updated_at FROM features WHERE project_id = ?
               UNION ALL SELECT updated_at FROM entry_points WHERE project_id = ?
               UNION ALL SELECT updated_at FROM code_references WHERE project_id = ?
               UNION ALL SELECT updated_at FROM alignments WHERE project_id = ?
               UNION ALL SELECT updated_at FROM scan_runs WHERE project_id = ?
             )`
          )
          .get(projectId, projectId, projectId, projectId, projectId, projectId, projectId) as { updated_at: string | null })
      : (this.db
          .prepare(
            `SELECT MAX(updated_at) AS updated_at
             FROM (
               SELECT updated_at FROM projects
               UNION ALL SELECT updated_at FROM maps
               UNION ALL SELECT updated_at FROM features
               UNION ALL SELECT updated_at FROM entry_points
               UNION ALL SELECT updated_at FROM code_references
               UNION ALL SELECT updated_at FROM alignments
               UNION ALL SELECT updated_at FROM scan_runs
             )`
          )
          .get() as { updated_at: string | null });
    return rows.updated_at;
  }

  private stableKeyConflictCount(projectId: string | undefined): number {
    const filter = projectId ? 'AND project_id = ?' : '';
    const args = projectId ? [projectId, projectId, projectId, projectId, projectId] : [];
    return scalarCount(
      this.db
        .prepare(
          `SELECT COALESCE(SUM(conflicts), 0) AS count
           FROM (
             SELECT COUNT(*) - 1 AS conflicts FROM maps WHERE stable_key <> '' ${filter} GROUP BY project_id, stable_key HAVING COUNT(*) > 1
             UNION ALL
             SELECT COUNT(*) - 1 AS conflicts FROM features WHERE stable_key <> '' ${filter} GROUP BY project_id, map_id, stable_key, version HAVING COUNT(*) > 1
             UNION ALL
             SELECT COUNT(*) - 1 AS conflicts FROM entry_points WHERE stable_key <> '' ${filter} GROUP BY project_id, stable_key HAVING COUNT(*) > 1
             UNION ALL
             SELECT COUNT(*) - 1 AS conflicts FROM code_references WHERE stable_key <> '' ${filter} GROUP BY project_id, stable_key HAVING COUNT(*) > 1
             UNION ALL
             SELECT COUNT(*) - 1 AS conflicts FROM alignments WHERE stable_key <> '' ${filter} GROUP BY project_id, stable_key HAVING COUNT(*) > 1
           )`
        )
        .get(...args)
    );
  }

  private findMapForUpsert(projectId: string, id: string | undefined, stableKey: string): FeatureMapRow | null {
    const byId = id ? this.findMapById(id) : null;
    if (byId && byId.projectId !== projectId) {
      throw new ValidationError('功能地图 ID 不属于当前项目。');
    }
    const byStableKey = this.findMapByStableKey(projectId, stableKey);
    if (byId && byStableKey && byId.id !== byStableKey.id) {
      throw new ValidationError('功能地图 id 和 stableKey 指向不同对象，请先查询上下文确认。');
    }
    return byId ?? byStableKey;
  }

  private findFeatureForUpsert(mapId: string, id: string | undefined, stableKey: string, version: string): FeatureRow | null {
    const byId = id ? this.findFeatureById(id) : null;
    if (byId && byId.mapId !== mapId) {
      throw new ValidationError('功能 ID 不属于当前功能地图。');
    }
    const byStableKey = this.findFeatureByStableKey(mapId, stableKey, version);
    if (byId && byStableKey && byId.id !== byStableKey.id) {
      throw new ValidationError('功能 id 和 stableKey/version 指向不同对象，请先查询上下文确认。');
    }
    return byId ?? byStableKey;
  }

  private findEntryPointForUpsert(projectId: string, id: string | undefined, stableKey: string): EntryPointRow | null {
    const byId = id ? this.findEntryPointById(id) : null;
    if (byId && byId.projectId !== projectId) {
      throw new ValidationError('入口文件 ID 不属于当前项目。');
    }
    const byStableKey = this.findEntryPointByStableKey(projectId, stableKey);
    if (byId && byStableKey && byId.id !== byStableKey.id) {
      throw new ValidationError('入口文件 id 和 stableKey 指向不同对象，请先查询上下文确认。');
    }
    return byId ?? byStableKey;
  }

  private findCodeReferenceForUpsert(
    projectId: string,
    id: string | undefined,
    stableKey: string | undefined,
    signature: {
      mapId: string | null;
      featureId: string | null;
      entryPointId: string | null;
      path: string;
      symbol: string;
      kind: string;
    }
  ): CodeReferenceRow | null {
    const matches = [
      id ? this.findCodeReferenceById(id) : null,
      stableKey ? this.findCodeReferenceByStableKey(projectId, stableKey) : null,
      !id && !stableKey ? this.findCodeReferenceBySignature(projectId, signature) : null
    ].filter((reference): reference is CodeReferenceRow => Boolean(reference));

    for (const reference of matches) {
      if (reference.projectId !== projectId) {
        throw new ValidationError('代码引用 ID 不属于当前项目。');
      }
    }
    const [first] = matches;
    if (first && matches.some((reference) => reference.id !== first.id)) {
      throw new ValidationError('代码引用 id、stableKey 或路径签名指向不同对象，请先查询上下文确认。');
    }
    return first ?? null;
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

  private findMapById(mapId: string): FeatureMapRow | null {
    const row = this.db.prepare('SELECT * FROM maps WHERE id = ?').get(mapId);
    return row ? mapFeatureMap(row) : null;
  }

  private findMapByStableKey(projectId: string, stableKey: string): FeatureMapRow | null {
    const row = this.db.prepare('SELECT * FROM maps WHERE project_id = ? AND stable_key = ?').get(projectId, stableKey);
    return row ? mapFeatureMap(row) : null;
  }

  private findFeatureById(featureId: string): FeatureRow | null {
    const row = this.db.prepare('SELECT * FROM features WHERE id = ?').get(featureId);
    return row ? mapFeature(row) : null;
  }

  private findFeatureByStableKey(mapId: string, stableKey: string, version: string): FeatureRow | null {
    const row = this.db.prepare('SELECT * FROM features WHERE map_id = ? AND stable_key = ? AND version = ?').get(mapId, stableKey, version);
    return row ? mapFeature(row) : null;
  }

  private findFeaturesByStableKey(projectId: string, stableKey: string, version: string | undefined, mapId: string | undefined): FeatureRow[] {
    const where = ['project_id = ?', 'stable_key = ?'];
    const args: SQLInputValue[] = [projectId, stableKey];
    if (version) {
      where.push('version = ?');
      args.push(version);
    }
    if (mapId) {
      where.push('map_id = ?');
      args.push(mapId);
    }
    return this.db
      .prepare(`SELECT * FROM features WHERE ${where.join(' AND ')} ORDER BY updated_at DESC`)
      .all(...args)
      .map(mapFeature);
  }

  private findEntryPointById(entryPointId: string): EntryPointRow | null {
    const row = this.db.prepare('SELECT * FROM entry_points WHERE id = ?').get(entryPointId);
    return row ? mapEntryPoint(row) : null;
  }

  private findEntryPointByStableKey(projectId: string, stableKey: string): EntryPointRow | null {
    const row = this.db.prepare('SELECT * FROM entry_points WHERE project_id = ? AND stable_key = ?').get(projectId, stableKey);
    return row ? mapEntryPoint(row) : null;
  }

  private findCodeReferenceById(codeReferenceId: string): CodeReferenceRow | null {
    const row = this.db.prepare('SELECT * FROM code_references WHERE id = ?').get(codeReferenceId);
    return row ? mapCodeReference(row) : null;
  }

  private findCodeReferenceByStableKey(projectId: string, stableKey: string): CodeReferenceRow | null {
    const row = this.db.prepare('SELECT * FROM code_references WHERE project_id = ? AND stable_key = ?').get(projectId, stableKey);
    return row ? mapCodeReference(row) : null;
  }

  private findCodeReferenceBySignature(
    projectId: string,
    signature: {
      mapId: string | null;
      featureId: string | null;
      entryPointId: string | null;
      path: string;
      symbol: string;
      kind: string;
    }
  ): CodeReferenceRow | null {
    const row = this.db
      .prepare(
        `SELECT * FROM code_references
         WHERE project_id = ?
           AND COALESCE(map_id, '') = COALESCE(?, '')
           AND COALESCE(feature_id, '') = COALESCE(?, '')
           AND COALESCE(entry_point_id, '') = COALESCE(?, '')
           AND path = ?
           AND symbol = ?
           AND kind = ?
         ORDER BY updated_at DESC
         LIMIT 1`
      )
      .get(projectId, signature.mapId, signature.featureId, signature.entryPointId, signature.path, signature.symbol, signature.kind);
    return row ? mapCodeReference(row) : null;
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

  private findAlignmentsForTargets(projectId: string, targets: Set<string>): AlignmentRow[] {
    if (targets.size === 0) {
      return [];
    }
    const rows = this.db.prepare('SELECT * FROM alignments WHERE project_id = ? ORDER BY updated_at DESC').all(projectId);
    const alignments: AlignmentRow[] = [];
    for (const row of rows) {
      const alignment = mapAlignment(row, this.listAlignmentMembers((row as { id: string }).id));
      if (alignment.members.some((member) => targets.has(`${member.targetType}:${member.targetId}`))) {
        alignments.push(alignment);
      }
    }
    return alignments;
  }

  private listAlignmentMembers(alignmentId: string): AlignmentMemberRow[] {
    return this.db
      .prepare('SELECT * FROM alignment_members WHERE alignment_id = ? ORDER BY role, target_type, target_id')
      .all(alignmentId)
      .map((row) => {
        const member = mapAlignmentMember(row);
        return { ...member, label: this.alignableLabel(member.targetType, member.targetId) };
      });
  }

  private getScanRun(scanRunId: string): ScanRunRow {
    const row = this.db.prepare('SELECT * FROM scan_runs WHERE id = ?').get(scanRunId);
    if (!row) {
      throw new NotFoundError(`扫描记录不存在: ${scanRunId}`);
    }
    return mapScanRun(row);
  }

  private latestScanRun(projectId: string | undefined): ScanRunRow | null {
    const row = projectId
      ? this.db.prepare('SELECT * FROM scan_runs WHERE project_id = ? ORDER BY updated_at DESC LIMIT 1').get(projectId)
      : this.db.prepare('SELECT * FROM scan_runs ORDER BY updated_at DESC LIMIT 1').get();
    return row ? mapScanRun(row) : null;
  }

  private assertScanRunInProject(projectId: string, scanRunId: string): ScanRunRow {
    const scanRun = this.getScanRun(scanRunId);
    if (scanRun.projectId !== projectId) {
      throw new ValidationError('扫描记录不属于当前项目。');
    }
    return scanRun;
  }

  private resolveMapIdForFeatureBatch(projectId: string | undefined, mapId: string | undefined, mapStableKey: string | undefined): string {
    if (mapId) {
      const featureMap = this.getMap(mapId);
      if (projectId && featureMap.projectId !== projectId) {
        throw new ValidationError('功能 item 的 mapId 不属于批量 projectId。');
      }
      if (mapStableKey && featureMap.stableKey !== mapStableKey) {
        throw new ValidationError('功能 item 的 mapId 与 mapStableKey 指向不同功能地图。');
      }
      return featureMap.id;
    }
    if (!mapStableKey) {
      throw new ValidationError('功能 item 缺少 mapId 或 mapStableKey。');
    }
    if (!projectId) {
      throw new ValidationError('使用 mapStableKey 写入功能时 projectId 必填。');
    }
    return this.resolveRequiredMapId(projectId, mapStableKey);
  }

  private resolveQueryMapId(query: ParsedQueryContext): string | undefined {
    if (!query.mapStableKey) {
      return query.mapId;
    }
    if (!query.projectId) {
      throw new ValidationError('使用 mapStableKey 查询时 projectId 必填。');
    }
    const resolved = this.resolveRequiredMapId(query.projectId, query.mapStableKey);
    if (query.mapId && query.mapId !== resolved) {
      throw new ValidationError('query 的 mapId 与 mapStableKey 指向不同功能地图。');
    }
    return resolved;
  }

  private resolveOptionalMapId(projectId: string, mapId: string | undefined, mapStableKey: string | undefined): string | null {
    if (mapId) {
      const featureMap = this.assertMapInProject(projectId, mapId);
      if (mapStableKey && featureMap.stableKey !== mapStableKey) {
        throw new ValidationError('mapId 与 mapStableKey 指向不同功能地图。');
      }
      return featureMap.id;
    }
    if (!mapStableKey) {
      return null;
    }
    return this.resolveRequiredMapId(projectId, mapStableKey);
  }

  private resolveRequiredMapId(projectId: string, mapStableKey: string): string {
    const featureMap = this.findMapByStableKey(projectId, mapStableKey);
    if (!featureMap) {
      throw new NotFoundError(`功能地图 stableKey 不存在: ${mapStableKey}`);
    }
    return featureMap.id;
  }

  private resolveAlignmentMember(
    projectId: string,
    member: {
      targetType: string;
      targetId?: string;
      stableKey?: string;
      mapId?: string;
      mapStableKey?: string;
      version?: string;
      role: string;
      note: string;
    }
  ): { targetType: string; targetId: string; role: string; note: string } {
    if (member.targetId) {
      this.assertAlignable(projectId, member.targetType, member.targetId);
      return { targetType: member.targetType, targetId: member.targetId, role: member.role, note: member.note };
    }
    if (!member.stableKey) {
      throw new ValidationError('对齐成员需要 targetId 或 stableKey。');
    }
    const resolved = this.resolveStableKeyItem(projectId, {
      type: member.targetType as ResolveStableKeyType,
      stableKey: member.stableKey,
      mapId: member.mapId,
      mapStableKey: member.mapStableKey,
      version: member.version
    });
    if (!resolved) {
      throw new NotFoundError(`对齐成员 stableKey 不存在: ${member.targetType}:${member.stableKey}`);
    }
    return { targetType: member.targetType, targetId: resolved.id, role: member.role, note: member.note };
  }

  private resolveStableKeyItem(
    projectId: string,
    item: {
      type: ResolveStableKeyType;
      id?: string;
      stableKey?: string;
      mapId?: string;
      mapStableKey?: string;
      version?: string;
      path?: string;
      symbol?: string;
      kind?: string;
    }
  ): { id: string; candidates?: Array<{ id: string; stableKey: string; mapId?: string | null; version?: string; name?: string }> } | null {
    if (item.type === 'project') {
      if (item.id) {
        return this.getProject(item.id).id === projectId ? { id: item.id } : null;
      }
      if (item.stableKey && item.stableKey === projectId) {
        return { id: projectId };
      }
      return null;
    }
    if (item.type === 'map') {
      if (item.id) {
        const featureMap = this.assertMapInProject(projectId, item.id);
        return { id: featureMap.id };
      }
      if (!item.stableKey) return null;
      const featureMap = this.findMapByStableKey(projectId, item.stableKey);
      return featureMap ? { id: featureMap.id } : null;
    }
    if (item.type === 'feature') {
      if (item.id) {
        const feature = this.getFeature(item.id);
        if (feature.projectId !== projectId) throw new ValidationError('功能不属于当前项目。');
        return { id: feature.id };
      }
      if (!item.stableKey) return null;
      const mapId = item.mapId || item.mapStableKey ? this.resolveOptionalMapId(projectId, item.mapId, item.mapStableKey) ?? undefined : undefined;
      const candidates = this.findFeaturesByStableKey(projectId, item.stableKey, item.version, mapId);
      if (candidates.length === 1) return { id: candidates[0].id, candidates: candidates.map(featureCandidate) };
      if (candidates.length > 1) {
        throw new ValidationError(`feature stableKey 命中多个对象，请提供 mapStableKey 或 version: ${item.stableKey}`);
      }
      return null;
    }
    if (item.type === 'entry_point') {
      if (item.id) {
        const entryPoint = this.getEntryPoint(item.id);
        if (entryPoint.projectId !== projectId) throw new ValidationError('入口文件不属于当前项目。');
        return { id: entryPoint.id };
      }
      if (item.stableKey) {
        const entryPoint = this.findEntryPointByStableKey(projectId, item.stableKey);
        return entryPoint ? { id: entryPoint.id } : null;
      }
      if (item.path) {
        const row = this.db.prepare('SELECT * FROM entry_points WHERE project_id = ? AND path = ? ORDER BY updated_at DESC LIMIT 1').get(projectId, item.path);
        return row ? { id: mapEntryPoint(row).id } : null;
      }
      return null;
    }
    if (item.type === 'code_reference') {
      if (item.id) {
        const reference = this.getCodeReference(item.id);
        if (reference.projectId !== projectId) throw new ValidationError('代码引用不属于当前项目。');
        return { id: reference.id };
      }
      if (item.stableKey) {
        const reference = this.findCodeReferenceByStableKey(projectId, item.stableKey);
        return reference ? { id: reference.id } : null;
      }
      if (item.path) {
        const row = this.db
          .prepare(
            `SELECT * FROM code_references
             WHERE project_id = ? AND path = ? AND symbol = ? AND (? = '' OR kind = ?)
             ORDER BY updated_at DESC
             LIMIT 1`
          )
          .get(projectId, item.path, item.symbol ?? '', item.kind ?? '', item.kind ?? '');
        return row ? { id: mapCodeReference(row).id } : null;
      }
      return null;
    }
    if (item.type === 'alignment') {
      if (item.id) {
        const alignment = this.getAlignment(item.id);
        if (alignment.projectId !== projectId) throw new ValidationError('对齐关系不属于当前项目。');
        return { id: alignment.id };
      }
      if (!item.stableKey) return null;
      const alignment = this.findAlignmentByStableKey(projectId, item.stableKey);
      return alignment ? { id: alignment.id } : null;
    }
    return null;
  }

  private assertMapInProject(projectId: string, mapId: string): FeatureMapRow {
    const featureMap = this.getMap(mapId);
    if (featureMap.projectId !== projectId) {
      throw new ValidationError('功能地图不属于当前项目。');
    }
    return featureMap;
  }

  private resolveCodeReferenceOwnership(
    projectId: string,
    input: {
      mapId?: string;
      mapStableKey?: string;
      featureId?: string;
      featureStableKey?: string;
      featureVersion?: string;
      entryPointId?: string;
      entryPointStableKey?: string;
    }
  ): { mapId: string | null; featureId: string | null; entryPointId: string | null } {
    let resolvedMapId = this.resolveOptionalMapId(projectId, input.mapId, input.mapStableKey);
    const feature = input.featureId ? this.getFeature(input.featureId) : input.featureStableKey ? this.resolveFeatureByStableKey(projectId, input.featureStableKey, input.featureVersion, resolvedMapId ?? undefined) : null;
    const entryPoint = input.entryPointId
      ? this.getEntryPoint(input.entryPointId)
      : input.entryPointStableKey
        ? this.findEntryPointByStableKey(projectId, input.entryPointStableKey)
        : null;

    if (input.entryPointStableKey && !entryPoint) {
      throw new NotFoundError(`入口文件 stableKey 不存在: ${input.entryPointStableKey}`);
    }
    if (feature) {
      if (feature.projectId !== projectId) {
        throw new ValidationError('功能不属于当前项目。');
      }
      resolvedMapId ??= feature.mapId;
      if (resolvedMapId !== feature.mapId) {
        throw new ValidationError('代码引用的 mapId 与 featureId 所属功能地图不一致。');
      }
    }
    if (entryPoint) {
      if (entryPoint.projectId !== projectId) {
        throw new ValidationError('入口文件不属于当前项目。');
      }
      if (entryPoint.mapId) {
        resolvedMapId ??= entryPoint.mapId;
        if (resolvedMapId !== entryPoint.mapId) {
          throw new ValidationError('代码引用的 mapId 与 entryPointId 所属功能地图不一致。');
        }
      }
    }

    return { mapId: resolvedMapId, featureId: feature?.id ?? null, entryPointId: entryPoint?.id ?? null };
  }

  private resolveFeatureByStableKey(projectId: string, stableKey: string, version: string | undefined, mapId: string | undefined): FeatureRow {
    const candidates = this.findFeaturesByStableKey(projectId, stableKey, version, mapId);
    if (candidates.length === 1) {
      return candidates[0];
    }
    if (candidates.length > 1) {
      throw new ValidationError(`featureStableKey 命中多个功能，请补充 mapStableKey 或 featureVersion: ${stableKey}`);
    }
    throw new NotFoundError(`功能 stableKey 不存在: ${stableKey}`);
  }

  private assertAlignable(projectId: string, targetType: string, targetId: string): void {
    if (targetType === 'project') {
      const project = this.getProject(targetId);
      if (project.id !== projectId) {
        throw new ValidationError('对齐关系只能引用同一项目内的对象。');
      }
      return;
    }
    if (targetType === 'map') {
      this.assertMapInProject(projectId, targetId);
      return;
    }
    if (targetType === 'feature') {
      const feature = this.getFeature(targetId);
      if (feature.projectId !== projectId) {
        throw new ValidationError('功能不属于当前项目。');
      }
      return;
    }
    if (targetType === 'entry_point') {
      const entryPoint = this.getEntryPoint(targetId);
      if (entryPoint.projectId !== projectId) {
        throw new ValidationError('入口文件不属于当前项目。');
      }
      return;
    }
    if (targetType === 'code_reference') {
      const reference = this.getCodeReference(targetId);
      if (reference.projectId !== projectId) {
        throw new ValidationError('代码引用不属于当前项目。');
      }
      return;
    }
    throw new ValidationError(`不支持的对齐对象类型: ${targetType}`);
  }

  private alignableLabel(targetType: string, targetId: string): string {
    try {
      if (targetType === 'project') return this.getProject(targetId).name;
      if (targetType === 'map') return this.getMap(targetId).name;
      if (targetType === 'feature') return this.getFeature(targetId).name;
      if (targetType === 'entry_point') return this.getEntryPoint(targetId).name;
      if (targetType === 'code_reference') {
        const reference = this.getCodeReference(targetId);
        return reference.symbol ? `${reference.path}#${reference.symbol}` : reference.path;
      }
      return targetId;
    } catch {
      return targetId;
    }
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
  readonly hint = '先通过 functree_query_context 确认项目、功能地图、功能、入口文件、代码引用或对齐关系 ID 是否存在。';
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

function mapFeatureMap(row: unknown): FeatureMapRow {
  const value = row as Record<string, unknown>;
  return {
    id: String(value.id),
    projectId: String(value.project_id),
    stableKey: String(value.stable_key),
    name: String(value.name),
    version: String(value.version),
    axis: String(value.axis),
    scope: String(value.scope),
    kind: String(value.kind),
    status: String(value.status),
    description: String(value.description ?? ''),
    owner: String(value.owner ?? ''),
    tags: parseStringArray(value.tags_json),
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
    mapId: String(value.map_id),
    parentFeatureId: value.parent_feature_id ? String(value.parent_feature_id) : null,
    stableKey: String(value.stable_key),
    name: String(value.name),
    version: String(value.version),
    status: String(value.status),
    kind: String(value.kind),
    description: String(value.description ?? ''),
    sortOrder: Number(value.sort_order ?? 0),
    tags: parseStringArray(value.tags_json),
    metadata: parseJson(value.metadata_json),
    createdAt: String(value.created_at),
    updatedAt: String(value.updated_at)
  };
}

function mapEntryPoint(row: unknown): EntryPointRow {
  const value = row as Record<string, unknown>;
  return {
    id: String(value.id),
    projectId: String(value.project_id),
    mapId: value.map_id ? String(value.map_id) : null,
    stableKey: String(value.stable_key),
    name: String(value.name),
    path: String(value.path),
    kind: String(value.kind),
    description: String(value.description ?? ''),
    confidence: Number(value.confidence ?? 1),
    firstSeenScanRunId: value.first_seen_scan_run_id ? String(value.first_seen_scan_run_id) : null,
    lastSeenScanRunId: value.last_seen_scan_run_id ? String(value.last_seen_scan_run_id) : null,
    lastSeenCommitSha: String(value.last_seen_commit_sha ?? ''),
    lastScannedAt: value.last_scanned_at ? String(value.last_scanned_at) : null,
    metadata: parseJson(value.metadata_json),
    createdAt: String(value.created_at),
    updatedAt: String(value.updated_at)
  };
}

function mapCodeReference(row: unknown): CodeReferenceRow {
  const value = row as Record<string, unknown>;
  return {
    id: String(value.id),
    projectId: String(value.project_id),
    mapId: value.map_id ? String(value.map_id) : null,
    featureId: value.feature_id ? String(value.feature_id) : null,
    entryPointId: value.entry_point_id ? String(value.entry_point_id) : null,
    stableKey: String(value.stable_key ?? ''),
    path: String(value.path),
    symbol: String(value.symbol ?? ''),
    kind: String(value.kind),
    description: String(value.description ?? ''),
    lineStart: nullableNumber(value.line_start),
    lineEnd: nullableNumber(value.line_end),
    firstSeenScanRunId: value.first_seen_scan_run_id ? String(value.first_seen_scan_run_id) : null,
    lastSeenScanRunId: value.last_seen_scan_run_id ? String(value.last_seen_scan_run_id) : null,
    lastSeenCommitSha: String(value.last_seen_commit_sha ?? ''),
    lastScannedAt: value.last_scanned_at ? String(value.last_scanned_at) : null,
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

function mapScanRun(row: unknown): ScanRunRow {
  const value = row as Record<string, unknown>;
  return {
    id: String(value.id),
    projectId: String(value.project_id),
    repoKey: String(value.repo_key),
    repoUrl: String(value.repo_url ?? ''),
    branch: String(value.branch ?? ''),
    commitSha: String(value.commit_sha),
    baseCommitSha: String(value.base_commit_sha ?? ''),
    worktreeDirty: Boolean(value.worktree_dirty),
    status: String(value.status),
    summary: parseJson(value.summary_json),
    metadata: parseJson(value.metadata_json),
    startedAt: String(value.started_at),
    finishedAt: value.finished_at ? String(value.finished_at) : null,
    createdAt: String(value.created_at),
    updatedAt: String(value.updated_at)
  };
}

function parseJson(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string' || !value) {
    return {};
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function parseStringArray(value: unknown): string[] {
  if (typeof value !== 'string' || !value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function json(value: unknown): string {
  return JSON.stringify(value ?? {});
}

function jsonArray(value: string[]): string {
  return JSON.stringify(value);
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
  const value = keyword.trim().toLowerCase();
  if (!value) return;
  const tokenTerms = unique(value.split(/[.\-_/\s]+/u).filter(Boolean));
  const fullClause = `(${columns.map((column) => `LOWER(${alias}.${column}) LIKE ? ESCAPE '\\'`).join(' OR ')})`;
  const tokenClauses = tokenTerms.map((term) => `(${columns.map((column) => `LOWER(${alias}.${column}) LIKE ? ESCAPE '\\'`).join(' OR ')})`);
  where.push(tokenClauses.length > 1 ? `(${fullClause} OR (${tokenClauses.join(' AND ')}))` : fullClause);
  args.push(...columns.map(() => likePattern(value)));
  if (tokenClauses.length > 1) {
    for (const term of tokenTerms) {
      args.push(...columns.map(() => likePattern(term)));
    }
  }
}

function likePattern(value: string): string {
  return `%${value.toLowerCase().replace(/[\\%_]/gu, '\\$&')}%`;
}

function pathPattern(value: string, mode: string): string {
  const escaped = value.toLowerCase().replace(/[\\%_]/gu, '\\$&');
  if (mode === 'exact') return escaped;
  if (mode === 'prefix') return `${escaped}%`;
  return `%${escaped}%`;
}

function pathPredicate(value: string, mode: string): { clause: (column: string) => string; args: SQLInputValue[] } {
  return {
    clause: (column: string) => `LOWER(${column}) LIKE ? ESCAPE '\\'`,
    args: [pathPattern(value, mode)]
  };
}

function previewId(prefix: string): string {
  return `preview_${newId(prefix)}`;
}

function presentRows<T extends Record<string, unknown>>(type: QueryContextType, rows: T[], view: string, includeMetadata: boolean): Array<T | QueryLiteRow> {
  if (view === 'lite') {
    return rows.map((row) => toLiteRow(type, row));
  }
  if (!includeMetadata) {
    return rows.map(stripMetadata) as T[];
  }
  return rows;
}

function toLiteRow(type: QueryContextType, row: Record<string, unknown>): QueryLiteRow {
  return {
    id: String(row.id),
    stableKey: typeof row.stableKey === 'string' && row.stableKey ? row.stableKey : undefined,
    name: typeof row.name === 'string' ? row.name : undefined,
    type,
    mapId: typeof row.mapId === 'string' ? row.mapId : row.mapId === null ? null : undefined,
    projectId: typeof row.projectId === 'string' ? row.projectId : undefined,
    path: typeof row.path === 'string' ? row.path : undefined,
    symbol: typeof row.symbol === 'string' ? row.symbol : undefined,
    kind: typeof row.kind === 'string' ? row.kind : undefined,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : undefined
  };
}

function stripMetadata<T extends Record<string, unknown>>(row: T): T {
  const copy: Record<string, unknown> = { ...row };
  delete copy.metadata;
  if (Array.isArray(copy.members)) {
    copy.members = copy.members.map((member) => stripMetadata(member as Record<string, unknown>));
  }
  return copy as T;
}

function featureCandidate(feature: FeatureRow): { id: string; stableKey: string; mapId: string; version: string; name: string } {
  return {
    id: feature.id,
    stableKey: feature.stableKey,
    mapId: feature.mapId,
    version: feature.version,
    name: feature.name
  };
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isNonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
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

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
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
