# Database operations

See ../docs/04_MYSQL_SCHEMA_AND_IMPORT.md and ../docs/02_DATA_MIGRATION_REPORT.md.

Canonical migrations live under migrations/mysql/. The legacy files directly under migrations/ and the old indexes.sql are not the current runner input. Use npm run db:migrate, then the explicit private-source import command. MySQL startup never seeds or imports data.
