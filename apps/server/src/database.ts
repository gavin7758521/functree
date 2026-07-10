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

    CREATE TABLE IF NOT EXISTS feature_sets (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      stable_key TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      owner TEXT NOT NULL DEFAULT '',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS features (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      feature_set_id TEXT NOT NULL REFERENCES feature_sets(id) ON DELETE CASCADE,
      parent_feature_id TEXT REFERENCES features(id) ON DELETE SET NULL,
      stable_key TEXT NOT NULL,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      status TEXT NOT NULL,
      kind TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(feature_set_id, stable_key, version)
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

    CREATE VIRTUAL TABLE IF NOT EXISTS features_fts USING fts5(
      id UNINDEXED,
      project_id UNINDEXED,
      feature_set_id UNINDEXED,
      name,
      stable_key,
      version,
      description
    );

    CREATE INDEX IF NOT EXISTS idx_feature_sets_project ON feature_sets(project_id);
    CREATE INDEX IF NOT EXISTS idx_features_project ON features(project_id);
    CREATE INDEX IF NOT EXISTS idx_features_set ON features(feature_set_id);
    CREATE INDEX IF NOT EXISTS idx_features_parent ON features(parent_feature_id);
    CREATE INDEX IF NOT EXISTS idx_alignments_project ON alignments(project_id);
    CREATE INDEX IF NOT EXISTS idx_alignment_members_alignment ON alignment_members(alignment_id);
    CREATE INDEX IF NOT EXISTS idx_alignment_members_target ON alignment_members(target_type, target_id);
  `);
  ensureColumn(db, 'feature_sets', 'stable_key', "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, 'alignments', 'stable_key', "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, 'alignments', 'member_signature', "TEXT NOT NULL DEFAULT ''");
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_sets_project_stable_key ON feature_sets(project_id, stable_key) WHERE stable_key <> '';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_alignments_project_stable_key ON alignments(project_id, stable_key) WHERE stable_key <> '';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_alignments_project_member_signature ON alignments(project_id, member_signature) WHERE member_signature <> '';
  `);
}

function ensureColumn(db: Db, table: string, column: string, definition: string): void {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!rows.some((row) => row.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
