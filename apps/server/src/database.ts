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
      metadata_json TEXT NOT NULL DEFAULT '{}',
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
    CREATE INDEX IF NOT EXISTS idx_entry_points_project ON entry_points(project_id);
    CREATE INDEX IF NOT EXISTS idx_entry_points_map ON entry_points(map_id);
    CREATE INDEX IF NOT EXISTS idx_entry_points_path ON entry_points(path);
    CREATE INDEX IF NOT EXISTS idx_code_references_project ON code_references(project_id);
    CREATE INDEX IF NOT EXISTS idx_code_references_map ON code_references(map_id);
    CREATE INDEX IF NOT EXISTS idx_code_references_feature ON code_references(feature_id);
    CREATE INDEX IF NOT EXISTS idx_code_references_entry_point ON code_references(entry_point_id);
    CREATE INDEX IF NOT EXISTS idx_code_references_path ON code_references(path);
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
}
