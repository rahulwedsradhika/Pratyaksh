# Backup and restore

Keep code, MySQL and uploaded files independent. PERSISTENT_STORAGE_DIR must be an absolute private directory outside Hostinger's managed release path, with uploads/ and branding/ subdirectories. Copy existing public/assets/upload and public/assets/checkout-branding into those persistent locations before cutover; preserve paths and verify PDFs/images. Code rollback does not restore database state.

Before every schema/data migration, make a consistent database backup and copy persistent files to a separate protected backup destination. Example operator command: mariadb-dump --defaults-extra-file=/private/mysql-backup.cnf --single-transaction --skip-add-drop-table DATABASE_NAME > /private/backups/timestamp.sql. The private cnf stores credentials; never put passwords in command history or chat. Use Hostinger backups/exports where shell access is unavailable, and confirm the archive includes the actual MySQL database and private files.

Restore into a NEW empty database first, using the database client with that explicit target selected. Verify table counts, content hashes/critical associations, student identity links, membership/payment history, UTF-8, and the original vault key. Restrict/encrypt backup storage and periodically test restoration. Retention and offsite storage need an owner-selected policy; no unsupported automatic-backup promise is made.

Local backup/restore test status: PASS: 58 tables matched content hashes in a separate empty restore database. MariaDB restart persistence: PASS. Test backups and their credential file remain ignored under .local-tools/. No production restore occurred.

Rollback: preserve the current database, select the previously verified code release, and check its compatibility with the current additive schema. If data recovery is needed, restore a verified backup into another database, reconcile payments received since that checkpoint, and only then switch configuration with approval. Never overwrite current financial records with an old dump as a routine code rollback.
