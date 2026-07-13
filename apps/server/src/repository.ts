import {
  type BatchAlignmentInput,
  type BatchCodeReferenceInput,
  type BatchEntryPointInput,
  type BatchFeatureInput,
  type BatchMapInput,
  type BatchEvidenceInput,
  type BatchCapabilityGapInput,
  type BatchCapabilityStatusInput,
  type BeginScanInput,
  type CreateAlignmentInput,
  type CapabilityMatrixInput,
  type CreateCapabilityGapInput,
  type CreateCapabilityStatusInput,
  type CreateCodeReferenceInput,
  type CreateEntryPointInput,
  type CreateEvidenceInput,
  type CreateFeatureFocusInput,
  type CreateFeatureInput,
  type CreateMapInput,
  type CreateProjectInput,
  type FinishScanInput,
  type FeatureReadinessInput,
  type FeatureDossierInput,
  type MapAxis,
  type PrepareFeatureWorkInput,
  type ProgrammingContextInput,
  type ProjectSummaryInput,
  type QualityReportInput,
  type QueryContextInput,
  type QueryFeatureFocusesInput,
  type QueryContextType,
  type SearchFeaturesInput,
  type StartFeatureFocusInput,
  type QueryPathContextInput,
  type ResolveStableKeysInput,
  type ResolveStableKeyType,
  type UpsertFeatureDossierInput,
  BeginScanSchema,
  BatchAlignmentSchema,
  BatchCodeReferenceSchema,
  BatchEntryPointSchema,
  BatchFeatureSchema,
  BatchMapSchema,
  BatchEvidenceSchema,
  BatchCapabilityGapSchema,
  BatchCapabilityStatusSchema,
  CapabilityMatrixSchema,
  CreateCapabilityGapSchema,
  CreateCapabilityStatusSchema,
  CreateAlignmentSchema,
  CreateCodeReferenceSchema,
  CreateEntryPointSchema,
  CreateEvidenceSchema,
  CreateFeatureFocusSchema,
  CreateFeatureSchema,
  CreateMapSchema,
  CreateProjectSchema,
  FeatureDetailSchema,
  FinishScanSchema,
  FeatureDossierSchema,
  FeatureReadinessSchema,
  PrepareFeatureWorkSchema,
  ProgrammingContextSchema,
  ProjectSummarySchema,
  QualityReportSchema,
  QueryPathContextSchema,
  QueryFeatureFocusesSchema,
  QueryContextSchema,
  ResolveStableKeysSchema,
  SearchFeaturesSchema,
  StartFeatureFocusSchema,
  UpsertFeatureDossierSchema,
  newId
} from '@functree/domain';
import fs from 'node:fs';
import path from 'node:path';
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
  details?: FeatureDetailRow;
  children?: FeatureRow[];
};

