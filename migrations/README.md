# migrations/

SQL migrations applied by `_api/migrate.js` (admin-only endpoint,
`/api/router?route=migrate`).

## File naming

One file per migration. Name with a timestamp prefix so lexical
sort matches chronological order:

```
YYYYMMDDHHMMSS_<slug>.sql
```

Examples:

- `20260401120000_init_users.sql`
- `20260415093015_add_voice_profiles.sql`

Only files ending in `.sql` are picked up.

## How it runs

`_api/migrate.js`:

1. Ensures a tracking table `_migrations (name text primary key, applied_at timestamptz)` exists.
2. Reads every `*.sql` file in this folder, sorted by filename.
3. Skips any filename already present in `_migrations` (idempotent — re-runs are a no-op).
4. Applies each remaining file inside a single transaction:
   `BEGIN; <file contents>; INSERT INTO _migrations(name) VALUES ('<filename>'); COMMIT;`.
5. Returns a JSON summary `{ applied: [...], skipped: [...], total }`.

If any statement fails, the transaction rolls back and the filename is **not**
recorded, so the next run will retry that migration.

## Writing a migration

- Keep each file self-contained; do not assume statements from a later file.
- Use `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
  where reasonable so partial re-runs after a failure stay safe.
- Do not wrap the file in your own `BEGIN`/`COMMIT` — the runner does that.

## Triggering

Admin-only. POST to `/api/router?route=migrate` with header `x-admin-token: <ADMIN_TOKEN>`.
