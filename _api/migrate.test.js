// _api/migrate.test.js
// Smoke coverage for runMigrations (pure, DI-mocked).
// Goals:
//   (a) an unknown migration is applied and recorded in _migrations
//   (b) an already-applied migration is skipped (idempotent re-run)
//
// Supabase is never touched — the `sql` function is a vi.fn() mock that
// interprets a tiny subset of SQL just well enough to exercise the runner:
//   - SELECT name FROM _migrations          -> returns [{name}, ...]
//   - BEGIN; ... INSERT INTO _migrations... -> tracks the inserted name

import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import { runMigrations } from '../_api/migrate.js';

function makeFsMock(files) {
  return {
    readdir: vi.fn(async () => Object.keys(files)),
    readFile: vi.fn(async (full) => {
      const name = path.basename(full);
      if (!(name in files)) {
        const err = new Error(`ENOENT: ${name}`);
        err.code = 'ENOENT';
        throw err;
      }
      return files[name];
    }),
  };
}

function makeSqlMock(initialApplied = []) {
  const executed = [];
  const applied = new Set(initialApplied);

  const sql = vi.fn(async (statement) => {
    executed.push(statement);
    const trimmed = String(statement).trim();

    if (/^SELECT\s+name\s+FROM\s+_migrations/i.test(trimmed)) {
      return [...applied].map((name) => ({ name }));
    }

    const insertMatch = trimmed.match(
      /INSERT\s+INTO\s+_migrations\s*\(\s*name\s*\)\s*VALUES\s*\('([^']+)'\)/i,
    );
    if (insertMatch) applied.add(insertMatch[1]);

    return [];
  });

  return { sql, executed, applied };
}

describe('_api/migrate — runMigrations', () => {
  it('applies an unknown migration and records it in _migrations', async () => {
    const fs = makeFsMock({
      '20260101000000_init.sql': 'CREATE TABLE foo (id INT);',
    });
    const { sql, executed, applied } = makeSqlMock([]);

    const result = await runMigrations({
      fs,
      migrationsDir: '/fake/migrations',
      sql,
    });

    expect(result).toEqual({
      applied: ['20260101000000_init.sql'],
      skipped: [],
      total: 1,
    });
    expect(applied.has('20260101000000_init.sql')).toBe(true);

    expect(sql.mock.calls[0][0]).toMatch(/CREATE TABLE IF NOT EXISTS _migrations/i);

    const txCall = executed.find((s) => s.includes('CREATE TABLE foo'));
    expect(txCall).toBeDefined();
    expect(txCall).toMatch(/^BEGIN;/);
    expect(txCall).toMatch(/COMMIT;\s*$/);
    expect(txCall).toMatch(
      /INSERT\s+INTO\s+_migrations\s*\(\s*name\s*\)\s*VALUES\s*\('20260101000000_init\.sql'\)/i,
    );
  });

  it('skips a migration that is already recorded (idempotent re-run)', async () => {
    const fs = makeFsMock({
      '20260101000000_init.sql': 'CREATE TABLE foo (id INT);',
    });
    const { sql, executed, applied } = makeSqlMock(['20260101000000_init.sql']);

    const result = await runMigrations({
      fs,
      migrationsDir: '/fake/migrations',
      sql,
    });

    expect(result).toEqual({
      applied: [],
      skipped: ['20260101000000_init.sql'],
      total: 1,
    });

    const ranMigration = executed.some((s) => s.includes('CREATE TABLE foo'));
    expect(ranMigration).toBe(false);

    expect(applied.size).toBe(1);
  });

  it('applies files in filename (timestamp) order', async () => {
    const fs = makeFsMock({
      '20260201000000_b.sql': 'CREATE TABLE b (id INT);',
      '20260101000000_a.sql': 'CREATE TABLE a (id INT);',
    });
    const { sql, executed } = makeSqlMock([]);

    const result = await runMigrations({
      fs,
      migrationsDir: '/fake/migrations',
      sql,
    });

    expect(result.applied).toEqual([
      '20260101000000_a.sql',
      '20260201000000_b.sql',
    ]);

    const aIdx = executed.findIndex((s) => s.includes('CREATE TABLE a'));
    const bIdx = executed.findIndex((s) => s.includes('CREATE TABLE b'));
    expect(aIdx).toBeGreaterThan(-1);
    expect(bIdx).toBeGreaterThan(aIdx);
  });

  it('is a no-op when the migrations folder is missing', async () => {
    const fs = {
      readdir: vi.fn(async () => {
        const err = new Error('ENOENT');
        err.code = 'ENOENT';
        throw err;
      }),
      readFile: vi.fn(),
    };
    const { sql } = makeSqlMock([]);

    const result = await runMigrations({
      fs,
      migrationsDir: '/does/not/exist',
      sql,
    });

    expect(result).toEqual({ applied: [], skipped: [], total: 0 });
    expect(fs.readFile).not.toHaveBeenCalled();
  });
});
