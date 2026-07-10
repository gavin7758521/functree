import {
  type CreateAlignmentInput,
  type CreateFeatureInput,
  type CreateFeatureSetInput,
  type CreateProjectInput,
  type QueryContextInput,
  CreateAlignmentSchema,
  CreateFeatureSchema,
  CreateFeatureSetSchema,
  CreateProjectSchema,
  QueryContextSchema,
  newId
} from '@functree/domain';
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

export class FuncTreeRepository {
  constructor(private readonly db: Db) {}

  seedIfEmpty(): void {
    const count = this.db.prepare('SELECT COUNT(*) AS count FROM projects').get() as { count: number };
    if (count.count > 0) {
      return;
    }

    const project = this.createProject({
      id: 'proj_demo',
      name: '示例项目',
      status: 'active',
      currentVersion: '2026.07',
      description: '用于展示项目、功能集、功能版本和跨层级对齐关系的示例。'
    });
    const product = this.createFeatureSet(project.id, {
      id: 'fs_product_202607',
      name: '产品需求',
      version: '2026.07',
      type: 'product',
      status: 'normal',
      owner: '产品'
    });
    const frontend = this.createFeatureSet(project.id, {
      id: 'fs_frontend_app_21',
      name: 'App 前端',
      version: '2.1',
      type: 'frontend',
      status: 'normal',
      owner: '前端'
    });
    const backend = this.createFeatureSet(project.id, {
      id: 'fs_backend_auth_15',
      name: '认证服务',
      version: '1.5',
      type: 'backend',
      status: 'normal',
      owner: '后端'
    });
    const reqLogin = this.createFeature(product.id, {
      id: 'feat_req_login',
      stableKey: 'login',
      name: '用户登录',
      version: '2026.07',
      status: 'completed',
      kind: 'capability',
      description: '用户可以通过手机号和验证码完成登录。'
    });
    const uiLogin = this.createFeature(frontend.id, {
      id: 'feat_app_login',
      stableKey: 'login',
      name: '登录页面',
      version: '2.1',
      status: 'in_progress',
      kind: 'page',
      description: 'App 端登录入口、验证码输入和错误提示。'
    });
    this.createFeature(frontend.id, {
      id: 'feat_app_login_countdown',
      parentFeatureId: uiLogin.id,
      stableKey: 'login.sms-countdown',
      name: '验证码倒计时',
      version: '2.1',
      status: 'reviewing',
      kind: 'component'
    });
    const apiLogin = this.createFeature(backend.id, {
      id: 'feat_api_login',
      stableKey: 'login',
      name: '登录接口',
      version: '1.5',
      status: 'completed',
      kind: 'api',
      description: '校验验证码并签发访问令牌。'
    });
    this.createAlignment(project.id, {
      id: 'aln_login_flow',
      name: '登录链路对齐',
      relation: 'corresponds_to',
      status: 'confirmed',
      description: '产品需求、App 页面和后端接口表达同一条登录能力。',
      members: [
        { targetType: 'feature', targetId: reqLogin.id, role: 'source' },
        { targetType: 'feature', targetId: uiLogin.id, role: 'peer' },
        { targetType: 'feature', targetId: apiLogin.id, role: 'peer' }
      ]
    });
  }

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
    const data = CreateFeatureSetSchema.parse(input);
    this.getProject(projectId);
    const now = nowIso();
    const id = data.id ?? newId('fs');
    this.db
      .prepare(
        `INSERT INTO feature_sets
          (id, project_id, name, version, type, status, description, owner, metadata_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
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
        data.name,
        data.version,
        data.type,
        data.status,
        data.description,
        data.owner,
        json(data.metadata),
        now,
        now
      );
    this.touchProject(projectId);
    this.recordEvent(projectId, 'http', 'upsert_feature_set', { id, name: data.name });
    return this.getFeatureSet(id);
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
    const data = CreateFeatureSchema.parse(input);
    const featureSet = this.getFeatureSet(featureSetId);
    if (data.parentFeatureId) {
      const parent = this.getFeature(data.parentFeatureId);
      if (parent.featureSetId !== featureSetId) {
        throw new ValidationError('子功能必须和父功能位于同一个功能集。');
      }
    }
    const now = nowIso();
    const id = data.id ?? newId('feat');
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
        featureSet.projectId,
        featureSetId,
        data.parentFeatureId,
        data.stableKey,
        data.name,
        data.version,
        data.status,
        data.kind,
        data.description,
        data.sortOrder,
        json(data.metadata),
        now,
        now
      );
    this.syncFeatureFts(id);
    this.touchProject(featureSet.projectId);
    this.recordEvent(featureSet.projectId, 'http', 'upsert_feature', { id, name: data.name });
    return this.getFeature(id);
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
    const data = CreateAlignmentSchema.parse(input);
    this.getProject(projectId);
    for (const member of data.members) {
      this.assertAlignable(projectId, member.targetType, member.targetId);
    }

    const now = nowIso();
    const id = data.id ?? newId('aln');
    try {
      this.db.exec('BEGIN');
      this.db
        .prepare(
          `INSERT INTO alignments (id, project_id, name, relation, status, description, metadata_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             relation = excluded.relation,
             status = excluded.status,
             description = excluded.description,
             metadata_json = excluded.metadata_json,
             updated_at = excluded.updated_at`
        )
        .run(id, projectId, data.name, data.relation, data.status, data.description, json(data.metadata), now, now);
      this.db.prepare('DELETE FROM alignment_members WHERE alignment_id = ?').run(id);
      const insert = this.db.prepare(
        `INSERT INTO alignment_members (id, alignment_id, target_type, target_id, role, note)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
      for (const member of data.members) {
        insert.run(newId('am'), id, member.targetType, member.targetId, member.role, member.note);
      }
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
    this.touchProject(projectId);
    this.recordEvent(projectId, 'http', 'upsert_alignment', { id, name: data.name });
    return this.getAlignment(id);
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

  queryContext(input: QueryContextInput) {
    const query = QueryContextSchema.parse(input);
    const keyword = query.keyword.trim();
    const projectFilter = query.projectId ? 'AND f.project_id = ?' : '';
    const projectArgs = query.projectId ? [query.projectId] : [];
    const projects = this.listProjects();
    const featureSets = query.projectId ? this.listFeatureSets(query.projectId) : [];
    const alignments = query.projectId ? this.listAlignments(query.projectId).slice(0, query.limit) : [];

    if (!keyword) {
      const features = query.projectId ? this.listFeatures(query.projectId).slice(0, query.limit) : [];
      return { projects, featureSets, features, alignments };
    }

    const features = this.db
      .prepare(
        `SELECT f.*
         FROM features_fts
         JOIN features f ON f.id = features_fts.id
         WHERE features_fts MATCH ? ${projectFilter}
         ORDER BY rank
         LIMIT ?`
      )
      .all(keyword, ...projectArgs, query.limit)
      .map(mapFeature);

    return { projects, featureSets, features, alignments };
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

export class NotFoundError extends Error {}
export class ValidationError extends Error {}

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

function nowIso(): string {
  return new Date().toISOString();
}
