# MySQL schema and import

Canonical migrations: database/migrations/mysql/*.sql. The older numbered files directly under database/migrations/ describe an earlier incomplete schema and are not run by the current runner. database/schema.sql is the complete clean-install reference. Use the runner, not multiple overlapping SQL import instructions.

With private database settings loaded: npm run db:migrate. This uses a connection-level advisory lock, checksums and per-statement DDL checkpoints in schema_migrations. All current migrations are additive; destructive statements are rejected. MySQL DDL autocommits, so a failed migration must be investigated and resumed, never declared rolled back automatically.

Import: npm run db:import -- --source /private/path/source.sqlite. The destination name must match explicit DB_NAME/DB_DATABASE. Production requires an additional --allow-production-import flag after approval and a backup. The CLI prints aggregate counts only; reports contain no passwords. Do not commit the source, SQL dumps, reports or credential files.

Schema uses InnoDB/utf8mb4_bin, source primary/unique keys, verified foreign keys, student/time lookup indexes, DECIMAL amounts and UTC ISO timestamp strings matching the existing API. Blank references are not silently rewritten. Parent mismatches fail rather than disabling constraints. Existing values must fit the schema; truncation/uniqueness errors require explicit repair.

Local commands executed: node --env-file=.local-tools/mysql-test.env database/migrate.mjs and node --env-file=.local-tools/mysql-test.env database/import/migrate_sqlite_to_mysql.js --source database.sqlite. Repeat runs passed without duplicate data. Real MySQL tests are restricted to an explicitly named localhost test database; never point tests at production.

After the SQLite import, run node database/import/import_paper_snapshots.mjs --source /private/authorized/full_papers. This is essential: the legacy single paper_id column loses shared-paper associations. Version 004 creates the normalized junction and optional variant snapshots. Repeat import checks existing positions/content and refuses conflicting overwrites. Keep source snapshots private, and never depend on them being in a deployment checkout.