export type FeatureDetailRow = {
  featureId: string;
  intent: string;
  currentBehavior: string;
  expectedBehavior: string;
  scope: string;
  knownGaps: string[];
  openQuestions: string[];
  acceptanceCriteria: string[];
  risks: string[];
  blocker: string;
  replacement: string;
  deprecatedReason: string;
  mockBoundary: string;
  detailsMarkdown: string;
  lastVerifiedAt: string;
  lastVerifiedCommit: string;
  updatedAt: string;
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
  roleInFeature: string;
  changeGuidance: string;
  verificationHint: string;
  blastRadius: string;
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

export type EvidenceRow = {
  id: string;
  projectId: string;
  targetType: string;
  targetId: string;
  evidenceType: string;
  signature: string;
  path: string;
  symbol: string;
  lineStart: number | null;
  lineEnd: number | null;
  summary: string;
  confidence: number;
  sourceType: string;
  sourcePriority: number;
  commitSha: string;
  verifiedAt: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  label?: string;
};

export type CapabilityStatusRow = {
  id: string;
  projectId: string;
  canonicalFeatureId: string;
  mapId: string;
  featureId: string | null;
  signature: string;
  status: string;
  summary: string;
  gaps: string[];
  recommendedAction: string;
  evidenceIds: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  canonicalFeature?: FeatureRow;
  map?: FeatureMapRow;
  feature?: FeatureRow | null;
};

export type CapabilityGapRow = {
  id: string;
  projectId: string;
  stableKey: string;
  signature: string;
  canonicalFeatureId: string;
  mapId: string | null;
  featureId: string | null;
  gapType: string;
  severity: 'high' | 'medium' | 'low';
  status: string;
  title: string;
  description: string;
  evidenceIds: string[];
  recommendedAction: string;
  ownerMapId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  canonicalFeature?: FeatureRow;
  map?: FeatureMapRow | null;
  feature?: FeatureRow | null;
  ownerMap?: FeatureMapRow | null;
};

export type FeatureFocusRow = {
  id: string;
  projectId: string;
  stableKey: string;
  featureId: string;
  title: string;
  mode: string;
  status: string;
  priority: string;
  sourceType: string;
  question: string;
  scope: string;
  sourceRefs: string[];
  seedPaths: string[];
  targetMapIds: string[];
  relatedFeatureIds: string[];
  nextSteps: string[];
  findings: string;
  confidence: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  feature?: FeatureRow;
  map?: FeatureMapRow;
  targetMaps?: FeatureMapRow[];
  relatedFeatures?: FeatureRow[];
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
  summary: {
    created: number;
    updated: number;
    unchanged: number;
    dryRun: number;
    errors: number;
  };
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
  featureFocuses: Array<FeatureFocusRow | QueryLiteRow>;
  alignments: Array<AlignmentRow | QueryLiteRow>;
  entryPoints: Array<EntryPointRow | QueryLiteRow>;
  codeReferences: Array<CodeReferenceRow | QueryLiteRow>;
  evidence: Array<EvidenceRow | QueryLiteRow>;
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
    evidenceCount: number;
    entryPointCount: number;
    codeReferenceCount: number;
    featureFocusCount: number;
    openFeatureFocusCount: number;
    scanRunCount: number;
    lastUpdatedAt: string | null;
    stableKeyConflictCount: number;
    orphanCodeReferenceCount: number;
    latestFeatureFocus: FeatureFocusRow | null;
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

export type FeatureSearchResult = {
  project: ProjectRow;
  query: string;
  path: string;
  candidates: FeatureSearchCandidate[];
  suggestedStart: {
    canonicalMapStableKey: string;
    canonicalFeatureStableKey: string;
    featureName: string;
    reason: string;
  } | null;
  page: {
    limit: number;
    candidateCount: number;
  };
  summary: {
    openFocusCount: number;
    exactStableKeyMatches: number;
    codeReferenceMatches: number;
  };
};

export type FeatureSearchCandidate = {
  feature: FeatureRow;
  map: FeatureMapRow;
  score: number;
  reasons: string[];
  openFocuses: FeatureFocusRow[];
  codeReferenceCount: number;
  matchingCodeReferences: CodeReferenceRow[];
  gapCount: number;
  openGaps: CapabilityGapRow[];
  alignmentCount: number;
  nextAction: string;
};

export type PreparedFeatureWorkResult = {
  project: ProjectRow;
  readiness: 'ready' | 'ambiguous' | 'needs_start';
  search: FeatureSearchResult | null;
  selectedCandidate: FeatureSearchCandidate | null;
  selectedFocus: FeatureFocusRow | null;
  dossier: FeatureDossierResult | null;
  programmingContext: ProgrammingContextResult | null;
  suggestedStart: FeatureSearchResult['suggestedStart'];
  nextSteps: string[];
  recommendedToolCalls: PreparedToolCall[];
};

export type PreparedToolCall = {
  toolName: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  arguments: Record<string, unknown>;
};

export type FeatureReadinessCheck = {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  severity: 'high' | 'medium' | 'low';
  message: string;
  hint: string;
  targetType?: string;
  targetId?: string;
};

export type FeatureReadinessResult = {
  project: ProjectRow;
  map: FeatureMapRow;
  feature: FeatureRow;
  selectedFocus: FeatureFocusRow | null;
  readiness: 'ready' | 'needs_analysis' | 'needs_evidence' | 'needs_alignment' | 'blocked';
  score: number;
  requiredAxes: MapAxis[];
  axisCoverage: Array<{
    axis: MapAxis;
    status: 'covered' | 'missing' | 'partial';
    maps: FeatureMapRow[];
    implementationStatuses: CapabilityStatusRow[];
  }>;
  checks: FeatureReadinessCheck[];
  missingAxes: MapAxis[];
  nextSteps: string[];
  recommendedToolCalls: PreparedToolCall[];
  dossier: FeatureDossierResult;
  qualityReport: QualityReportResult;
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

export type ProgrammingContextResult = {
  project: ProjectRow;
  map: FeatureMapRow;
  feature: FeatureRow;
  details: FeatureDetailRow | null;
  selectedFocus: FeatureFocusRow | null;
  focuses: FeatureFocusRow[];
  seedPathContexts: QueryPathContextResult[];
  nextActions: ProgrammingNextAction[];
  requiredEntryPoints: EntryPointRow[];
  keyCodeReferences: CodeReferenceRow[];
  relatedProductCapabilities: FeatureRow[];
  alignments: AlignmentRow[];
  impactedFeatures: FeatureRow[];
  evidence: EvidenceRow[];
  capabilityMatrix: CapabilityMatrixResult | null;
  capabilityGaps: CapabilityGapRow[];
  risks: string[];
  acceptanceCriteria: string[];
  verification: string[];
  qualityIssues: QualityIssue[];
};

export type ProgrammingNextAction = {
  priority: 'high' | 'medium' | 'low';
  source: 'focus' | 'seed_path' | 'gap' | 'quality' | 'verification';
  title: string;
  detail: string;
  targetType: string;
  targetId: string;
};

export type FeatureDossierResult = {
  project: ProjectRow;
  focus: {
    feature: FeatureRow;
    map: FeatureMapRow;
  };
  canonicalFeature: FeatureRow;
  canonicalMap: FeatureMapRow;
  statusMatrix: CapabilityMatrixResult | null;
  implementationSlices: CapabilityStatusRow[];
  gaps: CapabilityGapRow[];
  evidence: EvidenceRow[];
  codeReferences: CodeReferenceRow[];
  entryPoints: EntryPointRow[];
  alignments: AlignmentRow[];
  relatedFeatures: FeatureRow[];
  selectedFocus: FeatureFocusRow | null;
  focuses: FeatureFocusRow[];
  qualityIssues: QualityIssue[];
  summary: {
    isCanonical: boolean;
    statusCounts: Record<string, number>;
    evidenceSourceCounts: Record<string, number>;
    openGapCount: number;
    highSeverityGapCount: number;
    codeReferenceCount: number;
    entryPointCount: number;
    alignmentCount: number;
    relatedFeatureCount: number;
    openFocusCount: number;
  };
};

export type FeatureDossierUpsertResult = {
  success: boolean;
  dryRun: boolean;
  rolledBack: boolean;
  operations: {
    maps: UpsertResult<FeatureMapRow>[];
    features: UpsertResult<FeatureRow>[];
    entryPoints: UpsertResult<EntryPointRow>[];
    codeReferences: UpsertResult<CodeReferenceRow>[];
    evidence: UpsertResult<EvidenceRow>[];
    statuses: UpsertResult<CapabilityStatusRow>[];
    gaps: UpsertResult<CapabilityGapRow>[];
    alignments: UpsertResult<AlignmentRow>[];
  };
  dossier: FeatureDossierResult;
};

export type FeatureFocusStartResult = {
  success: boolean;
  dryRun: boolean;
  rolledBack: boolean;
  map: UpsertResult<FeatureMapRow>;
  feature: UpsertResult<FeatureRow>;
  focus: UpsertResult<FeatureFocusRow>;
  dossier: FeatureDossierResult;
};

export type CapabilityMatrixResult = {
  project: ProjectRow;
  canonicalFeature: FeatureRow | null;
  statuses: CapabilityStatusRow[];
  gaps: CapabilityGapRow[];
  evidence: EvidenceRow[];
  summary: {
    statusCounts: Record<string, number>;
    openGapCount: number;
    highSeverityGapCount: number;
  };
};

export type QualityIssue = {
  severity: 'error' | 'warning' | 'info';
  code: string;
  targetType: string;
  targetId: string;
  message: string;
  hint: string;
};

export type QualityReportResult = {
  projectId: string;
  summary: {
    errors: number;
    warnings: number;
    info: number;
    featuresWithoutCodeReferences: number;
    featuresWithoutAlignments: number;
    featuresWithoutCodeEvidence: number;
    draftDetailGaps: number;
    inProgressDetailGaps: number;
    blockedDetailGaps: number;
    deprecatedDetailGaps: number;
    mockBoundaryGaps: number;
    openCapabilityGaps: number;
    highSeverityCapabilityGaps: number;
    missingPaths: number;
  };
  issues: QualityIssue[];
};

type ParsedQueryContext = ReturnType<typeof QueryContextSchema.parse>;
type ParsedSearchFeatures = ReturnType<typeof SearchFeaturesSchema.parse>;
type ParsedQualityReport = ReturnType<typeof QualityReportSchema.parse>;
type ParsedFeatureReadiness = ReturnType<typeof FeatureReadinessSchema.parse>;

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
    const existingDetails = existing ? this.findFeatureDetailById(existing.id) : null;
    const plannedDetails = data.details ? normalizeFeatureDetailInput(id, data.details, existingDetails, now) : undefined;
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
    const changedFields = [
      ...(existing
      ? changedFieldsFor(existing, planned, ['parentFeatureId', 'stableKey', 'name', 'version', 'status', 'kind', 'description', 'sortOrder', 'tags', 'metadata'])
      : []),
      ...(plannedDetails &&
      (!existingDetails ||
        changedFieldsFor(existingDetails, plannedDetails, [
          'intent',
          'currentBehavior',
          'expectedBehavior',
          'scope',
          'knownGaps',
          'openQuestions',
          'acceptanceCriteria',
          'risks',
          'blocker',
          'replacement',
          'deprecatedReason',
          'mockBoundary',
          'detailsMarkdown',
          'lastVerifiedAt',
          'lastVerifiedCommit'
        ]).length > 0)
        ? ['details']
        : [])
    ];
    if (data.dryRun) {
      return { operation: 'dry_run', changedFields: existing ? changedFields : ['*'], data: plannedDetails ? { ...planned, details: plannedDetails } : planned, dryRun: true, previewId: existing ? undefined : id };
    }
    if (existing && changedFields.length === 0) {
      return { operation: 'unchanged', changedFields, data: existing, dryRun: false };
    }
    this.withSavepoint('feature', () => {
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
      if (plannedDetails) {
        this.writeFeatureDetails(plannedDetails);
      }
    });
    this.touchProject(featureMap.projectId);
    this.recordEvent(featureMap.projectId, 'http', 'upsert_feature', { id, mapId, stableKey: data.stableKey, name: data.name });
    return {
      operation: existing ? 'updated' : 'created',
      changedFields,
      data: this.getFeature(id, Boolean(plannedDetails)),
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

  getFeature(featureId: string, includeDetails = false): FeatureRow {
    const row = this.db.prepare('SELECT * FROM features WHERE id = ?').get(featureId);
    if (!row) {
      throw new NotFoundError(`功能不存在: ${featureId}`);
    }
    return this.attachFeatureDetails(mapFeature(row), includeDetails);
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
      roleInFeature: data.roleInFeature ?? existing?.roleInFeature ?? '',
      changeGuidance: data.changeGuidance ?? existing?.changeGuidance ?? '',
      verificationHint: data.verificationHint ?? existing?.verificationHint ?? '',
      blastRadius: data.blastRadius ?? existing?.blastRadius ?? '',
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
          'roleInFeature',
          'changeGuidance',
          'verificationHint',
          'blastRadius',
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
          (id, project_id, map_id, feature_id, entry_point_id, stable_key, path, symbol, kind, description, role_in_feature, change_guidance, verification_hint, blast_radius, line_start, line_end, first_seen_scan_run_id, last_seen_scan_run_id, last_seen_commit_sha, last_scanned_at, metadata_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           map_id = excluded.map_id,
           feature_id = excluded.feature_id,
           entry_point_id = excluded.entry_point_id,
           stable_key = excluded.stable_key,
           path = excluded.path,
           symbol = excluded.symbol,
           kind = excluded.kind,
           description = excluded.description,
           role_in_feature = excluded.role_in_feature,
           change_guidance = excluded.change_guidance,
           verification_hint = excluded.verification_hint,
           blast_radius = excluded.blast_radius,
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
        planned.roleInFeature,
        planned.changeGuidance,
        planned.verificationHint,
        planned.blastRadius,
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
    const features = this.listFeatures(projectId).map((feature) => this.attachFeatureDetails(feature, true));
    return {
      project,
      maps: maps.map((featureMap) => ({
        ...featureMap,
        features: buildFeatureTree(features.filter((feature) => feature.mapId === featureMap.id))
      })),
      entryPoints: this.listEntryPoints(projectId),
      codeReferences: this.listCodeReferences(projectId),
      evidence: this.listEvidence(projectId),
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

  upsertEvidence(projectId: string, input: CreateEvidenceInput): UpsertResult<EvidenceRow> {
    const data = CreateEvidenceSchema.parse(input);
    if (data.projectId && data.projectId !== projectId) {
      throw new ValidationError('projectId 与路径项目不一致。');
    }
    this.getProject(projectId);
    const targetId = this.resolveEvidenceTarget(projectId, data);
    const now = nowIso();
    const signature = evidenceSignature({
      targetType: data.targetType,
      targetId,
      evidenceType: data.evidenceType,
      path: data.path ?? '',
      symbol: data.symbol,
      lineStart: data.lineStart,
      lineEnd: data.lineEnd,
      commitSha: data.commitSha ?? ''
    });
    const existing = this.findEvidenceForUpsert(projectId, data.id, signature);
    const id = existing?.id ?? data.id ?? (data.dryRun ? previewId('ev') : newId('ev'));
    const planned = {
      id,
      projectId,
      targetType: data.targetType,
      targetId,
      evidenceType: data.evidenceType,
      signature,
      path: data.path ?? '',
      symbol: data.symbol,
      lineStart: data.lineStart,
      lineEnd: data.lineEnd,
      summary: data.summary,
      confidence: data.confidence,
      sourceType: data.sourceType,
      sourcePriority: data.sourcePriority,
      commitSha: data.commitSha ?? '',
      verifiedAt: data.verifiedAt,
      metadata: data.metadata,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      label: this.alignableLabel(data.targetType, targetId)
    } satisfies EvidenceRow;
    const changedFields = existing
      ? changedFieldsFor(existing, planned, ['targetType', 'targetId', 'evidenceType', 'path', 'symbol', 'lineStart', 'lineEnd', 'summary', 'confidence', 'sourceType', 'sourcePriority', 'commitSha', 'verifiedAt', 'metadata'])
      : [];
    if (data.dryRun) {
      return { operation: 'dry_run', changedFields: existing ? changedFields : ['*'], data: planned, dryRun: true, previewId: existing ? undefined : id };
    }
    if (existing && changedFields.length === 0) {
      return { operation: 'unchanged', changedFields, data: existing, dryRun: false };
    }
    this.db
      .prepare(
        `INSERT INTO evidence
          (id, project_id, target_type, target_id, evidence_type, signature, path, symbol, line_start, line_end, summary, confidence, source_type, source_priority, commit_sha, verified_at, metadata_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           target_type = excluded.target_type,
           target_id = excluded.target_id,
           evidence_type = excluded.evidence_type,
           signature = excluded.signature,
           path = excluded.path,
           symbol = excluded.symbol,
           line_start = excluded.line_start,
           line_end = excluded.line_end,
           summary = excluded.summary,
           confidence = excluded.confidence,
           source_type = excluded.source_type,
           source_priority = excluded.source_priority,
           commit_sha = excluded.commit_sha,
           verified_at = excluded.verified_at,
           metadata_json = excluded.metadata_json,
           updated_at = excluded.updated_at`
      )
      .run(
        id,
        projectId,
        planned.targetType,
        planned.targetId,
        planned.evidenceType,
        planned.signature,
        planned.path,
        planned.symbol,
        planned.lineStart,
        planned.lineEnd,
        planned.summary,
        planned.confidence,
        planned.sourceType,
        planned.sourcePriority,
        planned.commitSha,
        planned.verifiedAt,
        json(planned.metadata),
        now,
        now
      );
    this.touchProject(projectId);
    this.recordEvent(projectId, 'http', 'upsert_evidence', { id, targetType: data.targetType, targetId, evidenceType: data.evidenceType });
    return {
      operation: existing ? 'updated' : 'created',
      changedFields,
      data: this.getEvidence(id),
      dryRun: false
    };
  }

  upsertEvidenceBatch(input: BatchEvidenceInput): BatchUpsertResult<EvidenceRow> {
    const data = BatchEvidenceSchema.parse(input);
    this.getProject(data.projectId);
    return this.runBatch(data.dryRun, data.items, (item) => this.upsertEvidence(data.projectId, { ...item, dryRun: data.dryRun }));
  }

  upsertCapabilityStatus(projectId: string, input: CreateCapabilityStatusInput): UpsertResult<CapabilityStatusRow> {
    const data = CreateCapabilityStatusSchema.parse(input);
    if (data.projectId && data.projectId !== projectId) {
      throw new ValidationError('projectId 与路径项目不一致。');
    }
    this.getProject(projectId);
    const refs = this.resolveCapabilityReferences(projectId, data, { requireMap: true });
    this.assertEvidenceIds(projectId, data.evidenceIds);
    const now = nowIso();
    const signature = capabilityStatusSignature(refs.canonicalFeature.id, refs.map?.id ?? '', refs.feature?.id ?? null);
    const existing = this.findCapabilityStatusForUpsert(projectId, data.id, signature);
    const id = existing?.id ?? data.id ?? (data.dryRun ? previewId('cst') : newId('cst'));
    const planned = {
      id,
      projectId,
      canonicalFeatureId: refs.canonicalFeature.id,
      mapId: refs.map?.id ?? '',
      featureId: refs.feature?.id ?? null,
      signature,
      status: data.status,
      summary: data.summary,
      gaps: data.gaps,
      recommendedAction: data.recommendedAction,
      evidenceIds: data.evidenceIds,
      metadata: data.metadata,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    } satisfies CapabilityStatusRow;
    const changedFields = existing
      ? changedFieldsFor(existing, planned, ['canonicalFeatureId', 'mapId', 'featureId', 'status', 'summary', 'gaps', 'recommendedAction', 'evidenceIds', 'metadata'])
      : [];
    if (data.dryRun) {
      return { operation: 'dry_run', changedFields: existing ? changedFields : ['*'], data: this.enrichCapabilityStatus(planned), dryRun: true, previewId: existing ? undefined : id };
    }
    if (existing && changedFields.length === 0) {
      return { operation: 'unchanged', changedFields, data: existing, dryRun: false };
    }
    this.db
      .prepare(
        `INSERT INTO capability_statuses
          (id, project_id, canonical_feature_id, map_id, feature_id, signature, status, summary, gaps_json, recommended_action, evidence_ids_json, metadata_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           canonical_feature_id = excluded.canonical_feature_id,
           map_id = excluded.map_id,
           feature_id = excluded.feature_id,
           signature = excluded.signature,
           status = excluded.status,
           summary = excluded.summary,
           gaps_json = excluded.gaps_json,
           recommended_action = excluded.recommended_action,
           evidence_ids_json = excluded.evidence_ids_json,
           metadata_json = excluded.metadata_json,
           updated_at = excluded.updated_at`
      )
      .run(
        id,
        projectId,
        planned.canonicalFeatureId,
        planned.mapId,
        planned.featureId,
        planned.signature,
        planned.status,
        planned.summary,
        jsonArray(planned.gaps),
        planned.recommendedAction,
        jsonArray(planned.evidenceIds),
        json(planned.metadata),
        now,
        now
      );
    this.touchProject(projectId);
    this.recordEvent(projectId, 'http', 'upsert_capability_status', { id, canonicalFeatureId: planned.canonicalFeatureId, mapId: planned.mapId, status: planned.status });
    return {
      operation: existing ? 'updated' : 'created',
      changedFields,
      data: this.getCapabilityStatus(id),
      dryRun: false
    };
  }

  upsertCapabilityStatusesBatch(input: BatchCapabilityStatusInput): BatchUpsertResult<CapabilityStatusRow> {
    const data = BatchCapabilityStatusSchema.parse(input);
    this.getProject(data.projectId);
    return this.runBatch(data.dryRun, data.items, (item) => this.upsertCapabilityStatus(data.projectId, { ...item, dryRun: data.dryRun }));
  }

  upsertCapabilityGap(projectId: string, input: CreateCapabilityGapInput): UpsertResult<CapabilityGapRow> {
    const data = CreateCapabilityGapSchema.parse(input);
    if (data.projectId && data.projectId !== projectId) {
      throw new ValidationError('projectId 与路径项目不一致。');
    }
    this.getProject(projectId);
    const refs = this.resolveCapabilityReferences(projectId, data, { requireMap: false });
    const ownerMapId = this.resolveOptionalMapId(projectId, data.ownerMapId, data.ownerMapStableKey);
    this.assertEvidenceIds(projectId, data.evidenceIds);
    const now = nowIso();
    const signature = data.stableKey ? `stable:${data.stableKey}` : capabilityGapSignature(refs.canonicalFeature.id, refs.map?.id ?? null, refs.feature?.id ?? null, data.gapType, data.title);
    const existing = this.findCapabilityGapForUpsert(projectId, data.id, data.stableKey, signature);
    const id = existing?.id ?? data.id ?? (data.dryRun ? previewId('gap') : newId('gap'));
    const planned = {
      id,
      projectId,
      stableKey: data.stableKey ?? existing?.stableKey ?? '',
      signature,
      canonicalFeatureId: refs.canonicalFeature.id,
      mapId: refs.map?.id ?? null,
      featureId: refs.feature?.id ?? null,
      gapType: data.gapType,
      severity: data.severity,
      status: data.status,
      title: data.title,
      description: data.description,
      evidenceIds: data.evidenceIds,
      recommendedAction: data.recommendedAction,
      ownerMapId,
      metadata: data.metadata,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    } satisfies CapabilityGapRow;
    const changedFields = existing
      ? changedFieldsFor(existing, planned, ['stableKey', 'canonicalFeatureId', 'mapId', 'featureId', 'gapType', 'severity', 'status', 'title', 'description', 'evidenceIds', 'recommendedAction', 'ownerMapId', 'metadata'])
      : [];
    if (data.dryRun) {
      return { operation: 'dry_run', changedFields: existing ? changedFields : ['*'], data: this.enrichCapabilityGap(planned), dryRun: true, previewId: existing ? undefined : id };
    }
    if (existing && changedFields.length === 0) {
      return { operation: 'unchanged', changedFields, data: existing, dryRun: false };
    }
    this.db
      .prepare(
        `INSERT INTO capability_gaps
          (id, project_id, stable_key, signature, canonical_feature_id, map_id, feature_id, gap_type, severity, status, title, description, evidence_ids_json, recommended_action, owner_map_id, metadata_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           stable_key = excluded.stable_key,
           signature = excluded.signature,
           canonical_feature_id = excluded.canonical_feature_id,
           map_id = excluded.map_id,
           feature_id = excluded.feature_id,
           gap_type = excluded.gap_type,
           severity = excluded.severity,
           status = excluded.status,
           title = excluded.title,
           description = excluded.description,
           evidence_ids_json = excluded.evidence_ids_json,
           recommended_action = excluded.recommended_action,
           owner_map_id = excluded.owner_map_id,
           metadata_json = excluded.metadata_json,
           updated_at = excluded.updated_at`
      )
      .run(
        id,
        projectId,
        planned.stableKey,
        planned.signature,
        planned.canonicalFeatureId,
        planned.mapId,
        planned.featureId,
        planned.gapType,
        planned.severity,
        planned.status,
        planned.title,
        planned.description,
        jsonArray(planned.evidenceIds),
        planned.recommendedAction,
        planned.ownerMapId,
        json(planned.metadata),
        now,
        now
      );
    this.touchProject(projectId);
    this.recordEvent(projectId, 'http', 'upsert_capability_gap', { id, canonicalFeatureId: planned.canonicalFeatureId, gapType: planned.gapType, severity: planned.severity });
    return {
      operation: existing ? 'updated' : 'created',
      changedFields,
      data: this.getCapabilityGap(id),
      dryRun: false
    };
  }

  upsertCapabilityGapsBatch(input: BatchCapabilityGapInput): BatchUpsertResult<CapabilityGapRow> {
    const data = BatchCapabilityGapSchema.parse(input);
    this.getProject(data.projectId);
    return this.runBatch(data.dryRun, data.items, (item) => this.upsertCapabilityGap(data.projectId, { ...item, dryRun: data.dryRun }));
  }

  startFeatureFocus(input: StartFeatureFocusInput): FeatureFocusStartResult {
    const data = StartFeatureFocusSchema.parse(input);
    this.getProject(data.projectId);
    let result: FeatureFocusStartResult | null = null;
    const execute = () => {
      result = this.writeFeatureFocusStart(data);
      return result;
    };

    if (data.dryRun) {
      try {
        this.withSavepoint('feature_focus_start_preview', () => {
          execute();
          throw new DryRunRollbackError();
        });
      } catch (error) {
        if (!(error instanceof DryRunRollbackError)) {
          throw error;
        }
      }
      if (!result) {
        throw new ValidationError('功能焦点启动 dry-run 失败，未生成预览结果。');
      }
      return markFeatureFocusStartDryRun(result);
    }

    return this.withSavepoint('feature_focus_start', execute);
  }

  upsertFeatureFocus(projectId: string, input: CreateFeatureFocusInput): UpsertResult<FeatureFocusRow> {
    const data = CreateFeatureFocusSchema.parse(input);
    if (data.projectId && data.projectId !== projectId) {
      throw new ValidationError('projectId 与路径项目不一致。');
    }
    this.getProject(projectId);
    const feature = this.resolveFeatureFocusFeature(projectId, data);
    const targetMapIds = unique(data.targetMaps.map((item) => this.resolveOptionalMapId(projectId, item.mapId, item.mapStableKey)).filter(isString));
    const relatedFeatureIds = unique(data.relatedFeatures.map((item) => this.resolveFeatureFocusFeature(projectId, item).id));
    const stableKey = data.stableKey ?? featureFocusStableKey(feature, data.title);
    const now = nowIso();
    const existing = this.findFeatureFocusForUpsert(projectId, data.id, stableKey);
    const id = existing?.id ?? data.id ?? (data.dryRun ? previewId('focus') : newId('focus'));
    const planned = {
      id,
      projectId,
      stableKey,
      featureId: feature.id,
      title: data.title,
      mode: data.mode,
      status: data.status,
      priority: data.priority,
      sourceType: data.sourceType,
      question: data.question,
      scope: data.scope,
      sourceRefs: data.sourceRefs,
      seedPaths: data.seedPaths,
      targetMapIds,
      relatedFeatureIds,
      nextSteps: data.nextSteps,
      findings: data.findings,
      confidence: data.confidence,
      metadata: data.metadata,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    } satisfies FeatureFocusRow;
    const changedFields = existing
      ? changedFieldsFor(existing, planned, [
          'stableKey',
          'featureId',
          'title',
          'mode',
          'status',
          'priority',
          'sourceType',
          'question',
          'scope',
          'sourceRefs',
          'seedPaths',
          'targetMapIds',
          'relatedFeatureIds',
          'nextSteps',
          'findings',
          'confidence',
          'metadata'
        ])
      : [];
    if (data.dryRun) {
      return { operation: 'dry_run', changedFields: existing ? changedFields : ['*'], data: this.enrichFeatureFocus(planned), dryRun: true, previewId: existing ? undefined : id };
    }
    if (existing && changedFields.length === 0) {
      return { operation: 'unchanged', changedFields, data: existing, dryRun: false };
    }
    this.db
      .prepare(
        `INSERT INTO feature_focuses
          (id, project_id, stable_key, feature_id, title, mode, status, priority, source_type, question, scope, source_refs_json, seed_paths_json, target_map_ids_json, related_feature_ids_json, next_steps_json, findings, confidence, metadata_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           stable_key = excluded.stable_key,
           feature_id = excluded.feature_id,
           title = excluded.title,
           mode = excluded.mode,
           status = excluded.status,
           priority = excluded.priority,
           source_type = excluded.source_type,
           question = excluded.question,
           scope = excluded.scope,
           source_refs_json = excluded.source_refs_json,
           seed_paths_json = excluded.seed_paths_json,
           target_map_ids_json = excluded.target_map_ids_json,
           related_feature_ids_json = excluded.related_feature_ids_json,
           next_steps_json = excluded.next_steps_json,
           findings = excluded.findings,
           confidence = excluded.confidence,
           metadata_json = excluded.metadata_json,
           updated_at = excluded.updated_at`
      )
      .run(
        id,
        projectId,
        planned.stableKey,
        planned.featureId,
        planned.title,
        planned.mode,
        planned.status,
        planned.priority,
        planned.sourceType,
        planned.question,
        planned.scope,
        jsonArray(planned.sourceRefs),
        jsonArray(planned.seedPaths),
        jsonArray(planned.targetMapIds),
        jsonArray(planned.relatedFeatureIds),
        jsonArray(planned.nextSteps),
        planned.findings,
        planned.confidence,
        json(planned.metadata),
        now,
        now
      );
    this.touchProject(projectId);
    this.recordEvent(projectId, 'http', 'upsert_feature_focus', { id, featureId: feature.id, stableKey, status: data.status });
    return {
      operation: existing ? 'updated' : 'created',
      changedFields,
      data: this.getFeatureFocus(id),
      dryRun: false
    };
  }

  getFeatureFocus(focusId: string): FeatureFocusRow {
    const row = this.db.prepare('SELECT * FROM feature_focuses WHERE id = ?').get(focusId);
    if (!row) {
      throw new NotFoundError(`功能焦点不存在: ${focusId}`);
    }
    return this.enrichFeatureFocus(mapFeatureFocus(row));
  }

  listFeatureFocuses(input: QueryFeatureFocusesInput): FeatureFocusRow[] {
    const data = QueryFeatureFocusesSchema.parse(input);
    this.getProject(data.projectId);
    const resolvedMapId = data.mapId || data.mapStableKey ? this.resolveOptionalMapId(data.projectId, data.mapId, data.mapStableKey) ?? undefined : undefined;
    const where = ['ff.project_id = ?'];
    const args: SQLInputValue[] = [data.projectId];
    if (data.focusId) {
      where.push('ff.id = ?');
      args.push(data.focusId);
    }
    if (data.focusStableKey) {
      where.push('ff.stable_key = ?');
      args.push(data.focusStableKey);
    }
    if (data.featureId || data.featureStableKey) {
      const feature = data.featureId ? this.getFeature(data.featureId) : this.resolveFeatureByStableKey(data.projectId, data.featureStableKey ?? '', data.featureVersion, resolvedMapId);
      if (feature.projectId !== data.projectId) {
        throw new ValidationError('功能不属于当前项目。');
      }
      if (resolvedMapId && feature.mapId !== resolvedMapId) {
        throw new ValidationError('功能不属于指定功能地图。');
      }
      where.push('ff.feature_id = ?');
      args.push(feature.id);
    } else if (resolvedMapId) {
      where.push('f.map_id = ?');
      args.push(resolvedMapId);
    }
    if (data.mode) {
      where.push('ff.mode = ?');
      args.push(data.mode);
    }
    if (data.status) {
      where.push('ff.status = ?');
      args.push(data.status);
    } else if (!data.includeArchived) {
      where.push("ff.status <> 'archived'");
    }
    if (data.priority) {
      where.push('ff.priority = ?');
      args.push(data.priority);
    }
    if (data.sourceType) {
      where.push('ff.source_type = ?');
      args.push(data.sourceType);
    }
    appendSearchExpressionsClause(
      where,
      args,
      [
        'ff.id',
        'ff.stable_key',
        'ff.title',
        'ff.mode',
        'ff.status',
        'ff.priority',
        'ff.source_type',
        'ff.question',
        'ff.scope',
        'ff.findings',
        'f.id',
        'f.stable_key',
        'f.name',
        'f.description'
      ],
      data.keyword
    );
    return this.db
      .prepare(
        `SELECT ff.* FROM feature_focuses ff
         JOIN features f ON f.id = ff.feature_id
         WHERE ${where.join(' AND ')}
         ORDER BY CASE ff.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
                  CASE ff.status WHEN 'in_progress' THEN 0 WHEN 'open' THEN 1 WHEN 'ready_for_implementation' THEN 2 ELSE 3 END,
                  ff.updated_at DESC
         LIMIT ?`
      )
      .all(...args, data.limit)
      .map((row) => this.enrichFeatureFocus(mapFeatureFocus(row)));
  }

  upsertFeatureDossier(input: UpsertFeatureDossierInput): FeatureDossierUpsertResult {
    const data = UpsertFeatureDossierSchema.parse(input);
    this.getProject(data.projectId);
    let result: FeatureDossierUpsertResult | null = null;
    const execute = () => {
      result = this.writeFeatureDossier(data);
      return result;
    };

    if (data.dryRun) {
      try {
        this.withSavepoint('feature_dossier_preview', () => {
          execute();
          throw new DryRunRollbackError();
        });
      } catch (error) {
        if (!(error instanceof DryRunRollbackError)) {
          throw error;
        }
      }
      if (!result) {
        throw new ValidationError('功能档案 dry-run 失败，未生成预览结果。');
      }
      return markFeatureDossierDryRun(result);
    }

    return this.withSavepoint('feature_dossier', execute);
  }

  getCapabilityStatus(statusId: string): CapabilityStatusRow {
    const row = this.db.prepare('SELECT * FROM capability_statuses WHERE id = ?').get(statusId);
    if (!row) {
      throw new NotFoundError(`能力状态不存在: ${statusId}`);
    }
    return this.enrichCapabilityStatus(mapCapabilityStatus(row));
  }

  getCapabilityGap(gapId: string): CapabilityGapRow {
    const row = this.db.prepare('SELECT * FROM capability_gaps WHERE id = ?').get(gapId);
    if (!row) {
      throw new NotFoundError(`能力缺口不存在: ${gapId}`);
    }
    return this.enrichCapabilityGap(mapCapabilityGap(row));
  }

  capabilityMatrix(input: CapabilityMatrixInput): CapabilityMatrixResult {
    const data = CapabilityMatrixSchema.parse(input);
    const project = this.getProject(data.projectId);
    const canonicalFeature = data.canonicalFeatureId || data.canonicalFeatureStableKey
      ? this.resolveCapabilityReferences(data.projectId, data, { requireMap: false }).canonicalFeature
      : null;
    const mapId = this.resolveOptionalMapId(data.projectId, data.mapId, data.mapStableKey) ?? undefined;
    const statuses = this.listCapabilityStatuses(data.projectId, { canonicalFeatureId: canonicalFeature?.id, mapId });
    const gaps = data.includeGaps ? this.listCapabilityGaps(data.projectId, { canonicalFeatureId: canonicalFeature?.id, mapId }) : [];
    const evidence = data.includeEvidence ? this.evidenceForIds(data.projectId, unique([...statuses.flatMap((status) => status.evidenceIds), ...gaps.flatMap((gap) => gap.evidenceIds)])) : [];
    return {
      project,
      canonicalFeature,
      statuses,
      gaps,
      evidence,
      summary: {
        statusCounts: countBy(statuses, (status) => status.status),
        openGapCount: gaps.filter((gap) => gap.status === 'open').length,
        highSeverityGapCount: gaps.filter((gap) => gap.severity === 'high' && gap.status === 'open').length
      }
    };
  }

  getEvidence(evidenceId: string): EvidenceRow {
    const row = this.db.prepare('SELECT * FROM evidence WHERE id = ?').get(evidenceId);
    if (!row) {
      throw new NotFoundError(`证据不存在: ${evidenceId}`);
    }
    return this.mapEvidenceWithLabel(row);
  }

  listEvidence(projectId: string): EvidenceRow[] {
    return this.db
      .prepare('SELECT * FROM evidence WHERE project_id = ? ORDER BY updated_at DESC')
      .all(projectId)
      .map((row) => this.mapEvidenceWithLabel(row));
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
    const types = new Set<QueryContextType>(query.types ?? ['project', 'map', 'feature', 'feature_focus', 'alignment', 'entry_point', 'code_reference', 'evidence']);
    const offset = parseCursor(query.cursor) ?? query.offset;
    const limit = query.limit;
    const projects = query.includeSummaryOnly || !types.has('project') ? [] : this.queryProjects(resolvedQuery, limit, offset);
    const maps = query.includeSummaryOnly || !types.has('map') ? [] : this.queryMaps(resolvedQuery, limit, offset);
    const features = query.includeSummaryOnly || !types.has('feature') ? [] : this.queryFeatures(resolvedQuery, limit, offset, query.includeDetails);
    const featureFocuses = query.includeSummaryOnly || !types.has('feature_focus') ? [] : this.queryFeatureFocuses(resolvedQuery, limit, offset);
    const alignments = query.includeSummaryOnly || !types.has('alignment') ? [] : this.queryAlignments(resolvedQuery, limit, offset, query.includeMembers);
    const entryPoints = query.includeSummaryOnly || !types.has('entry_point') ? [] : this.queryEntryPoints(resolvedQuery, limit, offset);
    const codeReferences = query.includeSummaryOnly || !types.has('code_reference') ? [] : this.queryCodeReferences(resolvedQuery, limit, offset);
    const evidence = query.includeSummaryOnly || !types.has('evidence') ? [] : this.queryEvidence(resolvedQuery, limit, offset);
    const totals: Record<QueryContextType, number> = {
      project: types.has('project') ? this.countProjects(resolvedQuery) : 0,
      map: types.has('map') ? this.countMaps(resolvedQuery) : 0,
      feature: types.has('feature') ? this.countFeatures(resolvedQuery) : 0,
      feature_focus: types.has('feature_focus') ? this.countFeatureFocuses(resolvedQuery) : 0,
      alignment: types.has('alignment') ? this.countAlignments(resolvedQuery) : 0,
      entry_point: types.has('entry_point') ? this.countEntryPoints(resolvedQuery) : 0,
      code_reference: types.has('code_reference') ? this.countCodeReferences(resolvedQuery) : 0,
      evidence: types.has('evidence') ? this.countEvidence(resolvedQuery) : 0
    };
    const hasMore = Object.values(totals).some((total) => total > offset + limit);

    return {
      projects: presentRows('project', projects, query.view, query.includeMetadata),
      maps: presentRows('map', maps, query.view, query.includeMetadata),
      features: presentRows('feature', features, query.view, query.includeMetadata),
      featureFocuses: presentRows('feature_focus', featureFocuses, query.view, query.includeMetadata),
      alignments: presentRows('alignment', alignments, query.view, query.includeMetadata),
      entryPoints: presentRows('entry_point', entryPoints, query.view, query.includeMetadata),
      codeReferences: presentRows('code_reference', codeReferences, query.view, query.includeMetadata),
      evidence: presentRows('evidence', evidence, query.view, query.includeMetadata),
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

  searchFeatures(input: SearchFeaturesInput): FeatureSearchResult {
    const data = SearchFeaturesSchema.parse(input);
    const project = this.getProject(data.projectId);
    const mapId = data.mapId || data.mapStableKey ? this.resolveOptionalMapId(data.projectId, data.mapId, data.mapStableKey) ?? undefined : undefined;
    const query = data.query.trim();
    const pathValue = data.path?.trim() ?? '';
    const rows = this.queryFeatureSearchRows(data, mapId, Math.max(data.limit * 8, 80));
    const terms = featureSearchTerms(query);
    const candidates = rows
      .map((row) => {
        const feature = this.attachFeatureDetails(mapFeature(row), data.includeDetails);
        const featureMap = this.getMap(feature.mapId);
        const references = this.codeReferencesForFeatures(data.projectId, [feature.id]);
        const matchingCodeReferences = references.filter((reference) => codeReferenceMatchesSearch(reference, query, terms, pathValue, data.pathMode)).slice(0, 3);
        const openFocuses = this.listFeatureFocuses({ projectId: data.projectId, featureId: feature.id, limit: 5 }).filter((focus) => !['implemented', 'closed', 'archived'].includes(focus.status)).slice(0, 3);
        const openGaps = this.openGapsForFeature(data.projectId, feature.id).slice(0, 3);
        const alignments = this.findAlignmentsForTargets(data.projectId, new Set([`feature:${feature.id}`, ...references.map((reference) => `code_reference:${reference.id}`)]));
        const score = scoreFeatureSearchCandidate(feature, featureMap, matchingCodeReferences, openFocuses, openGaps, query, terms, pathValue, data.pathMode);
        return {
          feature,
          map: featureMap,
          score: score.score,
          reasons: score.reasons,
          openFocuses,
          codeReferenceCount: references.length,
          matchingCodeReferences,
          gapCount: openGaps.length,
          openGaps,
          alignmentCount: alignments.length,
          nextAction: featureSearchNextAction(openFocuses, matchingCodeReferences, openGaps)
        } satisfies FeatureSearchCandidate;
      })
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score || axisRank(left.map.axis) - axisRank(right.map.axis) || left.feature.name.localeCompare(right.feature.name))
      .slice(0, data.limit);
    const exactStableKeyMatches = candidates.filter((candidate) => candidate.feature.stableKey.toLowerCase() === query.toLowerCase()).length;
    const suggestedStart = candidates[0]?.score && candidates[0].score >= 50 ? null : this.suggestFeatureSearchStart(data.projectId, query, candidates[0]);

    return {
      project,
      query,
      path: pathValue,
      candidates,
      suggestedStart,
      page: {
        limit: data.limit,
        candidateCount: candidates.length
      },
      summary: {
        openFocusCount: candidates.reduce((count, candidate) => count + candidate.openFocuses.length, 0),
        exactStableKeyMatches,
        codeReferenceMatches: candidates.reduce((count, candidate) => count + candidate.matchingCodeReferences.length, 0)
      }
    };
  }

  prepareFeatureWork(input: PrepareFeatureWorkInput): PreparedFeatureWorkResult {
    const data = PrepareFeatureWorkSchema.parse(input);
    const project = this.getProject(data.projectId);
    let search: FeatureSearchResult | null = null;
    let selectedCandidate: FeatureSearchCandidate | null = null;
    let selectedFocus: FeatureFocusRow | null = null;
    let suggestedStart: FeatureSearchResult['suggestedStart'] = null;
    if (data.focusId || data.focusStableKey) {
      selectedFocus = data.focusId ? this.getFeatureFocus(data.focusId) : this.findFeatureFocusByStableKey(data.projectId, data.focusStableKey ?? '');
      if (!selectedFocus) {
        throw new NotFoundError(`功能焦点不存在: ${data.focusStableKey}`);
      }
      if (selectedFocus.projectId !== data.projectId) {
        throw new ValidationError('功能焦点不属于当前项目。');
      }
      const feature = this.getFeature(selectedFocus.featureId, true);
      selectedCandidate = this.featureSearchCandidateForFeature(data.projectId, feature, 100, ['直接指定功能焦点']);
    } else if (data.featureId || data.featureStableKey) {
      const mapId = data.mapId || data.mapStableKey ? this.resolveOptionalMapId(data.projectId, data.mapId, data.mapStableKey) ?? undefined : undefined;
      const feature = data.featureId ? this.getFeature(data.featureId, true) : this.resolveFeatureByStableKey(data.projectId, data.featureStableKey ?? '', data.featureVersion, mapId);
      selectedCandidate = this.featureSearchCandidateForFeature(data.projectId, this.getFeature(feature.id, true), 100, ['直接指定功能']);
    } else {
      search = this.searchFeatures({
        projectId: data.projectId,
        query: data.query,
        path: data.path,
        pathMode: data.pathMode,
        mapId: data.mapId,
        mapStableKey: data.mapStableKey,
        axes: data.axes,
        statuses: data.statuses,
        includeArchived: data.includeArchived,
        includeDetails: true,
        limit: data.limit
      });
      const firstCandidate = search.candidates[0] ?? null;
      if (firstCandidate && firstCandidate.score >= data.minCandidateScore) {
        selectedCandidate = firstCandidate;
      } else {
        suggestedStart = search.suggestedStart;
        return {
          project,
          readiness: firstCandidate ? 'ambiguous' : 'needs_start',
          search,
          selectedCandidate: firstCandidate,
          selectedFocus: null,
          dossier: null,
          programmingContext: null,
          suggestedStart,
          nextSteps: preparedFeatureFallbackSteps(firstCandidate, suggestedStart),
          recommendedToolCalls: preparedFeatureFallbackToolCalls(data.projectId, firstCandidate, suggestedStart, data.depth)
        };
      }
    }
    const focusReference = selectedFocus ? { focusId: selectedFocus.id } : { featureId: selectedCandidate.feature.id };
    const dossier = this.featureDossier({ projectId: data.projectId, ...focusReference, depth: data.depth });
    const programmingContext = this.programmingContext({ projectId: data.projectId, ...focusReference, depth: data.depth });
    return {
      project,
      readiness: 'ready',
      search,
      selectedCandidate,
      selectedFocus,
      dossier,
      programmingContext,
      suggestedStart: null,
      nextSteps: preparedFeatureNextSteps(selectedCandidate, dossier, programmingContext, selectedFocus),
      recommendedToolCalls: preparedFeatureToolCalls(data.projectId, selectedCandidate, selectedFocus, data.depth)
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
        featureFocuses: scalarCount(this.db.prepare('SELECT COUNT(*) AS count FROM feature_focuses').get()),
        openFeatureFocuses: scalarCount(this.db.prepare("SELECT COUNT(*) AS count FROM feature_focuses WHERE status NOT IN ('implemented', 'closed', 'archived')").get()),
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

  programmingContext(input: ProgrammingContextInput): ProgrammingContextResult {
    const data = ProgrammingContextSchema.parse(input);
    const project = this.getProject(data.projectId);
    const resolvedFocus = this.resolveFocusedFeature(data.projectId, data);
    const feature = resolvedFocus.feature;
    if (feature.projectId !== data.projectId) {
      throw new ValidationError('功能不属于当前项目。');
    }
    const featureWithDetails = this.getFeature(feature.id, true);
    const featureMap = this.getMap(feature.mapId);
    const include = new Set(data.include);
    const directReferences = include.has('codeReferences') ? this.codeReferencesForFeatures(data.projectId, [feature.id]) : [];
    const directEntryPoints = include.has('entryPoints') ? this.entryPointsForReferences(data.projectId, directReferences, feature.mapId) : [];
    const targetKeys = new Set<string>([`feature:${feature.id}`, ...directReferences.map((reference) => `code_reference:${reference.id}`), ...directEntryPoints.map((entryPoint) => `entry_point:${entryPoint.id}`)]);
    const alignments = include.has('alignments') ? this.findAlignmentsForTargets(data.projectId, targetKeys) : [];
    const impactedFeatures = data.depth > 0 ? this.impactedFeatures(data.projectId, feature, alignments, data.depth) : [];
    const impactedReferences = include.has('codeReferences') ? this.codeReferencesForFeatures(data.projectId, impactedFeatures.map((item) => item.id)) : [];
    const allReferences = uniqueById([...directReferences, ...impactedReferences]);
    const allEntryPoints = include.has('entryPoints') ? this.entryPointsForReferences(data.projectId, allReferences, feature.mapId) : [];
    const evidence = include.has('evidence') ? this.evidenceForTargets(data.projectId, new Set([`feature:${feature.id}`, ...allReferences.map((reference) => `code_reference:${reference.id}`), ...alignments.map((alignment) => `alignment:${alignment.id}`)])) : [];
    const detail = featureWithDetails.details ?? null;
    const capabilityMatrix = include.has('statusMatrix') || include.has('gaps') ? this.capabilityMatrix({ projectId: data.projectId, canonicalFeatureId: feature.id, includeGaps: include.has('gaps'), includeEvidence: include.has('evidence') }) : null;
    const capabilityGaps = include.has('gaps') ? capabilityMatrix?.gaps ?? [] : [];
    const focuses = include.has('focuses')
      ? uniqueById([resolvedFocus.selectedFocus, ...this.listFeatureFocuses({ projectId: data.projectId, featureId: feature.id, includeArchived: Boolean(resolvedFocus.selectedFocus), limit: 20 })].filter(isNonNull))
      : [];
    const actionFocuses = uniqueById([resolvedFocus.selectedFocus, ...focuses].filter(isNonNull));
    const seedPathContexts = include.has('seedPathContexts') ? this.seedPathContexts(data.projectId, actionFocuses, include) : [];
    const qualityIssues = include.has('quality') ? this.qualityIssuesForFeature(data.projectId, featureWithDetails, detail, allReferences, alignments, evidence, undefined) : [];
    const verification = allReferences.map((reference) => reference.verificationHint).filter(isString);

    return {
      project,
      map: featureMap,
      feature: featureWithDetails,
      details: include.has('details') ? detail : null,
      selectedFocus: resolvedFocus.selectedFocus,
      focuses,
      seedPathContexts,
      nextActions: programmingNextActions(feature.id, actionFocuses, capabilityGaps, qualityIssues, verification),
      requiredEntryPoints: allEntryPoints,
      keyCodeReferences: allReferences,
      relatedProductCapabilities: impactedFeatures.filter((item) => item.id !== feature.id && this.getMap(item.mapId).axis === 'product'),
      alignments,
      impactedFeatures: impactedFeatures.filter((item) => item.id !== feature.id),
      evidence,
      capabilityMatrix: include.has('statusMatrix') ? capabilityMatrix : null,
      capabilityGaps,
      risks: include.has('risks') ? detail?.risks ?? [] : [],
      acceptanceCriteria: include.has('acceptanceCriteria') ? detail?.acceptanceCriteria ?? [] : [],
      verification,
      qualityIssues
    };
  }

  featureDossier(input: FeatureDossierInput): FeatureDossierResult {
    const data = FeatureDossierSchema.parse(input);
    const project = this.getProject(data.projectId);
    const resolvedFocus = this.resolveFocusedFeature(data.projectId, data);
    const focus = resolvedFocus.feature;
    if (focus.projectId !== data.projectId) {
      throw new ValidationError('功能不属于当前项目。');
    }
    const focusFeature = this.getFeature(focus.id, true);
    const focusMap = this.getMap(focusFeature.mapId);
    const canonicalFeature = this.canonicalFeatureForDossier(data.projectId, focusFeature);
    const canonicalMap = this.getMap(canonicalFeature.mapId);
    const include = new Set(data.include);
    const programmingIncludes = [
      include.has('entryPoints') ? 'entryPoints' : null,
      include.has('codeReferences') ? 'codeReferences' : null,
      include.has('alignments') ? 'alignments' : null,
      include.has('evidence') ? 'evidence' : null,
      include.has('details') ? 'details' : null,
      include.has('quality') ? 'quality' : null,
      'risks',
      'acceptanceCriteria'
    ].filter(isString) as ProgrammingContextInput['include'];
    const programmingContext = this.programmingContext({
      projectId: data.projectId,
      featureId: focusFeature.id,
      depth: data.depth,
      include: programmingIncludes
    });
    const statusMatrix =
      include.has('statusMatrix') || include.has('gaps') || include.has('evidence')
        ? this.capabilityMatrix({
            projectId: data.projectId,
            canonicalFeatureId: canonicalFeature.id,
            includeGaps: include.has('gaps'),
            includeEvidence: include.has('evidence')
          })
        : null;
    const evidence = include.has('evidence') ? uniqueById([...programmingContext.evidence, ...(statusMatrix?.evidence ?? [])]) : [];
    const gaps = include.has('gaps') ? statusMatrix?.gaps ?? [] : [];
    const implementationSlices = include.has('statusMatrix') ? statusMatrix?.statuses ?? [] : [];
    const relatedFeatures = include.has('relatedFeatures')
      ? uniqueById([canonicalFeature.id === focusFeature.id ? null : canonicalFeature, ...programmingContext.impactedFeatures].filter(isNonNull))
      : [];
    const codeReferences = include.has('codeReferences') ? programmingContext.keyCodeReferences : [];
    const entryPoints = include.has('entryPoints') ? programmingContext.requiredEntryPoints : [];
    const alignments = include.has('alignments') ? programmingContext.alignments : [];
    const focuses = include.has('focuses')
      ? uniqueById([resolvedFocus.selectedFocus, ...this.listFeatureFocuses({ projectId: data.projectId, featureId: focusFeature.id, includeArchived: Boolean(resolvedFocus.selectedFocus), limit: 20 })].filter(isNonNull))
      : [];
    const qualityIssues = include.has('quality') ? programmingContext.qualityIssues : [];

    return {
      project,
      focus: {
        feature: include.has('details') ? focusFeature : { ...focusFeature, details: undefined },
        map: focusMap
      },
      canonicalFeature: include.has('details') ? this.getFeature(canonicalFeature.id, true) : canonicalFeature,
      canonicalMap,
      statusMatrix: include.has('statusMatrix') ? statusMatrix : null,
      implementationSlices,
      gaps,
      evidence,
      codeReferences,
      entryPoints,
      alignments,
      relatedFeatures,
      selectedFocus: resolvedFocus.selectedFocus,
      focuses,
      qualityIssues,
      summary: {
        isCanonical: focusFeature.id === canonicalFeature.id,
        statusCounts: countBy(implementationSlices, (status) => status.status),
        evidenceSourceCounts: countBy(evidence, (item) => item.sourceType),
        openGapCount: gaps.filter((gap) => gap.status === 'open').length,
        highSeverityGapCount: gaps.filter((gap) => gap.status === 'open' && gap.severity === 'high').length,
        codeReferenceCount: codeReferences.length,
        entryPointCount: entryPoints.length,
        alignmentCount: alignments.length,
        relatedFeatureCount: relatedFeatures.length,
        openFocusCount: focuses.filter((focus) => !['implemented', 'closed', 'archived'].includes(focus.status)).length
      }
    };
  }

  featureReadiness(input: FeatureReadinessInput): FeatureReadinessResult {
    const data = FeatureReadinessSchema.parse(input);
    const reference = featureReadinessReference(data);
    const dossier = this.featureDossier({
      projectId: data.projectId,
      ...reference,
      depth: 2,
      include: ['focuses', 'details', 'codeReferences', 'entryPoints', 'alignments', 'evidence', 'statusMatrix', 'gaps', 'relatedFeatures', 'quality']
    });
    const qualityReport = this.qualityReport({ projectId: data.projectId, ...reference });
    const requiredAxes = featureReadinessAxes(data, dossier);
    const axisCoverage = requiredAxes.map((axis) => featureReadinessAxisCoverage(axis, dossier));
    const checks = featureReadinessChecks(dossier, qualityReport, axisCoverage);
    const readiness = featureReadinessStatus(dossier, checks);
    const score = featureReadinessScore(checks);
    const missingAxes = axisCoverage.filter((item) => item.status === 'missing').map((item) => item.axis);

    return {
      project: dossier.project,
      map: dossier.focus.map,
      feature: dossier.focus.feature,
      selectedFocus: dossier.selectedFocus,
      readiness,
      score,
      requiredAxes,
      axisCoverage,
      checks,
      missingAxes,
      nextSteps: featureReadinessNextSteps(dossier, qualityReport, checks, missingAxes),
      recommendedToolCalls: featureReadinessToolCalls(data.projectId, dossier, readiness),
      dossier,
      qualityReport
    };
  }

  qualityReport(input: QualityReportInput): QualityReportResult {
    const data = QualityReportSchema.parse(input);
    this.getProject(data.projectId);
    const features = this.qualityReportFeatures(data);
    const featureIds = new Set(features.map((feature) => feature.id));
    const mapId = data.mapId || data.mapStableKey ? this.resolveOptionalMapId(data.projectId, data.mapId, data.mapStableKey) ?? undefined : undefined;
    const scopedQualityReport = isScopedQualityReport(data);
    const referencesByFeature = groupBy(this.listCodeReferences(data.projectId).filter((reference) => reference.featureId), (reference) => reference.featureId ?? '');
    const alignments = this.listAlignments(data.projectId);
    const alignmentsByFeature = new Map<string, AlignmentRow[]>();
    for (const alignment of alignments) {
      for (const member of alignment.members) {
        if (member.targetType === 'feature') {
          const list = alignmentsByFeature.get(member.targetId) ?? [];
          list.push(alignment);
          alignmentsByFeature.set(member.targetId, list);
        }
      }
    }
    const evidence = this.listEvidence(data.projectId);
    const evidenceByTarget = groupBy(evidence, (item) => `${item.targetType}:${item.targetId}`);
    const issues: QualityIssue[] = [];
    let featuresWithoutCodeReferences = 0;
    let featuresWithoutAlignments = 0;
    let featuresWithoutCodeEvidence = 0;
    let draftDetailGaps = 0;
    let inProgressDetailGaps = 0;
    let blockedDetailGaps = 0;
    let deprecatedDetailGaps = 0;
    let mockBoundaryGaps = 0;
    const capabilityGaps = this.listCapabilityGaps(data.projectId, {}).filter((gap) => {
      const matchesMap = !mapId || gap.mapId === mapId || gap.ownerMapId === mapId;
      const matchesFeature =
        !scopedQualityReport ||
        featureIds.has(gap.canonicalFeatureId) ||
        (gap.featureId ? featureIds.has(gap.featureId) : false) ||
        (Boolean(mapId) && matchesMap);
      return matchesFeature && matchesMap;
    });
    const openCapabilityGaps = capabilityGaps.filter((gap) => gap.status === 'open').length;
    const highSeverityCapabilityGaps = capabilityGaps.filter((gap) => gap.status === 'open' && gap.severity === 'high').length;

    for (const feature of features) {
      const references = referencesByFeature.get(feature.id) ?? [];
      const featureAlignments = alignmentsByFeature.get(feature.id) ?? [];
      const featureEvidence = evidenceByTarget.get(`feature:${feature.id}`) ?? [];
      const referenceEvidence = references.flatMap((reference) => evidenceByTarget.get(`code_reference:${reference.id}`) ?? []);
      const featureIssues = this.qualityIssuesForFeature(data.projectId, feature, feature.details ?? null, references, featureAlignments, [...featureEvidence, ...referenceEvidence], undefined);
      for (const issue of featureIssues) {
        if (issue.code === 'FEATURE_WITHOUT_CODE_REFERENCE') featuresWithoutCodeReferences += 1;
        if (issue.code === 'FEATURE_WITHOUT_ALIGNMENT') featuresWithoutAlignments += 1;
        if (issue.code === 'FEATURE_WITHOUT_CODE_EVIDENCE') featuresWithoutCodeEvidence += 1;
        if (issue.code === 'DRAFT_DETAIL_GAP') draftDetailGaps += 1;
        if (issue.code === 'IN_PROGRESS_DETAIL_GAP') inProgressDetailGaps += 1;
        if (issue.code === 'BLOCKED_DETAIL_GAP') blockedDetailGaps += 1;
        if (issue.code === 'DEPRECATED_DETAIL_GAP') deprecatedDetailGaps += 1;
        if (issue.code === 'MOCK_BOUNDARY_GAP') mockBoundaryGaps += 1;
      }
      issues.push(...featureIssues);
    }

    let missingPaths = 0;
    if (data.repoRoot && data.includePathChecks) {
      for (const reference of this.listCodeReferences(data.projectId)) {
        if (scopedQualityReport && reference.featureId && !featureIds.has(reference.featureId)) continue;
        if (scopedQualityReport && !reference.featureId && mapId && reference.mapId !== mapId) continue;
        if (scopedQualityReport && !reference.featureId && !mapId) continue;
        if (!fs.existsSync(path.resolve(data.repoRoot, reference.path))) {
          missingPaths += 1;
          issues.push({
            severity: 'warning',
            code: 'CODE_REFERENCE_PATH_MISSING',
            targetType: 'code_reference',
            targetId: reference.id,
            message: `代码引用路径不存在: ${reference.path}`,
            hint: '确认 repoRoot 是否正确，或重新扫描删除/更新失效路径。'
          });
        }
      }
    }

    const counts = countIssues(issues);
    return {
      projectId: data.projectId,
      summary: {
        ...counts,
        featuresWithoutCodeReferences,
        featuresWithoutAlignments,
        featuresWithoutCodeEvidence,
        draftDetailGaps,
        inProgressDetailGaps,
        blockedDetailGaps,
        deprecatedDetailGaps,
        mockBoundaryGaps,
        openCapabilityGaps,
        highSeverityCapabilityGaps,
        missingPaths
      },
      issues
    };
  }

  private qualityReportFeatures(data: ParsedQualityReport): FeatureRow[] {
    if (data.focusId || data.focusStableKey || data.featureId || data.featureStableKey) {
      return [this.resolveFocusedFeature(data.projectId, data).feature].map((feature) => this.attachFeatureDetails(feature, true));
    }
    if (data.mapId || data.mapStableKey) {
      const mapId = this.resolveOptionalMapId(data.projectId, data.mapId, data.mapStableKey);
      if (!mapId) return [];
      return this.listFeatures(data.projectId)
        .filter((feature) => feature.mapId === mapId)
        .map((feature) => this.attachFeatureDetails(feature, true));
    }
    return this.listFeatures(data.projectId).map((feature) => this.attachFeatureDetails(feature, true));
  }

  private attachFeatureDetails(feature: FeatureRow, includeDetails: boolean): FeatureRow {
    return includeDetails ? { ...feature, details: this.findFeatureDetailById(feature.id) ?? undefined } : feature;
  }

  private findFeatureDetailById(featureId: string): FeatureDetailRow | null {
    const row = this.db.prepare('SELECT * FROM feature_details WHERE feature_id = ?').get(featureId);
    return row ? mapFeatureDetail(row) : null;
  }

  private writeFeatureDetails(details: FeatureDetailRow): void {
    this.db
      .prepare(
        `INSERT INTO feature_details
          (feature_id, intent, current_behavior, expected_behavior, scope, known_gaps_json, open_questions_json, acceptance_criteria_json, risks_json, blocker, replacement, deprecated_reason, mock_boundary, details_markdown, last_verified_at, last_verified_commit, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(feature_id) DO UPDATE SET
           intent = excluded.intent,
           current_behavior = excluded.current_behavior,
           expected_behavior = excluded.expected_behavior,
           scope = excluded.scope,
           known_gaps_json = excluded.known_gaps_json,
           open_questions_json = excluded.open_questions_json,
           acceptance_criteria_json = excluded.acceptance_criteria_json,
           risks_json = excluded.risks_json,
           blocker = excluded.blocker,
           replacement = excluded.replacement,
           deprecated_reason = excluded.deprecated_reason,
           mock_boundary = excluded.mock_boundary,
           details_markdown = excluded.details_markdown,
           last_verified_at = excluded.last_verified_at,
           last_verified_commit = excluded.last_verified_commit,
           updated_at = excluded.updated_at`
      )
      .run(
        details.featureId,
        details.intent,
        details.currentBehavior,
        details.expectedBehavior,
        details.scope,
        jsonArray(details.knownGaps),
        jsonArray(details.openQuestions),
        jsonArray(details.acceptanceCriteria),
        jsonArray(details.risks),
        details.blocker,
        details.replacement,
        details.deprecatedReason,
        details.mockBoundary,
        details.detailsMarkdown,
        details.lastVerifiedAt,
        details.lastVerifiedCommit,
        details.updatedAt
      );
  }

  private resolveEvidenceTarget(projectId: string, input: { targetType: string; targetId?: string; targetStableKey?: string; mapId?: string; mapStableKey?: string; version?: string }): string {
    if (input.targetId) {
      this.assertEvidenceTarget(projectId, input.targetType, input.targetId);
      return input.targetId;
    }
    if (!input.targetStableKey) {
      throw new ValidationError('证据需要 targetId 或 targetStableKey。');
    }
    if (input.targetType === 'capability_status' || input.targetType === 'capability_gap') {
      throw new ValidationError('capability_status/capability_gap 证据目标请使用 targetId。');
    }
    const resolved = this.resolveStableKeyItem(projectId, {
      type: input.targetType as ResolveStableKeyType,
      stableKey: input.targetStableKey,
      mapId: input.mapId,
      mapStableKey: input.mapStableKey,
      version: input.version
    });
    if (!resolved) {
      throw new NotFoundError(`证据目标 stableKey 不存在: ${input.targetType}:${input.targetStableKey}`);
    }
    return resolved.id;
  }

  private assertEvidenceTarget(projectId: string, targetType: string, targetId: string): void {
    if (targetType === 'alignment') {
      const alignment = this.getAlignment(targetId);
      if (alignment.projectId !== projectId) {
        throw new ValidationError('证据目标不属于当前项目。');
      }
      return;
    }
    if (targetType === 'capability_status') {
      const status = this.getCapabilityStatus(targetId);
      if (status.projectId !== projectId) {
        throw new ValidationError('证据目标不属于当前项目。');
      }
      return;
    }
    if (targetType === 'capability_gap') {
      const gap = this.getCapabilityGap(targetId);
      if (gap.projectId !== projectId) {
        throw new ValidationError('证据目标不属于当前项目。');
      }
      return;
    }
    this.assertAlignable(projectId, targetType, targetId);
  }

  private findEvidenceForUpsert(projectId: string, id: string | undefined, signature: string): EvidenceRow | null {
    const matches = [
      id ? this.findEvidenceById(id) : null,
      signature ? this.findEvidenceBySignature(projectId, signature) : null
    ].filter((evidence): evidence is EvidenceRow => Boolean(evidence));
    for (const evidence of matches) {
      if (evidence.projectId !== projectId) {
        throw new ValidationError('证据 ID 不属于当前项目。');
      }
    }
    const [first] = matches;
    if (first && matches.some((evidence) => evidence.id !== first.id)) {
      throw new ValidationError('证据 id 和签名指向不同对象，请先查询上下文确认。');
    }
    return first ?? null;
  }

  private findEvidenceById(id: string): EvidenceRow | null {
    const row = this.db.prepare('SELECT * FROM evidence WHERE id = ?').get(id);
    return row ? this.mapEvidenceWithLabel(row) : null;
  }

  private findEvidenceBySignature(projectId: string, signature: string): EvidenceRow | null {
    const row = this.db.prepare('SELECT * FROM evidence WHERE project_id = ? AND signature = ?').get(projectId, signature);
    return row ? this.mapEvidenceWithLabel(row) : null;
  }

  private mapEvidenceWithLabel(row: unknown): EvidenceRow {
    const evidence = mapEvidence(row);
    return { ...evidence, label: this.evidenceTargetLabel(evidence.targetType, evidence.targetId) };
  }

  private evidenceTargetLabel(targetType: string, targetId: string): string {
    if (targetType === 'alignment') {
      try {
        return this.getAlignment(targetId).name;
      } catch {
        return targetId;
      }
    }
    if (targetType === 'capability_status') {
      try {
        return this.getCapabilityStatus(targetId).summary || targetId;
      } catch {
        return targetId;
      }
    }
    if (targetType === 'capability_gap') {
      try {
        return this.getCapabilityGap(targetId).title;
      } catch {
        return targetId;
      }
    }
    return this.alignableLabel(targetType, targetId);
  }

  private resolveCapabilityReferences(
    projectId: string,
    input: {
      canonicalFeatureId?: string;
      canonicalFeatureStableKey?: string;
      canonicalMapId?: string;
      canonicalMapStableKey?: string;
      canonicalFeatureVersion?: string;
      mapId?: string;
      mapStableKey?: string;
      featureId?: string;
      featureStableKey?: string;
      featureVersion?: string;
    },
    options: { requireMap: boolean }
  ): { canonicalFeature: FeatureRow; map: FeatureMapRow | null; feature: FeatureRow | null } {
    const canonicalMapId = this.resolveOptionalMapId(projectId, input.canonicalMapId, input.canonicalMapStableKey) ?? undefined;
    const canonicalFeature = input.canonicalFeatureId
      ? this.getFeature(input.canonicalFeatureId)
      : this.resolveFeatureByStableKey(projectId, input.canonicalFeatureStableKey ?? '', input.canonicalFeatureVersion, canonicalMapId);
    if (canonicalFeature.projectId !== projectId) {
      throw new ValidationError('canonical feature 不属于当前项目。');
    }

    const mapId = this.resolveOptionalMapId(projectId, input.mapId, input.mapStableKey);
    if (options.requireMap && !mapId) {
      throw new ValidationError('需要 mapId 或 mapStableKey。');
    }
    const map = mapId ? this.getMap(mapId) : null;
    let feature: FeatureRow | null = null;
    if (input.featureId) {
      feature = this.getFeature(input.featureId);
      if (feature.projectId !== projectId) {
        throw new ValidationError('feature 不属于当前项目。');
      }
      if (map && feature.mapId !== map.id) {
        throw new ValidationError('feature 与 mapId/mapStableKey 不一致。');
      }
    } else if (input.featureStableKey) {
      feature = this.resolveFeatureByStableKey(projectId, input.featureStableKey, input.featureVersion, map?.id);
    }
    return { canonicalFeature, map, feature };
  }

  private assertEvidenceIds(projectId: string, evidenceIds: string[]): void {
    for (const evidenceId of evidenceIds) {
      const evidence = this.getEvidence(evidenceId);
      if (evidence.projectId !== projectId) {
        throw new ValidationError(`证据不属于当前项目: ${evidenceId}`);
      }
    }
  }

  private writeFeatureDossier(data: ReturnType<typeof UpsertFeatureDossierSchema.parse>): FeatureDossierUpsertResult {
    const operations: FeatureDossierUpsertResult['operations'] = {
      maps: [],
      features: [],
      entryPoints: [],
      codeReferences: [],
      evidence: [],
      statuses: [],
      gaps: [],
      alignments: []
    };

    const canonicalMap = this.upsertMap(data.projectId, { ...data.canonicalMap, dryRun: false });
    operations.maps.push(canonicalMap);
    const canonicalFeature = this.upsertFeature(canonicalMap.data.id, { ...data.canonicalFeature, mapId: canonicalMap.data.id, dryRun: false });
    operations.features.push(canonicalFeature);

    for (const evidence of data.canonicalEvidence) {
      const { target: _target, ...evidenceInput } = evidence;
      operations.evidence.push(
        this.upsertEvidence(data.projectId, {
          ...evidenceInput,
          targetType: 'feature',
          targetId: canonicalFeature.data.id,
          dryRun: false
        })
      );
    }

    for (const slice of data.implementationSlices) {
      const map = this.upsertMap(data.projectId, { ...slice.map, dryRun: false });
      operations.maps.push(map);
      const feature = slice.feature ? this.upsertFeature(map.data.id, { ...slice.feature, mapId: map.data.id, dryRun: false }) : null;
      if (feature) {
        operations.features.push(feature);
      }

      const statusEvidenceIds: string[] = [];
      const deferredStatusEvidence: typeof slice.evidence = [];
      for (const evidence of slice.evidence) {
        if (evidence.target === 'status' || (evidence.target === 'implementation_feature' && !feature)) {
          deferredStatusEvidence.push(evidence);
          continue;
        }
        const { target, ...evidenceInput } = evidence;
        const targetId = target === 'canonical_feature' ? canonicalFeature.data.id : feature?.data.id ?? canonicalFeature.data.id;
        const evidenceResult = this.upsertEvidence(data.projectId, {
          ...evidenceInput,
          targetType: 'feature',
          targetId,
          dryRun: false
        });
        operations.evidence.push(evidenceResult);
        statusEvidenceIds.push(evidenceResult.data.id);
      }

      let status = this.upsertCapabilityStatus(data.projectId, {
        canonicalFeatureId: canonicalFeature.data.id,
        mapId: map.data.id,
        featureId: feature?.data.id,
        status: slice.status,
        summary: slice.summary,
        gaps: slice.gaps,
        recommendedAction: slice.recommendedAction,
        evidenceIds: statusEvidenceIds,
        dryRun: false
      });
      operations.statuses.push(status);

      if (deferredStatusEvidence.length > 0) {
        for (const evidence of deferredStatusEvidence) {
          const { target: _target, ...evidenceInput } = evidence;
          const evidenceResult = this.upsertEvidence(data.projectId, {
            ...evidenceInput,
            targetType: 'capability_status',
            targetId: status.data.id,
            dryRun: false
          });
          operations.evidence.push(evidenceResult);
          statusEvidenceIds.push(evidenceResult.data.id);
        }
        status = this.upsertCapabilityStatus(data.projectId, {
          canonicalFeatureId: canonicalFeature.data.id,
          mapId: map.data.id,
          featureId: feature?.data.id,
          status: slice.status,
          summary: slice.summary,
          gaps: slice.gaps,
          recommendedAction: slice.recommendedAction,
          evidenceIds: unique(statusEvidenceIds),
          dryRun: false
        });
        operations.statuses.push(status);
      }

      for (const entryPoint of slice.entryPoints) {
        operations.entryPoints.push(this.upsertEntryPoint(data.projectId, { ...entryPoint, mapId: map.data.id, dryRun: false }));
      }

      for (const reference of slice.codeReferences) {
        operations.codeReferences.push(
          this.upsertCodeReference(data.projectId, {
            ...reference,
            mapId: map.data.id,
            featureId: feature?.data.id,
            dryRun: false
          })
        );
      }

      if (slice.align && feature && feature.data.id !== canonicalFeature.data.id) {
        operations.alignments.push(
          this.upsertAlignment(data.projectId, {
            stableKey: slice.alignmentStableKey,
            name: `${canonicalFeature.data.name} -> ${feature.data.name}`,
            relation: slice.alignmentRelation,
            status: 'confirmed',
            members: [
              { targetType: 'feature', targetId: canonicalFeature.data.id, role: 'source' },
              { targetType: 'feature', targetId: feature.data.id, role: 'target' }
            ],
            dryRun: false
          })
        );
      }
    }

    for (const gap of data.gaps) {
      const { evidence: inlineEvidence, ...gapInput } = gap;
      const gapResult = this.upsertCapabilityGap(data.projectId, {
        ...gapInput,
        canonicalFeatureId: canonicalFeature.data.id,
        dryRun: false
      });
      operations.gaps.push(gapResult);
      if (inlineEvidence.length > 0) {
        const evidenceIds = [...gapResult.data.evidenceIds];
        for (const evidence of inlineEvidence) {
          const evidenceResult = this.upsertEvidence(data.projectId, {
            ...evidence,
            targetType: 'capability_gap',
            targetId: gapResult.data.id,
            dryRun: false
          });
          operations.evidence.push(evidenceResult);
          evidenceIds.push(evidenceResult.data.id);
        }
        operations.gaps.push(
          this.upsertCapabilityGap(data.projectId, {
            ...gapInput,
            canonicalFeatureId: canonicalFeature.data.id,
            evidenceIds: unique(evidenceIds),
            dryRun: false
          })
        );
      }
    }

    const dossier = this.featureDossier({ projectId: data.projectId, featureId: canonicalFeature.data.id });
    return {
      success: true,
      dryRun: false,
      rolledBack: false,
      operations,
      dossier
    };
  }

  private writeFeatureFocusStart(data: ReturnType<typeof StartFeatureFocusSchema.parse>): FeatureFocusStartResult {
    const map = this.upsertMap(data.projectId, { ...data.canonicalMap, dryRun: false });
    const feature = this.upsertFeature(map.data.id, { ...data.canonicalFeature, mapId: map.data.id, dryRun: false });
    const focus = this.upsertFeatureFocus(data.projectId, {
      ...data.focus,
      featureId: feature.data.id,
      title: data.focus.title ?? `深挖 ${feature.data.name}`,
      dryRun: false
    });
    const dossier = this.featureDossier({ projectId: data.projectId, featureId: feature.data.id });
    return {
      success: true,
      dryRun: false,
      rolledBack: false,
      map,
      feature,
      focus,
      dossier
    };
  }

  private canonicalFeatureForDossier(projectId: string, feature: FeatureRow): FeatureRow {
    const map = this.getMap(feature.mapId);
    if (map.axis === 'capability' || map.axis === 'product') {
      return feature;
    }

    const status = this.listCapabilityStatuses(projectId, {}).find((item) => item.featureId === feature.id);
    if (status?.canonicalFeature) {
      return status.canonicalFeature;
    }

    const alignments = this.findAlignmentsForTargets(projectId, new Set([`feature:${feature.id}`]));
    const alignedFeatures = uniqueById(
      alignments.flatMap((alignment) =>
        alignment.members
          .filter((member) => member.targetType === 'feature' && member.targetId !== feature.id)
          .map((member) => this.findFeatureById(member.targetId))
          .filter(isNonNull)
      )
    );
    const productFeature = alignedFeatures.find((item) => {
      const itemMap = this.findMapById(item.mapId);
      return itemMap?.axis === 'product' || itemMap?.axis === 'capability';
    });
    return productFeature ?? feature;
  }

  private findCapabilityStatusForUpsert(projectId: string, id: string | undefined, signature: string): CapabilityStatusRow | null {
    const matches = [
      id ? this.findCapabilityStatusById(id) : null,
      signature ? this.findCapabilityStatusBySignature(projectId, signature) : null
    ].filter((status): status is CapabilityStatusRow => Boolean(status));
    for (const status of matches) {
      if (status.projectId !== projectId) {
        throw new ValidationError('能力状态 ID 不属于当前项目。');
      }
    }
    const [first] = matches;
    if (first && matches.some((status) => status.id !== first.id)) {
      throw new ValidationError('能力状态 id 和签名指向不同对象，请先查询上下文确认。');
    }
    return first ?? null;
  }

  private findCapabilityGapForUpsert(projectId: string, id: string | undefined, stableKey: string | undefined, signature: string): CapabilityGapRow | null {
    const matches = [
      id ? this.findCapabilityGapById(id) : null,
      stableKey ? this.findCapabilityGapByStableKey(projectId, stableKey) : null,
      signature ? this.findCapabilityGapBySignature(projectId, signature) : null
    ].filter((gap): gap is CapabilityGapRow => Boolean(gap));
    for (const gap of matches) {
      if (gap.projectId !== projectId) {
        throw new ValidationError('能力缺口 ID 不属于当前项目。');
      }
    }
    const [first] = matches;
    if (first && matches.some((gap) => gap.id !== first.id)) {
      throw new ValidationError('能力缺口 id、stableKey 或签名指向不同对象，请先查询上下文确认。');
    }
    return first ?? null;
  }

  private findCapabilityStatusById(id: string): CapabilityStatusRow | null {
    const row = this.db.prepare('SELECT * FROM capability_statuses WHERE id = ?').get(id);
    return row ? this.enrichCapabilityStatus(mapCapabilityStatus(row)) : null;
  }

  private findCapabilityStatusBySignature(projectId: string, signature: string): CapabilityStatusRow | null {
    const row = this.db.prepare('SELECT * FROM capability_statuses WHERE project_id = ? AND signature = ?').get(projectId, signature);
    return row ? this.enrichCapabilityStatus(mapCapabilityStatus(row)) : null;
  }

  private findCapabilityGapById(id: string): CapabilityGapRow | null {
    const row = this.db.prepare('SELECT * FROM capability_gaps WHERE id = ?').get(id);
    return row ? this.enrichCapabilityGap(mapCapabilityGap(row)) : null;
  }

  private findCapabilityGapByStableKey(projectId: string, stableKey: string): CapabilityGapRow | null {
    const row = this.db.prepare('SELECT * FROM capability_gaps WHERE project_id = ? AND stable_key = ?').get(projectId, stableKey);
    return row ? this.enrichCapabilityGap(mapCapabilityGap(row)) : null;
  }

  private findCapabilityGapBySignature(projectId: string, signature: string): CapabilityGapRow | null {
    const row = this.db.prepare('SELECT * FROM capability_gaps WHERE project_id = ? AND signature = ?').get(projectId, signature);
    return row ? this.enrichCapabilityGap(mapCapabilityGap(row)) : null;
  }

  private listCapabilityStatuses(projectId: string, filters: { canonicalFeatureId?: string; mapId?: string }): CapabilityStatusRow[] {
    const where = ['project_id = ?'];
    const args: SQLInputValue[] = [projectId];
    if (filters.canonicalFeatureId) {
      where.push('canonical_feature_id = ?');
      args.push(filters.canonicalFeatureId);
    }
    if (filters.mapId) {
      where.push('map_id = ?');
      args.push(filters.mapId);
    }
    return this.db
      .prepare(`SELECT * FROM capability_statuses WHERE ${where.join(' AND ')} ORDER BY canonical_feature_id, map_id, feature_id`)
      .all(...args)
      .map((row) => this.enrichCapabilityStatus(mapCapabilityStatus(row)));
  }

  private listCapabilityGaps(projectId: string, filters: { canonicalFeatureId?: string; mapId?: string }): CapabilityGapRow[] {
    const where = ['project_id = ?'];
    const args: SQLInputValue[] = [projectId];
    if (filters.canonicalFeatureId) {
      where.push('canonical_feature_id = ?');
      args.push(filters.canonicalFeatureId);
    }
    if (filters.mapId) {
      where.push('(map_id = ? OR owner_map_id = ?)');
      args.push(filters.mapId, filters.mapId);
    }
    return this.db
      .prepare(`SELECT * FROM capability_gaps WHERE ${where.join(' AND ')} ORDER BY CASE severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, status, title`)
      .all(...args)
      .map((row) => this.enrichCapabilityGap(mapCapabilityGap(row)));
  }

  private enrichCapabilityStatus(status: CapabilityStatusRow): CapabilityStatusRow {
    return {
      ...status,
      canonicalFeature: this.findFeatureById(status.canonicalFeatureId) ?? undefined,
      map: this.findMapById(status.mapId) ?? undefined,
      feature: status.featureId ? this.findFeatureById(status.featureId) : null
    };
  }

  private enrichCapabilityGap(gap: CapabilityGapRow): CapabilityGapRow {
    return {
      ...gap,
      canonicalFeature: this.findFeatureById(gap.canonicalFeatureId) ?? undefined,
      map: gap.mapId ? this.findMapById(gap.mapId) : null,
      feature: gap.featureId ? this.findFeatureById(gap.featureId) : null,
      ownerMap: gap.ownerMapId ? this.findMapById(gap.ownerMapId) : null
    };
  }

  private resolveFeatureFocusFeature(
    projectId: string,
    input: {
      featureId?: string;
      featureStableKey?: string;
      mapId?: string;
      mapStableKey?: string;
      featureVersion?: string;
      version?: string;
    }
  ): FeatureRow {
    const mapId = input.mapId || input.mapStableKey ? this.resolveOptionalMapId(projectId, input.mapId, input.mapStableKey) ?? undefined : undefined;
    const feature = input.featureId ? this.getFeature(input.featureId) : this.resolveFeatureByStableKey(projectId, input.featureStableKey ?? '', input.featureVersion ?? input.version, mapId);
    if (feature.projectId !== projectId) {
      throw new ValidationError('功能不属于当前项目。');
    }
    return feature;
  }

  private resolveFocusedFeature(
    projectId: string,
    input: {
      focusId?: string;
      focusStableKey?: string;
      featureId?: string;
      featureStableKey?: string;
      mapId?: string;
      mapStableKey?: string;
      featureVersion?: string;
      version?: string;
    }
  ): { feature: FeatureRow; selectedFocus: FeatureFocusRow | null } {
    const mapId = input.mapId || input.mapStableKey ? this.resolveOptionalMapId(projectId, input.mapId, input.mapStableKey) ?? undefined : undefined;
    const focus = input.focusId ? this.getFeatureFocus(input.focusId) : input.focusStableKey ? this.findFeatureFocusByStableKey(projectId, input.focusStableKey) : null;
    if (input.focusStableKey && !focus) {
      throw new NotFoundError(`功能焦点不存在: ${input.focusStableKey}`);
    }
    if (focus && focus.projectId !== projectId) {
      throw new ValidationError('功能焦点不属于当前项目。');
    }
    const feature = focus
      ? this.getFeature(focus.featureId, true)
      : input.featureId
        ? this.getFeature(input.featureId, true)
        : this.resolveFeatureByStableKey(projectId, input.featureStableKey ?? '', input.featureVersion ?? input.version, mapId);
    if (feature.projectId !== projectId) {
      throw new ValidationError('功能不属于当前项目。');
    }
    if (mapId && feature.mapId !== mapId) {
      throw new ValidationError('功能不属于指定功能地图。');
    }
    if (input.featureId && feature.id !== input.featureId) {
      throw new ValidationError('focusId/focusStableKey 与 featureId 指向不同功能。');
    }
    if (input.featureStableKey && feature.stableKey !== input.featureStableKey) {
      throw new ValidationError('focusId/focusStableKey 与 featureStableKey 指向不同功能。');
    }
    return { feature, selectedFocus: focus ?? null };
  }

  private findFeatureFocusForUpsert(projectId: string, id: string | undefined, stableKey: string): FeatureFocusRow | null {
    const matches = [
      id ? this.findFeatureFocusById(id) : null,
      stableKey ? this.findFeatureFocusByStableKey(projectId, stableKey) : null
    ].filter((focus): focus is FeatureFocusRow => Boolean(focus));
    for (const focus of matches) {
      if (focus.projectId !== projectId) {
        throw new ValidationError('功能焦点 ID 不属于当前项目。');
      }
    }
    const [first] = matches;
    if (first && matches.some((focus) => focus.id !== first.id)) {
      throw new ValidationError('功能焦点 id 和 stableKey 指向不同对象，请先查询上下文确认。');
    }
    return first ?? null;
  }

  private findFeatureFocusById(id: string): FeatureFocusRow | null {
    const row = this.db.prepare('SELECT * FROM feature_focuses WHERE id = ?').get(id);
    return row ? this.enrichFeatureFocus(mapFeatureFocus(row)) : null;
  }

  private findFeatureFocusByStableKey(projectId: string, stableKey: string): FeatureFocusRow | null {
    const row = this.db.prepare('SELECT * FROM feature_focuses WHERE project_id = ? AND stable_key = ?').get(projectId, stableKey);
    return row ? this.enrichFeatureFocus(mapFeatureFocus(row)) : null;
  }

  private enrichFeatureFocus(focus: FeatureFocusRow): FeatureFocusRow {
    const feature = this.findFeatureById(focus.featureId) ?? undefined;
    return {
      ...focus,
      feature,
      map: feature ? this.findMapById(feature.mapId) ?? undefined : undefined,
      targetMaps: focus.targetMapIds.map((mapId) => this.findMapById(mapId)).filter(isNonNull),
      relatedFeatures: focus.relatedFeatureIds.map((featureId) => this.findFeatureById(featureId)).filter(isNonNull)
    };
  }

  private evidenceForIds(projectId: string, evidenceIds: string[]): EvidenceRow[] {
    if (evidenceIds.length === 0) return [];
    const placeholders = evidenceIds.map(() => '?').join(', ');
    return this.db
      .prepare(`SELECT * FROM evidence WHERE project_id = ? AND id IN (${placeholders}) ORDER BY source_priority DESC, updated_at DESC`)
      .all(projectId, ...evidenceIds)
      .map((row) => this.mapEvidenceWithLabel(row));
  }

  private codeReferencesForFeatures(projectId: string, featureIds: string[]): CodeReferenceRow[] {
    if (featureIds.length === 0) {
      return [];
    }
    const placeholders = featureIds.map(() => '?').join(', ');
    return this.db
      .prepare(`SELECT * FROM code_references WHERE project_id = ? AND feature_id IN (${placeholders}) ORDER BY path, symbol, kind`)
      .all(projectId, ...featureIds)
      .map(mapCodeReference);
  }

  private entryPointsForReferences(projectId: string, references: CodeReferenceRow[], fallbackMapId: string): EntryPointRow[] {
    const entryPointIds = unique(references.map((reference) => reference.entryPointId).filter(isString));
    const entriesById = entryPointIds.map((entryPointId) => this.findEntryPointById(entryPointId)).filter(isNonNull);
    const mapEntries = this.db
      .prepare('SELECT * FROM entry_points WHERE project_id = ? AND map_id = ? ORDER BY kind, path, name')
      .all(projectId, fallbackMapId)
      .map(mapEntryPoint);
    return uniqueById([...entriesById, ...mapEntries]);
  }

  private seedPathContexts(projectId: string, focuses: FeatureFocusRow[], include: Set<string>): QueryPathContextResult[] {
    const paths = unique(focuses.flatMap((focus) => focus.seedPaths)).slice(0, 12);
    return paths.map((path) =>
      this.queryPathContext({
        projectId,
        path,
        pathMode: 'exact',
        includeReferences: include.has('codeReferences'),
        includeAlignments: include.has('alignments')
      })
    );
  }

  private impactedFeatures(projectId: string, feature: FeatureRow, alignments: AlignmentRow[], depth: number): FeatureRow[] {
    const result = new Map<string, FeatureRow>([[feature.id, feature]]);
    const visit = (item: FeatureRow, remaining: number) => {
      if (remaining <= 0) return;
      if (item.parentFeatureId) {
        const parent = this.findFeatureById(item.parentFeatureId);
        if (parent && !result.has(parent.id)) {
          result.set(parent.id, parent);
          visit(parent, remaining - 1);
        }
      }
      const children = this.db.prepare('SELECT * FROM features WHERE project_id = ? AND parent_feature_id = ? ORDER BY sort_order, name').all(projectId, item.id).map(mapFeature);
      for (const child of children) {
        if (!result.has(child.id)) {
          result.set(child.id, child);
          visit(child, remaining - 1);
        }
      }
    };
    visit(feature, depth);
    for (const alignment of alignments) {
      for (const member of alignment.members) {
        if (member.targetType === 'feature') {
          const aligned = this.findFeatureById(member.targetId);
          if (aligned) result.set(aligned.id, aligned);
        }
      }
    }
    return [...result.values()];
  }

  private evidenceForTargets(projectId: string, targets: Set<string>): EvidenceRow[] {
    if (targets.size === 0) return [];
    return this.listEvidence(projectId).filter((item) => targets.has(`${item.targetType}:${item.targetId}`));
  }

  private qualityIssuesForFeature(
    projectId: string,
    feature: FeatureRow,
    details: FeatureDetailRow | null,
    references: CodeReferenceRow[],
    alignments: AlignmentRow[],
    evidence: EvidenceRow[],
    repoRoot: string | undefined
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const target = { targetType: 'feature', targetId: feature.id };
    if (references.length === 0) {
      issues.push({
        severity: feature.status === 'released' || feature.status === 'completed' ? 'error' : 'warning',
        code: 'FEATURE_WITHOUT_CODE_REFERENCE',
        ...target,
        message: `功能缺少代码引用: ${feature.name}`,
        hint: '为已实现功能补充 code reference；如果只是规划或文档，请补充 planned/doc_claim evidence。'
      });
    }
    if (alignments.length === 0) {
      issues.push({
        severity: 'info',
        code: 'FEATURE_WITHOUT_ALIGNMENT',
        ...target,
        message: `功能缺少对齐关系: ${feature.name}`,
        hint: '补充产品、前端、后端、SDK、测试或运维之间的 alignment，便于影响分析。'
      });
    }
    if (!evidence.some((item) => item.evidenceType === 'code_fact')) {
      issues.push({
        severity: feature.status === 'released' || feature.status === 'completed' ? 'error' : 'warning',
        code: 'FEATURE_WITHOUT_CODE_EVIDENCE',
        ...target,
        message: `功能缺少代码事实证据: ${feature.name}`,
        hint: '为真实能力补充 code_fact evidence；mock、文档或计划不要当作代码事实。'
      });
    }
    if (feature.status === 'draft' && (!details?.intent || !details.scope || details.knownGaps.length === 0)) {
      issues.push({
        severity: 'warning',
        code: 'DRAFT_DETAIL_GAP',
        ...target,
        message: `草稿功能缺少 intent/scope/knownGaps: ${feature.name}`,
        hint: '草稿功能至少说明目标、范围和已知缺口。'
      });
    }
    if (feature.status === 'in_progress' && (!details?.currentBehavior || !details.expectedBehavior || details.acceptanceCriteria.length === 0)) {
      issues.push({
        severity: 'warning',
        code: 'IN_PROGRESS_DETAIL_GAP',
        ...target,
        message: `进行中功能缺少 currentBehavior/expectedBehavior/acceptanceCriteria: ${feature.name}`,
        hint: '进行中功能需要说明当前做到哪里、目标行为和验收条件。'
      });
    }
    if (feature.status === 'blocked' && (!details?.blocker || details.openQuestions.length === 0)) {
      issues.push({
        severity: 'warning',
        code: 'BLOCKED_DETAIL_GAP',
        ...target,
        message: `阻塞功能缺少 blocker/openQuestions: ${feature.name}`,
        hint: '阻塞功能需要说明阻塞原因和未确认问题。'
      });
    }
    if (feature.status === 'deprecated' && (!details?.replacement || !details.deprecatedReason)) {
      issues.push({
        severity: 'warning',
        code: 'DEPRECATED_DETAIL_GAP',
        ...target,
        message: `废弃功能缺少 replacement/deprecatedReason: ${feature.name}`,
        hint: '废弃功能需要说明替代方案和废弃原因。'
      });
    }
    if ((feature.status === 'mock_only' || evidence.some((item) => item.evidenceType === 'mock_only')) && !details?.mockBoundary) {
      issues.push({
        severity: 'warning',
        code: 'MOCK_BOUNDARY_GAP',
        ...target,
        message: `Mock 功能缺少边界说明: ${feature.name}`,
        hint: '明确 mock/原型不能当作真实能力的边界。'
      });
    }
    if (repoRoot) {
      for (const reference of references) {
        if (!fs.existsSync(path.resolve(repoRoot, reference.path))) {
          issues.push({
            severity: 'warning',
            code: 'CODE_REFERENCE_PATH_MISSING',
            targetType: 'code_reference',
            targetId: reference.id,
            message: `代码引用路径不存在: ${reference.path}`,
            hint: '确认 repoRoot 是否正确，或重新扫描删除/更新失效路径。'
          });
        }
      }
    }
    return issues;
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
      return { success: errors.length === 0, dryRun, rolledBack: false, summary: batchSummary(results, errors), results, errors };
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
      summary: batchSummary(results, errors),
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

  private queryFeatures(query: ParsedQueryContext, limit: number, offset: number, includeDetails = false): FeatureRow[] {
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
      .map((row) => this.attachFeatureDetails(mapFeature(row), includeDetails));
  }

  private countFeatures(query: ParsedQueryContext): number {
    const { where, args } = this.featureQueryParts(query);
    return scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM features f WHERE ${where.join(' AND ')}`).get(...args));
  }

  private queryFeatureFocuses(query: ParsedQueryContext, limit: number, offset: number): FeatureFocusRow[] {
    const { where, args } = this.featureFocusQueryParts(query);
    return this.db
      .prepare(
        `SELECT ff.*
         FROM feature_focuses ff
         JOIN features f ON f.id = ff.feature_id
         WHERE ${where.join(' AND ')}
         ORDER BY CASE ff.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
                  CASE ff.status WHEN 'in_progress' THEN 0 WHEN 'open' THEN 1 WHEN 'ready_for_implementation' THEN 2 ELSE 3 END,
                  ff.updated_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...args, limit, offset)
      .map((row) => this.enrichFeatureFocus(mapFeatureFocus(row)));
  }

  private countFeatureFocuses(query: ParsedQueryContext): number {
    const { where, args } = this.featureFocusQueryParts(query);
    return scalarCount(
      this.db
        .prepare(
          `SELECT COUNT(*) AS count
           FROM feature_focuses ff
           JOIN features f ON f.id = ff.feature_id
           WHERE ${where.join(' AND ')}`
        )
        .get(...args)
    );
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

  private queryEvidence(query: ParsedQueryContext, limit: number, offset: number): EvidenceRow[] {
    const { where, args } = this.evidenceQueryParts(query);
    return this.db
      .prepare(`SELECT e.* FROM evidence e WHERE ${where.join(' AND ')} ORDER BY e.updated_at DESC LIMIT ? OFFSET ?`)
      .all(...args, limit, offset)
      .map((row) => this.mapEvidenceWithLabel(row));
  }

  private countEvidence(query: ParsedQueryContext): number {
    const { where, args } = this.evidenceQueryParts(query);
    return scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM evidence e WHERE ${where.join(' AND ')}`).get(...args));
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

  private queryFeatureSearchRows(query: ParsedSearchFeatures, mapId: string | undefined, fetchLimit: number): unknown[] {
    const where = ['f.project_id = ?'];
    const args: SQLInputValue[] = [query.projectId];
    if (mapId) {
      where.push('f.map_id = ?');
      args.push(mapId);
    }
    if (query.axes?.length) {
      where.push(`m.axis IN (${query.axes.map(() => '?').join(', ')})`);
      args.push(...query.axes);
    }
    if (query.statuses?.length) {
      where.push(`f.status IN (${query.statuses.map(() => '?').join(', ')})`);
      args.push(...query.statuses);
    } else if (!query.includeArchived) {
      where.push("f.status NOT IN ('archived', 'deprecated')");
      where.push("m.status NOT IN ('archived', 'deprecated')");
    }
    appendSearchExpressionsClause(
      where,
      args,
      [
        'f.id',
        'f.stable_key',
        'f.name',
        'f.version',
        'f.status',
        'f.kind',
        'f.description',
        'm.stable_key',
        'm.name',
        'm.axis',
        'm.scope',
        'm.kind',
        'm.description',
        'fd.intent',
        'fd.current_behavior',
        'fd.expected_behavior',
        'fd.scope',
        'fd.known_gaps_json',
        'fd.open_questions_json',
        'fd.acceptance_criteria_json',
        'fd.risks_json',
        'fd.details_markdown'
      ],
      query.query
    );
    if (query.path) {
      where.push("EXISTS (SELECT 1 FROM code_references cr WHERE cr.feature_id = f.id AND LOWER(cr.path) LIKE ? ESCAPE '\\')");
      args.push(pathPattern(query.path, query.pathMode));
    }
    return this.db
      .prepare(
        `SELECT f.*
         FROM features f
         JOIN maps m ON m.id = f.map_id
         LEFT JOIN feature_details fd ON fd.feature_id = f.id
         WHERE ${where.join(' AND ')}
         ORDER BY
           CASE m.axis WHEN 'product' THEN 0 WHEN 'capability' THEN 1 WHEN 'web' THEN 2 WHEN 'backend' THEN 3 WHEN 'sdk' THEN 4 WHEN 'ops' THEN 5 ELSE 6 END,
           f.updated_at DESC,
           f.name
         LIMIT ?`
      )
      .all(...args, Math.min(fetchLimit, 400));
  }

  private featureSearchCandidateForFeature(projectId: string, feature: FeatureRow, score: number, reasons: string[]): FeatureSearchCandidate {
    const featureMap = this.getMap(feature.mapId);
    const references = this.codeReferencesForFeatures(projectId, [feature.id]);
    const openFocuses = this.listFeatureFocuses({ projectId, featureId: feature.id, limit: 5 }).filter((focus) => !['implemented', 'closed', 'archived'].includes(focus.status)).slice(0, 3);
    const openGaps = this.openGapsForFeature(projectId, feature.id).slice(0, 3);
    const alignments = this.findAlignmentsForTargets(projectId, new Set([`feature:${feature.id}`, ...references.map((reference) => `code_reference:${reference.id}`)]));
    return {
      feature,
      map: featureMap,
      score,
      reasons,
      openFocuses,
      codeReferenceCount: references.length,
      matchingCodeReferences: references.slice(0, 3),
      gapCount: openGaps.length,
      openGaps,
      alignmentCount: alignments.length,
      nextAction: featureSearchNextAction(openFocuses, references.slice(0, 3), openGaps)
    };
  }

  private openGapsForFeature(projectId: string, featureId: string): CapabilityGapRow[] {
    return this.db
      .prepare(
        `SELECT * FROM capability_gaps
         WHERE project_id = ? AND status = 'open' AND (canonical_feature_id = ? OR feature_id = ?)
         ORDER BY CASE severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, title`
      )
      .all(projectId, featureId, featureId)
      .map((row) => this.enrichCapabilityGap(mapCapabilityGap(row)));
  }

  private suggestFeatureSearchStart(projectId: string, query: string, topCandidate: FeatureSearchCandidate | undefined): FeatureSearchResult['suggestedStart'] {
    const preferredMap = this.listMaps(projectId).find((map) => map.axis === 'product' || map.axis === 'capability') ?? this.listMaps(projectId)[0];
    const featureName = query || topCandidate?.feature.name || '新功能';
    return {
      canonicalMapStableKey: preferredMap?.stableKey ?? 'product.focus',
      canonicalFeatureStableKey: stableKeyFromSearchQuery(featureName),
      featureName,
      reason: topCandidate ? `最高候选分数 ${topCandidate.score}，建议确认后启动新焦点或选择候选。` : '没有找到可信候选，建议直接从该功能点启动焦点。'
    };
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

  private featureFocusQueryParts(query: ParsedQueryContext): QueryParts {
    const where = ['1=1'];
    const args: SQLInputValue[] = [];
    if (query.projectId) {
      where.push('ff.project_id = ?');
      args.push(query.projectId);
    }
    if (query.mapId) {
      where.push('f.map_id = ?');
      args.push(query.mapId);
    }
    if (query.stableKey) {
      where.push('ff.stable_key = ?');
      args.push(query.stableKey);
    }
    if (query.alignmentId) {
      where.push(
        `EXISTS (
          SELECT 1 FROM alignment_members am
          WHERE am.alignment_id = ? AND am.target_type = 'feature' AND am.target_id = ff.feature_id
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
      where.push('EXISTS (SELECT 1 FROM code_references cr WHERE cr.feature_id = ff.feature_id AND cr.entry_point_id = ?)');
      args.push(query.entryPointId);
    }
    if (query.codeReferenceId) {
      where.push('EXISTS (SELECT 1 FROM code_references cr WHERE cr.id = ? AND cr.feature_id = ff.feature_id)');
      args.push(query.codeReferenceId);
    }
    if (query.path) {
      where.push('EXISTS (SELECT 1 FROM code_references cr WHERE cr.feature_id = ff.feature_id AND LOWER(cr.path) LIKE ? ESCAPE \'\\\')');
      args.push(pathPattern(query.path, query.pathMode));
    }
    appendKeywordClause(where, args, 'ff', ['id', 'stable_key', 'title', 'mode', 'status', 'priority', 'source_type', 'question', 'scope', 'findings'], query.keyword);
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

  private evidenceQueryParts(query: ParsedQueryContext): QueryParts {
    const where = ['1=1'];
    const args: SQLInputValue[] = [];
    if (query.projectId) {
      where.push('e.project_id = ?');
      args.push(query.projectId);
    }
    if (query.mapId) {
      where.push(
        `(
          (e.target_type = 'map' AND e.target_id = ?)
          OR (e.target_type = 'feature' AND e.target_id IN (SELECT id FROM features WHERE map_id = ?))
          OR (e.target_type = 'entry_point' AND e.target_id IN (SELECT id FROM entry_points WHERE map_id = ?))
          OR (e.target_type = 'code_reference' AND e.target_id IN (SELECT id FROM code_references WHERE map_id = ?))
          OR (e.target_type = 'alignment' AND e.target_id IN (
            SELECT a.id
            FROM alignments a
            JOIN alignment_members am ON am.alignment_id = a.id
            LEFT JOIN features f ON am.target_type = 'feature' AND f.id = am.target_id
            LEFT JOIN entry_points ep ON am.target_type = 'entry_point' AND ep.id = am.target_id
            LEFT JOIN code_references cr ON am.target_type = 'code_reference' AND cr.id = am.target_id
            WHERE (am.target_type = 'map' AND am.target_id = ?)
              OR (am.target_type = 'feature' AND f.map_id = ?)
              OR (am.target_type = 'entry_point' AND ep.map_id = ?)
              OR (am.target_type = 'code_reference' AND cr.map_id = ?)
          ))
        )`
      );
      args.push(query.mapId, query.mapId, query.mapId, query.mapId, query.mapId, query.mapId, query.mapId, query.mapId);
    }
    if (query.stableKey) {
      where.push(
        `(
          (e.target_type = 'map' AND e.target_id IN (SELECT id FROM maps WHERE stable_key = ?))
          OR (e.target_type = 'feature' AND e.target_id IN (SELECT id FROM features WHERE stable_key = ?))
          OR (e.target_type = 'entry_point' AND e.target_id IN (SELECT id FROM entry_points WHERE stable_key = ?))
          OR (e.target_type = 'code_reference' AND e.target_id IN (SELECT id FROM code_references WHERE stable_key = ?))
          OR (e.target_type = 'alignment' AND e.target_id IN (SELECT id FROM alignments WHERE stable_key = ?))
        )`
      );
      args.push(query.stableKey, query.stableKey, query.stableKey, query.stableKey, query.stableKey);
    }
    if (query.alignmentId) {
      where.push("((e.target_type = 'alignment' AND e.target_id = ?) OR EXISTS (SELECT 1 FROM alignment_members am WHERE am.alignment_id = ? AND e.target_type = am.target_type AND e.target_id = am.target_id))");
      args.push(query.alignmentId, query.alignmentId);
    }
    if (query.parentFeatureId === null) {
      where.push(
        `(
          (e.target_type = 'feature' AND e.target_id IN (SELECT id FROM features WHERE parent_feature_id IS NULL))
          OR (e.target_type = 'code_reference' AND e.target_id IN (
            SELECT cr.id FROM code_references cr JOIN features f ON f.id = cr.feature_id WHERE f.parent_feature_id IS NULL
          ))
        )`
      );
    } else if (query.parentFeatureId) {
      where.push(
        `(
          (e.target_type = 'feature' AND e.target_id IN (SELECT id FROM features WHERE parent_feature_id = ?))
          OR (e.target_type = 'code_reference' AND e.target_id IN (
            SELECT cr.id FROM code_references cr JOIN features f ON f.id = cr.feature_id WHERE f.parent_feature_id = ?
          ))
        )`
      );
      args.push(query.parentFeatureId, query.parentFeatureId);
    }
    if (query.entryPointId) {
      where.push("((e.target_type = 'entry_point' AND e.target_id = ?) OR (e.target_type = 'code_reference' AND e.target_id IN (SELECT id FROM code_references WHERE entry_point_id = ?)))");
      args.push(query.entryPointId, query.entryPointId);
    }
    if (query.codeReferenceId) {
      where.push("e.target_type = 'code_reference' AND e.target_id = ?");
      args.push(query.codeReferenceId);
    }
    if (query.path) {
      where.push('LOWER(e.path) LIKE ? ESCAPE \'\\\'');
      args.push(pathPattern(query.path, query.pathMode));
    }
    appendKeywordClause(where, args, 'e', ['id', 'target_type', 'target_id', 'evidence_type', 'path', 'symbol', 'summary', 'commit_sha'], query.keyword);
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
      evidenceCount: scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM evidence ${projectWhere}`).get(...projectArgs)),
      entryPointCount: scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM entry_points ${projectWhere}`).get(...projectArgs)),
      codeReferenceCount: scalarCount(this.db.prepare(`SELECT COUNT(*) AS count FROM code_references ${projectWhere}`).get(...projectArgs)),
      featureFocusCount: projectId ? this.featureFocusCount(projectId) : scalarCount(this.db.prepare('SELECT COUNT(*) AS count FROM feature_focuses').get()),
      openFeatureFocusCount: projectId ? this.openFeatureFocusCount(projectId) : scalarCount(this.db.prepare("SELECT COUNT(*) AS count FROM feature_focuses WHERE status NOT IN ('implemented', 'closed', 'archived')").get()),
      latestFeatureFocus: projectId ? this.latestFeatureFocus(projectId) : null,
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
               UNION ALL SELECT fd.updated_at FROM feature_details fd JOIN features f ON f.id = fd.feature_id WHERE f.project_id = ?
               UNION ALL SELECT updated_at FROM entry_points WHERE project_id = ?
               UNION ALL SELECT updated_at FROM code_references WHERE project_id = ?
               UNION ALL SELECT updated_at FROM evidence WHERE project_id = ?
               UNION ALL SELECT updated_at FROM alignments WHERE project_id = ?
               UNION ALL SELECT updated_at FROM feature_focuses WHERE project_id = ?
               UNION ALL SELECT updated_at FROM scan_runs WHERE project_id = ?
             )`
          )
          .get(projectId, projectId, projectId, projectId, projectId, projectId, projectId, projectId, projectId, projectId) as { updated_at: string | null })
      : (this.db
          .prepare(
            `SELECT MAX(updated_at) AS updated_at
             FROM (
               SELECT updated_at FROM projects
               UNION ALL SELECT updated_at FROM maps
               UNION ALL SELECT updated_at FROM features
               UNION ALL SELECT updated_at FROM feature_details
               UNION ALL SELECT updated_at FROM entry_points
               UNION ALL SELECT updated_at FROM code_references
               UNION ALL SELECT updated_at FROM evidence
               UNION ALL SELECT updated_at FROM alignments
               UNION ALL SELECT updated_at FROM feature_focuses
               UNION ALL SELECT updated_at FROM scan_runs
             )`
          )
          .get() as { updated_at: string | null });
    return rows.updated_at;
  }

  private featureFocusCount(projectId: string): number {
    return scalarCount(this.db.prepare('SELECT COUNT(*) AS count FROM feature_focuses WHERE project_id = ?').get(projectId));
  }

  private openFeatureFocusCount(projectId: string): number {
    return scalarCount(this.db.prepare("SELECT COUNT(*) AS count FROM feature_focuses WHERE project_id = ? AND status NOT IN ('implemented', 'closed', 'archived')").get(projectId));
  }

  private latestFeatureFocus(projectId: string): FeatureFocusRow | null {
    const row = this.db.prepare('SELECT * FROM feature_focuses WHERE project_id = ? ORDER BY updated_at DESC LIMIT 1').get(projectId);
    return row ? this.enrichFeatureFocus(mapFeatureFocus(row)) : null;
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
    if (item.type === 'feature_focus') {
      if (item.id) {
        const focus = this.getFeatureFocus(item.id);
        if (focus.projectId !== projectId) throw new ValidationError('功能焦点不属于当前项目。');
        return { id: focus.id };
      }
      if (!item.stableKey) return null;
      const focus = this.findFeatureFocusByStableKey(projectId, item.stableKey);
      return focus ? { id: focus.id, candidates: [featureFocusCandidate(focus)] } : null;
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

class DryRunRollbackError extends Error {}

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

function mapFeatureDetail(row: unknown): FeatureDetailRow {
  const value = row as Record<string, unknown>;
  return {
    featureId: String(value.feature_id),
    intent: String(value.intent ?? ''),
    currentBehavior: String(value.current_behavior ?? ''),
    expectedBehavior: String(value.expected_behavior ?? ''),
    scope: String(value.scope ?? ''),
    knownGaps: parseStringArray(value.known_gaps_json),
    openQuestions: parseStringArray(value.open_questions_json),
    acceptanceCriteria: parseStringArray(value.acceptance_criteria_json),
    risks: parseStringArray(value.risks_json),
    blocker: String(value.blocker ?? ''),
    replacement: String(value.replacement ?? ''),
    deprecatedReason: String(value.deprecated_reason ?? ''),
    mockBoundary: String(value.mock_boundary ?? ''),
    detailsMarkdown: String(value.details_markdown ?? ''),
    lastVerifiedAt: String(value.last_verified_at ?? ''),
    lastVerifiedCommit: String(value.last_verified_commit ?? ''),
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
    roleInFeature: String(value.role_in_feature ?? ''),
    changeGuidance: String(value.change_guidance ?? ''),
    verificationHint: String(value.verification_hint ?? ''),
    blastRadius: String(value.blast_radius ?? ''),
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

function mapEvidence(row: unknown): EvidenceRow {
  const value = row as Record<string, unknown>;
  return {
    id: String(value.id),
    projectId: String(value.project_id),
    targetType: String(value.target_type),
    targetId: String(value.target_id),
    evidenceType: String(value.evidence_type),
    signature: String(value.signature),
    path: String(value.path ?? ''),
    symbol: String(value.symbol ?? ''),
    lineStart: nullableNumber(value.line_start),
    lineEnd: nullableNumber(value.line_end),
    summary: String(value.summary ?? ''),
    confidence: Number(value.confidence ?? 1),
    sourceType: String(value.source_type ?? 'runtime_code'),
    sourcePriority: Number(value.source_priority ?? 80),
    commitSha: String(value.commit_sha ?? ''),
    verifiedAt: String(value.verified_at ?? ''),
    metadata: parseJson(value.metadata_json),
    createdAt: String(value.created_at),
    updatedAt: String(value.updated_at)
  };
}

function mapCapabilityStatus(row: unknown): CapabilityStatusRow {
  const value = row as Record<string, unknown>;
  return {
    id: String(value.id),
    projectId: String(value.project_id),
    canonicalFeatureId: String(value.canonical_feature_id),
    mapId: String(value.map_id),
    featureId: value.feature_id ? String(value.feature_id) : null,
    signature: String(value.signature),
    status: String(value.status),
    summary: String(value.summary ?? ''),
    gaps: parseStringArray(value.gaps_json),
    recommendedAction: String(value.recommended_action ?? ''),
    evidenceIds: parseStringArray(value.evidence_ids_json),
    metadata: parseJson(value.metadata_json),
    createdAt: String(value.created_at),
    updatedAt: String(value.updated_at)
  };
}

function mapCapabilityGap(row: unknown): CapabilityGapRow {
  const value = row as Record<string, unknown>;
  return {
    id: String(value.id),
    projectId: String(value.project_id),
    stableKey: String(value.stable_key ?? ''),
    signature: String(value.signature),
    canonicalFeatureId: String(value.canonical_feature_id),
    mapId: value.map_id ? String(value.map_id) : null,
    featureId: value.feature_id ? String(value.feature_id) : null,
    gapType: String(value.gap_type),
    severity: String(value.severity) as 'high' | 'medium' | 'low',
    status: String(value.status),
    title: String(value.title),
    description: String(value.description ?? ''),
    evidenceIds: parseStringArray(value.evidence_ids_json),
    recommendedAction: String(value.recommended_action ?? ''),
    ownerMapId: value.owner_map_id ? String(value.owner_map_id) : null,
    metadata: parseJson(value.metadata_json),
    createdAt: String(value.created_at),
    updatedAt: String(value.updated_at)
  };
}

function mapFeatureFocus(row: unknown): FeatureFocusRow {
  const value = row as Record<string, unknown>;
  return {
    id: String(value.id),
    projectId: String(value.project_id),
    stableKey: String(value.stable_key ?? ''),
    featureId: String(value.feature_id),
    title: String(value.title),
    mode: String(value.mode),
    status: String(value.status),
    priority: String(value.priority),
    sourceType: String(value.source_type),
    question: String(value.question ?? ''),
    scope: String(value.scope ?? ''),
    sourceRefs: parseStringArray(value.source_refs_json),
    seedPaths: parseStringArray(value.seed_paths_json),
    targetMapIds: parseStringArray(value.target_map_ids_json),
    relatedFeatureIds: parseStringArray(value.related_feature_ids_json),
    nextSteps: parseStringArray(value.next_steps_json),
    findings: String(value.findings ?? ''),
    confidence: Number(value.confidence ?? 0.5),
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

function capabilityStatusSignature(canonicalFeatureId: string, mapId: string, featureId: string | null): string {
  return [canonicalFeatureId, mapId, featureId ?? ''].join('|');
}

function capabilityGapSignature(canonicalFeatureId: string, mapId: string | null, featureId: string | null, gapType: string, title: string): string {
  return [canonicalFeatureId, mapId ?? '', featureId ?? '', gapType, title.trim().toLowerCase()].join('|');
}

function featureFocusStableKey(feature: FeatureRow, title: string): string {
  const suffix = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 80);
  return [`focus`, feature.stableKey, suffix || 'analysis'].join('.').slice(0, 180).replace(/\.+$/u, '');
}

function programmingNextActions(featureId: string, focuses: FeatureFocusRow[], gaps: CapabilityGapRow[], qualityIssues: QualityIssue[], verification: string[]): ProgrammingNextAction[] {
  const actions: ProgrammingNextAction[] = [];
  const activeFocuses = focuses.filter((focus) => !['implemented', 'closed', 'archived'].includes(focus.status));
  for (const focus of activeFocuses) {
    for (const step of focus.nextSteps.slice(0, 5)) {
      actions.push({
        priority: focus.priority === 'high' ? 'high' : focus.priority === 'low' ? 'low' : 'medium',
        source: 'focus',
        title: step,
        detail: focus.question || focus.title,
        targetType: 'feature_focus',
        targetId: focus.id
      });
    }
    for (const seedPath of focus.seedPaths.slice(0, 4)) {
      actions.push({
        priority: focus.priority === 'low' ? 'medium' : 'high',
        source: 'seed_path',
        title: `读取 ${seedPath}`,
        detail: focus.title,
        targetType: 'feature_focus',
        targetId: focus.id
      });
    }
  }
  for (const gap of gaps.filter((item) => item.status === 'open').slice(0, 5)) {
    actions.push({
      priority: gap.severity === 'high' ? 'high' : gap.severity === 'low' ? 'low' : 'medium',
      source: 'gap',
      title: gap.recommendedAction || gap.title,
      detail: gap.description || gap.title,
      targetType: 'capability_gap',
      targetId: gap.id
    });
  }
  for (const issue of qualityIssues.slice(0, 5)) {
    actions.push({
      priority: issue.severity === 'error' ? 'high' : issue.severity === 'info' ? 'low' : 'medium',
      source: 'quality',
      title: issue.message,
      detail: issue.hint,
      targetType: issue.targetType,
      targetId: issue.targetId
    });
  }
  for (const item of verification.slice(0, 3)) {
    actions.push({
      priority: 'medium',
      source: 'verification',
      title: item,
      detail: '修改后执行该验证线索。',
      targetType: 'feature',
      targetId: featureId
    });
  }
  return actions.sort((left, right) => actionPriorityRank(left.priority) - actionPriorityRank(right.priority)).slice(0, 12);
}

function actionPriorityRank(priority: ProgrammingNextAction['priority']): number {
  if (priority === 'high') return 0;
  if (priority === 'medium') return 1;
  return 2;
}

function scoreFeatureSearchCandidate(
  feature: FeatureRow,
  featureMap: FeatureMapRow,
  matchingCodeReferences: CodeReferenceRow[],
  openFocuses: FeatureFocusRow[],
  openGaps: CapabilityGapRow[],
  query: string,
  terms: string[],
  pathValue: string,
  pathMode: string
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const normalizedQuery = query.toLowerCase();
  const featureStableKey = feature.stableKey.toLowerCase();
  const featureName = feature.name.toLowerCase();
  const detailText = featureSearchText(feature, featureMap);
  if (normalizedQuery) {
    if (featureStableKey === normalizedQuery) {
      score += 100;
      reasons.push('stableKey 精确匹配');
    }
    if (featureName === normalizedQuery) {
      score += 90;
      reasons.push('功能名称精确匹配');
    }
    if (featureStableKey.includes(normalizedQuery) && featureStableKey !== normalizedQuery) {
      score += 64;
      reasons.push('stableKey 包含查询');
    }
    if (featureName.includes(normalizedQuery) && featureName !== normalizedQuery) {
      score += 56;
      reasons.push('功能名称包含查询');
    }
    if (feature.description.toLowerCase().includes(normalizedQuery) || detailText.includes(normalizedQuery)) {
      score += 28;
      reasons.push('功能说明或详情命中');
    }
    if (featureMap.stableKey.toLowerCase().includes(normalizedQuery) || featureMap.name.toLowerCase().includes(normalizedQuery)) {
      score += 18;
      reasons.push('所在功能地图命中');
    }
    const termHits = terms.filter((term) => detailText.includes(term));
    if (termHits.length > 1) {
      score += Math.min(termHits.length * 6, 30);
      reasons.push(`命中 ${termHits.length} 个查询片段`);
    }
  }
  if (pathValue && matchingCodeReferences.some((reference) => pathMatches(reference.path, pathValue, pathMode))) {
    score += 70;
    reasons.push('代码路径命中');
  } else if (matchingCodeReferences.length > 0) {
    score += 20;
    reasons.push('相关代码引用命中');
  }
  if (featureMap.axis === 'product' || featureMap.axis === 'capability') {
    score += 10;
    reasons.push('产品/能力视角候选');
  }
  if (openFocuses.length > 0) {
    score += 8;
    reasons.push('已有进行中的功能焦点');
  }
  if (openGaps.length > 0) {
    score += 5;
    reasons.push('存在开放缺口');
  }
  return { score, reasons: unique(reasons) };
}

function featureSearchText(feature: FeatureRow, featureMap: FeatureMapRow): string {
  const details = feature.details;
  return [
    feature.id,
    feature.stableKey,
    feature.name,
    feature.version,
    feature.status,
    feature.kind,
    feature.description,
    feature.tags.join(' '),
    featureMap.stableKey,
    featureMap.name,
    featureMap.axis,
    featureMap.scope,
    featureMap.kind,
    featureMap.description,
    details?.intent,
    details?.currentBehavior,
    details?.expectedBehavior,
    details?.scope,
    ...(details?.knownGaps ?? []),
    ...(details?.openQuestions ?? []),
    ...(details?.acceptanceCriteria ?? []),
    ...(details?.risks ?? []),
    details?.detailsMarkdown
  ]
    .filter(isString)
    .join(' ')
    .toLowerCase();
}

function codeReferenceMatchesSearch(reference: CodeReferenceRow, query: string, terms: string[], pathValue: string, pathMode: string): boolean {
  if (pathValue && pathMatches(reference.path, pathValue, pathMode)) {
    return true;
  }
  const normalizedQuery = query.toLowerCase();
  if (!normalizedQuery) return false;
  const text = [reference.stableKey, reference.path, reference.symbol, reference.kind, reference.description, reference.roleInFeature, reference.changeGuidance, reference.verificationHint, reference.blastRadius]
    .join(' ')
    .toLowerCase();
  return text.includes(normalizedQuery) || terms.some((term) => text.includes(term));
}

function featureSearchNextAction(openFocuses: FeatureFocusRow[], matchingCodeReferences: CodeReferenceRow[], openGaps: CapabilityGapRow[]): string {
  const focus = openFocuses[0];
  if (focus) {
    return `继续焦点：${focus.title}${focus.nextSteps[0] ? `，下一步 ${focus.nextSteps[0]}` : ''}`;
  }
  const reference = matchingCodeReferences[0];
  if (reference) {
    return `先读代码引用：${reference.path}${reference.symbol ? ` / ${reference.symbol}` : ''}`;
  }
  const gap = openGaps[0];
  if (gap) {
    return `先处理缺口：${gap.recommendedAction || gap.title}`;
  }
  return '读取功能档案；如果目标不明确，先启动一个功能焦点。';
}

function preparedFeatureNextSteps(candidate: FeatureSearchCandidate, dossier: FeatureDossierResult, programmingContext: ProgrammingContextResult, selectedFocus: FeatureFocusRow | null): string[] {
  const focus = selectedFocus ?? candidate.openFocuses[0] ?? null;
  const steps = [
    focus ? `继续功能焦点：${focus.title}${focus.nextSteps[0] ? `，下一步：${focus.nextSteps[0]}` : ''}` : '如本次目标还不清晰，先用 functree_upsert_feature_focus 记录问题、范围和 seedPaths。',
    programmingContext.nextActions[0] ? `优先行动：${programmingContext.nextActions[0].title}` : '',
    programmingContext.requiredEntryPoints[0] ? `先读入口：${programmingContext.requiredEntryPoints[0].path}` : '',
    programmingContext.keyCodeReferences[0] ? `再读关键代码：${programmingContext.keyCodeReferences[0].path}${programmingContext.keyCodeReferences[0].symbol ? ` / ${programmingContext.keyCodeReferences[0].symbol}` : ''}` : '',
    dossier.summary.openGapCount > 0 ? `确认 ${dossier.summary.openGapCount} 个开放缺口，避免把 mock/规划当成真实能力。` : '',
    '改动或分析完成后，用 functree_upsert_feature_dossier 写回证据、代码引用、状态矩阵和缺口，再调用 functree_get_feature_readiness 复核。'
  ].filter(Boolean);
  return unique(steps).slice(0, 8);
}

function preparedFeatureFallbackSteps(candidate: FeatureSearchCandidate | null, suggestedStart: FeatureSearchResult['suggestedStart']): string[] {
  if (candidate) {
    return [
      `候选不够确定：${candidate.feature.name} / ${candidate.map.stableKey} / score ${candidate.score}`,
      '先人工确认候选是否就是目标功能；确认后用 featureId 调用 functree_prepare_feature_work。',
      suggestedStart ? `如果不是已有功能，用 functree_start_feature_focus 启动：${suggestedStart.canonicalFeatureStableKey}` : ''
    ].filter(Boolean);
  }
  return [
    suggestedStart ? `没有可信候选；可用 functree_start_feature_focus 启动：${suggestedStart.canonicalFeatureStableKey}` : '没有可信候选；请补充功能名、stableKey 或代码路径后重试。',
    '启动焦点后，再补产品意图、seedPaths、目标 map 和下一步。'
  ];
}

function preparedFeatureToolCalls(projectId: string, candidate: FeatureSearchCandidate, selectedFocus: FeatureFocusRow | null, depth: number): PreparedToolCall[] {
  const feature = candidate.feature;
  const focusReference = selectedFocus ? { focusId: selectedFocus.id } : { featureId: feature.id };
  const calls: PreparedToolCall[] = [
    {
      toolName: 'functree_get_feature_dossier',
      priority: 'high',
      reason: '读取完整功能事实档案，用于确认产品意图、实现切片、证据、缺口和对齐关系。',
      arguments: { projectId, ...focusReference, depth }
    },
    {
      toolName: 'functree_get_feature_readiness',
      priority: 'high',
      reason: '检查这个功能是否已经具备产品意图、跨端覆盖、代码引用、code_fact 证据、验收条件和 mock 边界。',
      arguments: { projectId, ...focusReference, requiredAxes: ['product', 'web', 'backend'] }
    },
    {
      toolName: 'functree_get_programming_context',
      priority: 'high',
      reason: '读取面向改代码的窄上下文，包括入口、关键代码引用、风险、验收项和推荐行动。',
      arguments: { projectId, ...focusReference, depth }
    }
  ];
  if (selectedFocus) {
    calls.push({
      toolName: 'functree_upsert_feature_focus',
      priority: 'medium',
      reason: '完成本轮分析或实现后，更新当前功能焦点的 findings、nextSteps、confidence 和状态。',
      arguments: featureFocusUpdateArguments(projectId, selectedFocus)
    });
  } else {
    calls.push({
      toolName: 'functree_upsert_feature_focus',
      priority: 'medium',
      reason: '如果本轮工作需要长期续接，先为这个功能创建一个焦点，记录问题、范围、seedPaths 和下一步。',
      arguments: {
        projectId,
        featureId: feature.id,
        title: `深挖 ${feature.name}`.slice(0, 200),
        mode: 'analyze',
        priority: candidate.openGaps.some((gap) => gap.severity === 'high') ? 'high' : 'medium',
        sourceType: 'user_request',
        question: `继续分析 ${feature.name}`,
        seedPaths: unique(candidate.matchingCodeReferences.map((reference) => reference.path)).slice(0, 20),
        targetMaps: featureFocusTargetMaps(candidate),
        nextSteps: [candidate.nextAction].filter(Boolean),
        confidence: 0.5
      }
    });
  }
  return calls;
}

function preparedFeatureFallbackToolCalls(
  projectId: string,
  candidate: FeatureSearchCandidate | null,
  suggestedStart: FeatureSearchResult['suggestedStart'],
  depth: number
): PreparedToolCall[] {
  const calls: PreparedToolCall[] = [];
  if (candidate) {
    calls.push({
      toolName: 'functree_prepare_feature_work',
      priority: 'high',
      reason: '人工确认候选就是目标功能后，用 featureId 重新准备单功能工作包。',
      arguments: { projectId, featureId: candidate.feature.id, depth }
    });
  }
  if (suggestedStart) {
    calls.push({
      toolName: 'functree_start_feature_focus',
      priority: candidate ? 'medium' : 'high',
      reason: candidate ? '如果候选不是目标功能，用该调用启动一个新的功能焦点。' : '当前没有可信候选，用该调用创建 canonical feature 并启动功能焦点。',
      arguments: featureFocusStartArguments(projectId, suggestedStart)
    });
  }
  return calls;
}

function featureFocusUpdateArguments(projectId: string, focus: FeatureFocusRow): Record<string, unknown> {
  return {
    projectId,
    id: focus.id,
    stableKey: focus.stableKey,
    featureId: focus.featureId,
    title: focus.title,
    mode: focus.mode,
    status: focus.status,
    priority: focus.priority,
    sourceType: focus.sourceType,
    question: focus.question,
    scope: focus.scope,
    sourceRefs: focus.sourceRefs,
    seedPaths: focus.seedPaths,
    targetMaps: focus.targetMapIds.map((mapId) => ({ mapId })),
    relatedFeatures: focus.relatedFeatureIds.map((featureId) => ({ featureId })),
    nextSteps: focus.nextSteps,
    findings: focus.findings,
    confidence: focus.confidence
  };
}

function featureFocusStartArguments(projectId: string, suggestedStart: NonNullable<FeatureSearchResult['suggestedStart']>): Record<string, unknown> {
  return {
    projectId,
    canonicalMap: {
      stableKey: suggestedStart.canonicalMapStableKey,
      name: suggestedStart.canonicalMapStableKey
    },
    canonicalFeature: {
      stableKey: suggestedStart.canonicalFeatureStableKey,
      name: suggestedStart.featureName
    },
    focus: {
      title: `深挖 ${suggestedStart.featureName}`.slice(0, 200),
      mode: 'analyze',
      sourceType: 'user_request',
      question: suggestedStart.reason,
      nextSteps: ['补齐产品、前端、后端、SDK、运维、证据和缺口。']
    }
  };
}

function featureFocusTargetMaps(candidate: FeatureSearchCandidate): Array<{ mapId: string }> {
  return unique([candidate.map.id, ...candidate.matchingCodeReferences.map((reference) => reference.mapId).filter(isString)]).map((mapId) => ({ mapId }));
}

function featureReadinessReference(data: ParsedFeatureReadiness): {
  focusId?: string;
  focusStableKey?: string;
  featureId?: string;
  featureStableKey?: string;
  mapId?: string;
  mapStableKey?: string;
  featureVersion?: string;
} {
  return {
    focusId: data.focusId,
    focusStableKey: data.focusStableKey,
    featureId: data.featureId,
    featureStableKey: data.featureStableKey,
    mapId: data.mapId,
    mapStableKey: data.mapStableKey,
    featureVersion: data.featureVersion
  };
}

function featureReadinessAxes(data: ParsedFeatureReadiness, dossier: FeatureDossierResult): MapAxis[] {
  if (data.requiredAxes.length > 0) {
    return uniqueMapAxes(data.requiredAxes);
  }
  const focusAxes = uniqueMapAxes((dossier.selectedFocus?.targetMaps ?? []).map((map) => map.axis).filter(isMapAxis));
  if (focusAxes.length > 0) {
    return focusAxes;
  }
  const statusAxes = uniqueMapAxes(dossier.implementationSlices.map((status) => status.map?.axis).filter(isMapAxis));
  if (statusAxes.length > 0) {
    return statusAxes;
  }
  return ['product', 'web', 'backend'];
}

function featureReadinessAxisCoverage(
  axis: MapAxis,
  dossier: FeatureDossierResult
): { axis: MapAxis; status: 'covered' | 'missing' | 'partial'; maps: FeatureMapRow[]; implementationStatuses: CapabilityStatusRow[] } {
  const implementationStatuses = dossier.implementationSlices.filter((status) => status.map?.axis === axis);
  const maps = uniqueById([
    dossier.focus.map.axis === axis ? dossier.focus.map : null,
    dossier.canonicalMap.axis === axis ? dossier.canonicalMap : null,
    ...implementationStatuses.map((status) => status.map).filter(isNonNull)
  ].filter(isNonNull));
  const coveredStatuses = new Set(['prototype', 'spec', 'approved', 'mock', 'partial', 'live', 'configured', 'deployed', 'deprecated']);
  const weakStatuses = new Set(['unknown', 'none']);
  const status =
    maps.length === 0 && implementationStatuses.length === 0
      ? 'missing'
      : implementationStatuses.length === 0
        ? 'partial'
        : implementationStatuses.some((item) => coveredStatuses.has(item.status))
          ? 'covered'
          : implementationStatuses.every((item) => weakStatuses.has(item.status))
            ? 'partial'
            : 'covered';
  return { axis, status, maps, implementationStatuses };
}

function featureReadinessChecks(dossier: FeatureDossierResult, qualityReport: QualityReportResult, axisCoverage: FeatureReadinessResult['axisCoverage']): FeatureReadinessCheck[] {
  const checks: FeatureReadinessCheck[] = [];
  const details = dossier.focus.feature.details ?? dossier.canonicalFeature.details;
  const activeFocuses = dossier.focuses.filter((focus) => !['implemented', 'closed', 'archived'].includes(focus.status));
  const selectedFocus = dossier.selectedFocus ?? activeFocuses[0] ?? null;
  const codeFactEvidence = dossier.evidence.filter((item) => item.evidenceType === 'code_fact');
  const productEvidence = dossier.evidence.filter((item) => item.sourceType === 'product_prototype' || item.evidenceType === 'doc_claim' || item.evidenceType === 'planned');
  const hasIntent = hasUsefulText(details?.intent);
  const hasProductIntentEvidence = productEvidence.length > 0;
  const hasFeatureDescription = hasUsefulText(dossier.canonicalFeature.description);
  const hasMockSignal = dossier.evidence.some((item) => item.evidenceType === 'mock_only') || dossier.implementationSlices.some((status) => status.status === 'mock') || dossier.focus.feature.status === 'mock_only';
  const partialStatuses = dossier.implementationSlices.filter((status) => ['none', 'partial', 'mock', 'unknown'].includes(status.status));
  const openGaps = dossier.gaps.filter((gap) => gap.status === 'open');
  const highGaps = openGaps.filter((gap) => gap.severity === 'high');

  checks.push(
    readinessCheck({
      id: 'focus.selected',
      label: '当前功能焦点',
      status: selectedFocus ? 'pass' : 'warn',
      severity: 'medium',
      message: selectedFocus ? `正在围绕焦点继续：${selectedFocus.title}` : '还没有可续接的功能焦点。',
      hint: selectedFocus ? '完成分析后更新 findings、nextSteps 和 confidence。' : '用 functree_upsert_feature_focus 记录本轮问题、范围、seedPaths 和下一步。',
      targetType: selectedFocus ? 'feature_focus' : 'feature',
      targetId: selectedFocus?.id ?? dossier.focus.feature.id
    })
  );

  checks.push(
    readinessCheck({
      id: 'product.intent',
      label: '产品意图',
      status: hasIntent || hasProductIntentEvidence ? 'pass' : hasFeatureDescription ? 'warn' : 'fail',
      severity: 'high',
      message: hasIntent ? '已记录产品意图。' : hasProductIntentEvidence ? '有产品/文档证据支撑意图。' : hasFeatureDescription ? '只有功能简介，缺少结构化产品意图。' : '缺少产品意图，后续 AI 容易只按代码猜。',
      hint: '补充 details.intent，或写入 product_prototype/doc_claim/planned evidence。',
      targetType: 'feature',
      targetId: dossier.canonicalFeature.id
    })
  );

  checks.push(
    readinessCheck({
      id: 'scope.boundary',
      label: '范围边界',
      status: hasUsefulText(details?.scope) ? 'pass' : 'warn',
      severity: 'medium',
      message: hasUsefulText(details?.scope) ? '已记录功能范围。' : '缺少“包含什么/不包含什么”的范围边界。',
      hint: '补充 details.scope，尤其说明本轮不分析哪些相邻能力。',
      targetType: 'feature',
      targetId: dossier.focus.feature.id
    })
  );

  checks.push(
    readinessCheck({
      id: 'behavior.current_expected',
      label: '现状与目标行为',
      status: hasUsefulText(details?.currentBehavior) && hasUsefulText(details?.expectedBehavior) ? 'pass' : dossier.focus.feature.status === 'released' || dossier.focus.feature.status === 'completed' ? 'warn' : 'fail',
      severity: dossier.focus.feature.status === 'released' || dossier.focus.feature.status === 'completed' ? 'medium' : 'high',
      message:
        hasUsefulText(details?.currentBehavior) && hasUsefulText(details?.expectedBehavior)
          ? '已区分当前行为和目标行为。'
          : '缺少 currentBehavior / expectedBehavior，未完成或 mock 功能会很难判断下一步。',
      hint: '补充 details.currentBehavior 和 details.expectedBehavior，区分代码事实、产品目标和 mock 边界。',
      targetType: 'feature',
      targetId: dossier.focus.feature.id
    })
  );

  for (const coverage of axisCoverage) {
    checks.push(
      readinessCheck({
        id: `axis.${coverage.axis}`,
        label: `${coverage.axis} 视角覆盖`,
        status: coverage.status === 'covered' ? 'pass' : coverage.status === 'partial' ? 'warn' : 'fail',
        severity: coverage.axis === 'product' || coverage.axis === 'capability' ? 'high' : 'medium',
        message:
          coverage.status === 'covered'
            ? `${coverage.axis} 视角已有状态或实现切片。`
            : coverage.status === 'partial'
              ? `${coverage.axis} 视角只有地图/弱状态，还需要补清楚。`
              : `缺少 ${coverage.axis} 视角，无法确认这个功能在该层是否存在。`,
        hint: '用 functree_upsert_feature_dossier 写入 implementationSlices，或用 functree_upsert_capability_status 记录该 map 的状态。',
        targetType: 'feature',
        targetId: dossier.canonicalFeature.id
      })
    );
  }

  checks.push(
    readinessCheck({
      id: 'code.references',
      label: '关键代码引用',
      status: dossier.codeReferences.length > 0 ? 'pass' : 'fail',
      severity: 'high',
      message: dossier.codeReferences.length > 0 ? `已有 ${dossier.codeReferences.length} 条代码引用。` : '缺少关键代码引用，AI 不知道该从哪里读和改。',
      hint: '写入 codeReferences，并尽量补 roleInFeature、changeGuidance、verificationHint 和 blastRadius。',
      targetType: 'feature',
      targetId: dossier.focus.feature.id
    })
  );

  checks.push(
    readinessCheck({
      id: 'evidence.code_fact',
      label: '代码事实证据',
      status: codeFactEvidence.length > 0 ? 'pass' : 'fail',
      severity: 'high',
      message: codeFactEvidence.length > 0 ? `已有 ${codeFactEvidence.length} 条 code_fact 证据。` : '缺少 code_fact 证据，mock、文档和真实实现容易混在一起。',
      hint: '对真实运行代码写入 evidenceType=code_fact；只有原型或文档时用 doc_claim/planned/mock_only。',
      targetType: 'feature',
      targetId: dossier.focus.feature.id
    })
  );

  checks.push(
    readinessCheck({
      id: 'alignment.cross_map',
      label: '跨视角对齐',
      status: dossier.alignments.length > 0 || dossier.implementationSlices.length > 0 ? 'pass' : 'warn',
      severity: 'medium',
      message: dossier.alignments.length > 0 ? `已有 ${dossier.alignments.length} 条对齐关系。` : dossier.implementationSlices.length > 0 ? '已有状态矩阵，但缺少显式 alignment。' : '缺少跨产品/前端/后端的对齐关系。',
      hint: '用 alignment 的 implements/mock_of/backend_supports/prototype_intent 等关系把同一能力的不同实现连起来。',
      targetType: 'feature',
      targetId: dossier.canonicalFeature.id
    })
  );

  checks.push(
    readinessCheck({
      id: 'gaps.explicit',
      label: '缺口与冲突',
      status: partialStatuses.length === 0 || openGaps.length > 0 ? 'pass' : 'warn',
      severity: 'medium',
      message:
        partialStatuses.length === 0
          ? '未发现明显 mock/partial/none 状态需要记录缺口。'
          : openGaps.length > 0
            ? `已有 ${openGaps.length} 个开放缺口。`
            : '存在 mock/partial/none/unknown 状态，但没有结构化缺口。',
      hint: '用 functree_upsert_capability_gap 或 dossier.gaps 记录 mock_gap、implementation_gap、integration_gap、conflict 等。',
      targetType: 'feature',
      targetId: dossier.canonicalFeature.id
    })
  );

  checks.push(
    readinessCheck({
      id: 'acceptance.criteria',
      label: '验收条件',
      status: (details?.acceptanceCriteria.length ?? 0) > 0 ? 'pass' : ['draft', 'in_progress', 'reviewing', 'blocked', 'mock_only'].includes(dossier.focus.feature.status) ? 'fail' : 'warn',
      severity: ['draft', 'in_progress', 'reviewing', 'blocked', 'mock_only'].includes(dossier.focus.feature.status) ? 'high' : 'medium',
      message: (details?.acceptanceCriteria.length ?? 0) > 0 ? '已有验收条件。' : '缺少验收条件，后续实现完成度难判断。',
      hint: '补充 details.acceptanceCriteria，并在 code reference 上写 verificationHint。',
      targetType: 'feature',
      targetId: dossier.focus.feature.id
    })
  );

  checks.push(
    readinessCheck({
      id: 'mock.boundary',
      label: 'Mock 边界',
      status: hasMockSignal ? (hasUsefulText(details?.mockBoundary) ? 'pass' : 'fail') : 'pass',
      severity: 'high',
      message: hasMockSignal ? (hasUsefulText(details?.mockBoundary) ? '已标注 mock 边界。' : '发现 mock 信号但没有写清楚不能当作真实能力的边界。') : '未发现 mock 边界要求。',
      hint: '在 details.mockBoundary 中说明 mock 覆盖范围、真实 API/存储是否接通、哪些行为不能当事实。',
      targetType: 'feature',
      targetId: dossier.focus.feature.id
    })
  );

  if (qualityReport.summary.featuresWithoutCodeReferences > 0 || qualityReport.summary.featuresWithoutCodeEvidence > 0 || qualityReport.summary.draftDetailGaps > 0) {
    checks.push(
      readinessCheck({
        id: 'quality.local_report',
        label: '局部质量报告',
        status: 'fail',
        severity: 'high',
        message: `局部质量报告仍有 ${qualityReport.summary.errors} 个错误、${qualityReport.summary.warnings} 个警告。`,
        hint: '先处理 qualityReport.issues 中的高优先级项，再把焦点状态推进到 ready_for_implementation。',
        targetType: 'feature',
        targetId: dossier.focus.feature.id
      })
    );
  }

  if (highGaps.length > 0) {
    checks.push(
      readinessCheck({
        id: 'gaps.high_severity',
        label: '高风险缺口',
        status: 'warn',
        severity: 'high',
        message: `存在 ${highGaps.length} 个高优先级开放缺口。`,
        hint: highGaps[0]?.recommendedAction || '先处理高优先级缺口，或明确接受风险。',
        targetType: 'capability_gap',
        targetId: highGaps[0]?.id ?? dossier.canonicalFeature.id
      })
    );
  }

  if (dossier.focus.feature.status === 'blocked' && !hasUsefulText(details?.blocker)) {
    checks.push(
      readinessCheck({
        id: 'blocked.reason',
        label: '阻塞原因',
        status: 'fail',
        severity: 'high',
        message: '功能处于 blocked，但没有结构化 blocker。',
        hint: '补充 details.blocker 和 openQuestions。',
        targetType: 'feature',
        targetId: dossier.focus.feature.id
      })
    );
  }

  return checks;
}

function readinessCheck(input: FeatureReadinessCheck): FeatureReadinessCheck {
  return input;
}

function featureReadinessScore(checks: FeatureReadinessCheck[]): number {
  const penalty = checks.reduce((total, check) => {
    if (check.status === 'pass') return total;
    const base = check.status === 'fail' ? 14 : 6;
    const severity = check.severity === 'high' ? 1.35 : check.severity === 'low' ? 0.65 : 1;
    return total + Math.round(base * severity);
  }, 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

function featureReadinessStatus(dossier: FeatureDossierResult, checks: FeatureReadinessCheck[]): FeatureReadinessResult['readiness'] {
  const failed = checks.filter((check) => check.status === 'fail');
  if (dossier.focus.feature.status === 'blocked' || failed.some((check) => check.id === 'blocked.reason')) {
    return 'blocked';
  }
  if (failed.some((check) => check.id === 'code.references' || check.id === 'evidence.code_fact' || check.id === 'quality.local_report')) {
    return 'needs_evidence';
  }
  if (failed.some((check) => check.id.startsWith('axis.') || check.id === 'alignment.cross_map')) {
    return 'needs_alignment';
  }
  if (failed.length > 0 || checks.some((check) => check.status === 'warn')) {
    return 'needs_analysis';
  }
  return 'ready';
}

function featureReadinessNextSteps(dossier: FeatureDossierResult, qualityReport: QualityReportResult, checks: FeatureReadinessCheck[], missingAxes: MapAxis[]): string[] {
  const steps = [
    ...checks
      .filter((check) => check.status !== 'pass')
      .sort((left, right) => readinessSeverityRank(left.severity) - readinessSeverityRank(right.severity))
      .slice(0, 6)
      .map((check) => check.hint),
    missingAxes.length > 0 ? `补齐缺失视角：${missingAxes.join(', ')}。` : '',
    qualityReport.issues[0] ? `先处理质量问题：${qualityReport.issues[0].message}` : '',
    dossier.selectedFocus?.nextSteps[0] ? `继续当前焦点下一步：${dossier.selectedFocus.nextSteps[0]}` : '',
    '完成补充后再次调用 functree_get_feature_readiness。'
  ].filter(Boolean);
  return unique(steps).slice(0, 10);
}

function featureReadinessToolCalls(projectId: string, dossier: FeatureDossierResult, readiness: FeatureReadinessResult['readiness']): PreparedToolCall[] {
  const focusReference = dossier.selectedFocus ? { focusId: dossier.selectedFocus.id } : { featureId: dossier.focus.feature.id };
  const calls: PreparedToolCall[] = [
    {
      toolName: 'functree_get_feature_dossier',
      priority: 'high',
      reason: '读取完整功能档案，按产品意图、状态矩阵、证据、缺口和代码引用补齐 readiness 缺口。',
      arguments: { projectId, ...focusReference, depth: 2 }
    },
    {
      toolName: 'functree_get_programming_context',
      priority: readiness === 'ready' ? 'medium' : 'high',
      reason: readiness === 'ready' ? '功能信息已经较完整，可以读取编程行动上下文。' : '读取 seedPaths、入口、代码引用和推荐行动，定位该补哪些材料。',
      arguments: { projectId, ...focusReference, depth: 2 }
    },
    {
      toolName: 'functree_upsert_feature_dossier',
      priority: readiness === 'ready' ? 'low' : 'high',
      reason: '写回产品意图、实现切片、状态矩阵、证据、代码引用和缺口，让功能点从浅索引变成深档案。',
      arguments: {
        projectId,
        canonicalMap: { id: dossier.canonicalMap.id, stableKey: dossier.canonicalMap.stableKey, name: dossier.canonicalMap.name },
        canonicalFeature: { id: dossier.canonicalFeature.id, stableKey: dossier.canonicalFeature.stableKey, name: dossier.canonicalFeature.name }
      }
    }
  ];
  if (dossier.selectedFocus) {
    calls.push({
      toolName: 'functree_upsert_feature_focus',
      priority: 'medium',
      reason: '补齐分析后更新当前焦点的 findings、nextSteps、confidence 和状态。',
      arguments: featureFocusUpdateArguments(projectId, dossier.selectedFocus)
    });
  }
  return calls;
}

function readinessSeverityRank(severity: FeatureReadinessCheck['severity']): number {
  if (severity === 'high') return 0;
  if (severity === 'medium') return 1;
  return 2;
}

function hasUsefulText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function uniqueMapAxes(axes: MapAxis[]): MapAxis[] {
  return Array.from(new Set(axes));
}

function isMapAxis(value: unknown): value is MapAxis {
  return typeof value === 'string' && ['capability', 'product', 'web', 'backend', 'sdk', 'ops', 'data', 'test', 'docs', 'other'].includes(value);
}

function isScopedQualityReport(data: ParsedQualityReport): boolean {
  return Boolean(data.focusId || data.focusStableKey || data.featureId || data.featureStableKey || data.mapId || data.mapStableKey);
}

function axisRank(axis: string): number {
  return { product: 0, capability: 1, web: 2, backend: 3, sdk: 4, ops: 5, data: 6, test: 7, docs: 8, other: 9 }[axis] ?? 10;
}

function featureSearchTerms(query: string): string[] {
  return unique(query.trim().toLowerCase().split(/[.\-_/\s]+/u).filter((term) => term.length > 0));
}

function stableKeyFromSearchQuery(query: string): string {
  const stableKey = query
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 120);
  return stableKey || 'feature-focus';
}

function pathMatches(pathValue: string, queryPath: string, mode: string): boolean {
  const path = pathValue.toLowerCase();
  const needle = queryPath.toLowerCase();
  if (mode === 'exact') return path === needle;
  if (mode === 'prefix') return path.startsWith(needle);
  return path.includes(needle);
}

function countBy<T>(items: T[], selector: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
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

function appendSearchExpressionsClause(where: string[], args: SQLInputValue[], expressions: string[], keyword: string): void {
  const value = keyword.trim().toLowerCase();
  if (!value) return;
  const tokenTerms = featureSearchTerms(value);
  const expressionClauses = expressions.map((expression) => `LOWER(COALESCE(${expression}, '')) LIKE ? ESCAPE '\\'`);
  const fullClause = `(${expressionClauses.join(' OR ')})`;
  const tokenClauses = tokenTerms.map(() => `(${expressionClauses.join(' OR ')})`);
  where.push(tokenClauses.length > 1 ? `(${fullClause} OR (${tokenClauses.join(' AND ')}))` : fullClause);
  args.push(...expressions.map(() => likePattern(value)));
  if (tokenClauses.length > 1) {
    for (const term of tokenTerms) {
      args.push(...expressions.map(() => likePattern(term)));
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

function normalizeFeatureDetailInput(featureId: string, input: unknown, existing: FeatureDetailRow | null, updatedAt: string): FeatureDetailRow {
  const details = FeatureDetailSchema.parse(input);
  return {
    featureId,
    intent: details.intent,
    currentBehavior: details.currentBehavior,
    expectedBehavior: details.expectedBehavior,
    scope: details.scope,
    knownGaps: details.knownGaps,
    openQuestions: details.openQuestions,
    acceptanceCriteria: details.acceptanceCriteria,
    risks: details.risks,
    blocker: details.blocker,
    replacement: details.replacement,
    deprecatedReason: details.deprecatedReason,
    mockBoundary: details.mockBoundary,
    detailsMarkdown: details.detailsMarkdown,
    lastVerifiedAt: details.lastVerifiedAt,
    lastVerifiedCommit: details.lastVerifiedCommit ?? existing?.lastVerifiedCommit ?? '',
    updatedAt
  };
}

function evidenceSignature(input: {
  targetType: string;
  targetId: string;
  evidenceType: string;
  path: string;
  symbol: string;
  lineStart: number | null;
  lineEnd: number | null;
  commitSha: string;
}): string {
  return [input.targetType, input.targetId, input.evidenceType, input.path, input.symbol, input.lineStart ?? '', input.lineEnd ?? '', input.commitSha].join('|');
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
    name: typeof row.name === 'string' ? row.name : typeof row.title === 'string' ? row.title : undefined,
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

function featureFocusCandidate(focus: FeatureFocusRow): { id: string; stableKey: string; mapId?: string | null; version?: string; name?: string } {
  return {
    id: focus.id,
    stableKey: focus.stableKey,
    mapId: focus.map?.id ?? null,
    name: focus.title
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

function uniqueById<T extends { id: string }>(values: T[]): T[] {
  return Array.from(new Map(values.map((value) => [value.id, value])).values());
}

function groupBy<T>(values: T[], keyFor: (value: T) => string): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const value of values) {
    const key = keyFor(value);
    const existing = result.get(key) ?? [];
    existing.push(value);
    result.set(key, existing);
  }
  return result;
}

function countIssues(issues: QualityIssue[]): { errors: number; warnings: number; info: number } {
  return {
    errors: issues.filter((issue) => issue.severity === 'error').length,
    warnings: issues.filter((issue) => issue.severity === 'warning').length,
    info: issues.filter((issue) => issue.severity === 'info').length
  };
}

function batchSummary<T>(results: Array<UpsertResult<T>>, errors: unknown[]): BatchUpsertResult<T>['summary'] {
  return {
    created: results.filter((result) => result.operation === 'created').length,
    updated: results.filter((result) => result.operation === 'updated').length,
    unchanged: results.filter((result) => result.operation === 'unchanged').length,
    dryRun: results.filter((result) => result.operation === 'dry_run').length,
    errors: errors.length
  };
}

function markFeatureDossierDryRun(result: FeatureDossierUpsertResult): FeatureDossierUpsertResult {
  return {
    ...result,
    dryRun: true,
    rolledBack: true,
    operations: {
      maps: result.operations.maps.map(markOperationDryRun),
      features: result.operations.features.map(markOperationDryRun),
      entryPoints: result.operations.entryPoints.map(markOperationDryRun),
      codeReferences: result.operations.codeReferences.map(markOperationDryRun),
      evidence: result.operations.evidence.map(markOperationDryRun),
      statuses: result.operations.statuses.map(markOperationDryRun),
      gaps: result.operations.gaps.map(markOperationDryRun),
      alignments: result.operations.alignments.map(markOperationDryRun)
    }
  };
}

function markFeatureFocusStartDryRun(result: FeatureFocusStartResult): FeatureFocusStartResult {
  return {
    ...result,
    dryRun: true,
    rolledBack: true,
    map: markOperationDryRun(result.map),
    feature: markOperationDryRun(result.feature),
    focus: markOperationDryRun(result.focus)
  };
}

function markOperationDryRun<T>(result: UpsertResult<T>): UpsertResult<T> {
  const dataId = typeof result.data === 'object' && result.data && 'id' in result.data ? String((result.data as { id: unknown }).id) : undefined;
  return {
    ...result,
    operation: 'dry_run',
    dryRun: true,
    previewId: result.previewId ?? (result.operation === 'created' ? dataId : undefined)
  };
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
