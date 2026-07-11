import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

export function openDatabase(dbPath = process.env.FUNCTREE_DB ?? 'data/functree.db'): Db {
  const resolved = path.resolve(dbPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const db = new DatabaseSync(resolved);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  migrate(db);
  return db;
}

export function openMemoryDatabase(): Db {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db: Db): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      current_version TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS maps (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      stable_key TEXT NOT NULL,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      axis TEXT NOT NULL,
      scope TEXT NOT NULL,
      kind TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      owner TEXT NOT NULL DEFAULT '',
      tags_json TEXT NOT NULL DEFAULT '[]',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(project_id, stable_key)
    );

    CREATE TABLE IF NOT EXISTS features (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      map_id TEXT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
      parent_feature_id TEXT REFERENCES features(id) ON DELETE SET NULL,
      stable_key TEXT NOT NULL,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      status TEXT NOT NULL,
      kind TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      tags_json TEXT NOT NULL DEFAULT '[]',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(map_id, stable_key, version)
    );

    CREATE TABLE IF NOT EXISTS feature_details (
      feature_id TEXT PRIMARY KEY REFERENCES features(id) ON DELETE CASCADE,
      intent TEXT NOT NULL DEFAULT '',
      current_behavior TEXT NOT NULL DEFAULT '',
      expected_behavior TEXT NOT NULL DEFAULT '',
      scope TEXT NOT NULL DEFAULT '',
      known_gaps_json TEXT NOT NULL DEFAULT '[]',
      open_questions_json TEXT NOT NULL DEFAULT '[]',
      acceptance_criteria_json TEXT NOT NULL DEFAULT '[]',
      risks_json TEXT NOT NULL DEFAULT '[]',
      blocker TEXT NOT NULL DEFAULT '',
      replacement TEXT NOT NULL DEFAULT '',
      deprecated_reason TEXT NOT NULL DEFAULT '',
      mock_boundary TEXT NOT NULL DEFAULT '',
      details_markdown TEXT NOT NULL DEFAULT '',
      last_verified_at TEXT NOT NULL DEFAULT '',
      last_verified_commit TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entry_points (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      map_id TEXT REFERENCES maps(id) ON DELETE SET NULL,
      stable_key TEXT NOT NULL,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      kind TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      confidence REAL NOT NULL DEFAULT 1,
      first_seen_scan_run_id TEXT,
      last_seen_scan_run_id TEXT,
      last_seen_commit_sha TEXT NOT NULL DEFAULT '',
      last_scanned_at TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(project_id, stable_key)
    );

    CREATE TABLE IF NOT EXISTS code_references (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      map_id TEXT REFERENCES maps(id) ON DELETE SET NULL,
      feature_id TEXT REFERENCES features(id) ON DELETE SET NULL,
      entry_point_id TEXT REFERENCES entry_points(id) ON DELETE SET NULL,
      stable_key TEXT NOT NULL DEFAULT '',
      path TEXT NOT NULL,
      symbol TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      line_start INTEGER,
      line_end INTEGER,
      first_seen_scan_run_id TEXT,
      last_seen_scan_run_id TEXT,
      last_seen_commit_sha TEXT NOT NULL DEFAULT '',
      last_scanned_at TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      evidence_type TEXT NOT NULL,
      signature TEXT NOT NULL,
      path TEXT NOT NULL DEFAULT '',
      symbol TEXT NOT NULL DEFAULT '',
      line_start INTEGER,
      line_end INTEGER,
      summary TEXT NOT NULL DEFAULT '',
      confidence REAL NOT NULL DEFAULT 1,
      commit_sha TEXT NOT NULL DEFAULT '',
      verified_at TEXT NOT NULL DEFAULT '',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(project_id, signature)
    );

    CREATE TABLE IF NOT EXISTS scan_runs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      repo_key TEXT NOT NULL,
      repo_url TEXT NOT NULL DEFAULT '',
      branch TEXT NOT NULL DEFAULT '',
      commit_sha TEXT NOT NULL,
      base_commit_sha TEXT NOT NULL DEFAULT '',
      worktree_dirty INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      summary_json TEXT NOT NULL DEFAULT '{}',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      started_at TEXT NOT NULL,
      finished_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alignments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      stable_key TEXT NOT NULL DEFAULT '',
      member_signature TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      relation TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alignment_members (
      id TEXT PRIMARY KEY,
      alignment_id TEXT NOT NULL REFERENCES alignments(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      role TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS sync_events (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      source TEXT NOT NULL,
      action TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_maps_project ON maps(project_id);
    CREATE INDEX IF NOT EXISTS idx_maps_axis ON maps(axis);
    CREATE INDEX IF NOT EXISTS idx_features_project ON features(project_id);
    CREATE INDEX IF NOT EXISTS idx_features_map ON features(map_id);
    CREATE INDEX IF NOT EXISTS idx_features_parent ON features(parent_feature_id);
    CREATE INDEX IF NOT EXISTS idx_feature_details_feature ON feature_details(feature_id);
    CREATE INDEX IF NOT EXISTS idx_entry_points_project ON entry_points(project_id);
    CREATE INDEX IF NOT EXISTS idx_entry_points_map ON entry_points(map_id);
    CREATE INDEX IF NOT EXISTS idx_entry_points_path ON entry_points(path);
    CREATE INDEX IF NOT EXISTS idx_code_references_project ON code_references(project_id);
    CREATE INDEX IF NOT EXISTS idx_code_references_map ON code_references(map_id);
    CREATE INDEX IF NOT EXISTS idx_code_references_feature ON code_references(feature_id);
    CREATE INDEX IF NOT EXISTS idx_code_references_entry_point ON code_references(entry_point_id);
    CREATE INDEX IF NOT EXISTS idx_code_references_path ON code_references(path);
    CREATE INDEX IF NOT EXISTS idx_evidence_project ON evidence(project_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_target ON evidence(target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence(evidence_type);
    CREATE INDEX IF NOT EXISTS idx_scan_runs_project ON scan_runs(project_id);
    CREATE INDEX IF NOT EXISTS idx_scan_runs_repo_commit ON scan_runs(project_id, repo_key, branch, commit_sha);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_code_references_project_stable_key
      ON code_references(project_id, stable_key)
      WHERE stable_key <> '';
    CREATE INDEX IF NOT EXISTS idx_alignments_project ON alignments(project_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_alignments_project_stable_key
      ON alignments(project_id, stable_key)
      WHERE stable_key <> '';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_alignments_project_member_signature
      ON alignments(project_id, member_signature)
      WHERE member_signature <> '';
    CREATE INDEX IF NOT EXISTS idx_alignment_members_alignment ON alignment_members(alignment_id);
    CREATE INDEX IF NOT EXISTS idx_alignment_members_target ON alignment_members(target_type, target_id);
  `);

  ensureColumn(db, 'entry_points', 'first_seen_scan_run_id', 'TEXT');
  ensureColumn(db, 'entry_points', 'last_seen_scan_run_id', 'TEXT');
  ensureColumn(db, 'entry_points', 'last_seen_commit_sha', "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, 'entry_points', 'last_scanned_at', 'TEXT');
  ensureColumn(db, 'code_references', 'first_seen_scan_run_id', 'TEXT');
  ensureColumn(db, 'code_references', 'last_seen_scan_run_id', 'TEXT');
  ensureColumn(db, 'code_references', 'last_seen_commit_sha', "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, 'code_references', 'last_scanned_at', 'TEXT');
  ensureColumn(db, 'code_references', 'role_in_feature', "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, 'code_references', 'change_guidance', "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, 'code_references', 'verification_hint', "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, 'code_references', 'blast_radius', "TEXT NOT NULL DEFAULT ''");

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_entry_points_last_seen_scan ON entry_points(last_seen_scan_run_id);
    CREATE INDEX IF NOT EXISTS idx_code_references_last_seen_scan ON code_references(last_seen_scan_run_id);
  `);
}

function ensureColumn(db: Db, tableName: string, columnName: string, definition: string): void {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}
