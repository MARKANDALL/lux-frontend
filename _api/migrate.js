// _api/migrate.js
/* eslint-env node */
// Admin-only SQL migration runner.
//
// Reads *.sql files from a migrations/ folder at the repo root, sorted by
// filename (timestamp-prefixed), and applies each inside a transaction.
// Records applied filenames in a `_migrations` table so re-running is a no-op.
//
// Two surfaces:
//   - runMigrations(opts)  — pure, dependency-injected. Used by tests.
//   - default handler(req, res) — HTTP wrapper for the serverless router.
//
// Dependency injection (`opts` to runMigrations):
//   fs             { readdir, readFile }   default: node:fs/promises
//   migrationsDir  absolute path            default: <cwd>/migrations
//   sql            async (statement) => rows[]  default: Supabase rpc('exec_sql')
//
// The `sql` function must:
//   - throw on error,
//   - return an array of row objects for SELECT,
//   - return [] for statements with no rows.

import path from 'node:path';
import fsDefault from 'node:fs/promises';

const TRACKING_TABLE = '_migrations';

const CREATE_TRACKING_SQL = `CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`;

const LIST_APPLIED_SQL = `SELECT name FROM ${TRACKING_TABLE};`;

function defaultMigrationsDir() {
  return path.resolve(process.cwd(), 'migrations');
}

async function defaultSql(statement) {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('migrate: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  }
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client.rpc('exec_sql', { sql: statement });
  if (error) throw new Error(error.message || String(error));
  return Array.isArray(data) ? data : [];
}

function escapeSqlLiteral(value) {
  return String(value).replace(/'/g, "''");
}

async function readMigrationFiles(fs, dir) {
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch (err) {
    if (err && err.code === 'ENOENT') return [];
    throw err;
  }
  return entries.filter((f) => f.endsWith('.sql')).sort();
}

export async function runMigrations(opts = {}) {
  const fs = opts.fs || fsDefault;
  const migrationsDir = opts.migrationsDir || defaultMigrationsDir();
  const sql = opts.sql || defaultSql;

  await sql(CREATE_TRACKING_SQL);

  const files = await readMigrationFiles(fs, migrationsDir);

  const appliedRows = await sql(LIST_APPLIED_SQL);
  const appliedSet = new Set(
    (Array.isArray(appliedRows) ? appliedRows : [])
      .map((r) => (r && r.name) || null)
      .filter(Boolean),
  );

  const skipped = files.filter((f) => appliedSet.has(f));
  const pending = files.filter((f) => !appliedSet.has(f));
  const applied = [];

  for (const file of pending) {
    const full = path.join(migrationsDir, file);
    const body = await fs.readFile(full, 'utf8');
    const tx = [
      'BEGIN;',
      body,
      `INSERT INTO ${TRACKING_TABLE} (name) VALUES ('${escapeSqlLiteral(file)}');`,
      'COMMIT;',
    ].join('\n');
    await sql(tx);
    applied.push(file);
  }

  return { applied, skipped, total: files.length };
}

function sendJson(res, status, body) {
  res.statusCode = status;
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method && req.method !== 'POST') {
    return sendJson(res, 405, {
      ok: false,
      status: 405,
      error: 'Method not allowed',
    });
  }
  try {
    const summary = await runMigrations();
    return sendJson(res, 200, { ok: true, ...summary });
  } catch (err) {
    const status = (err && err.status) || 500;
    return sendJson(res, status, {
      ok: false,
      status,
      error: (err && err.message) || 'Migration failed',
    });
  }
}
