# Data migration report

A consistent SQLite backup was opened read-only and imported into a separate local MariaDB 11.8.6 database, ayurvedasidhi_migration_test, on 127.0.0.1:3307. The original database was not rewritten by the import.

54 source tables / 36,520 records were imported, including 19 courses, 83 subjects, 423 modules, 2,780 chapters, 4,129 videos, 3,432 notes, 464 papers and 21,013 questions. This is a preservation report, not a claim that every legacy marketing or sample record has been independently validated as genuine.

The repeat import inserted zero rows. Every existing source-key match was checked for identical column values; differing target records stop the import instead of being overwritten. 54 source tables reconciled. Source foreign-key violations: zero. Eleven checked learning/student relationships have 0 missing parent references. Case-sensitive utf8mb4 keys preserve source identifiers, while DECIMAL represents monetary values. Sanskrit/Hindi/emoji round-trip was tested.

Student records, tasks, bookmarks, watch/test history, encrypted configuration and financial history were retained. The prior demo-cleanup archive stays an archive; it is not restored as active accounts. Existing blogs, testimonials, 60 legacy lessons and seeded course metrics require provenance review before being advertised as verified facts. No new learning content or real student account was invented.

Progress is stored in data_import_progress; batch writes and checkpoints share a transaction. Resuming rechecks already copied rows rather than trusting an offset. Imports preserve source IDs and target-only records. Constraints remain enabled. New target constraints determine parent-first ordering. Private detailed reconciliation and SQLite snapshots live only in ignored database/import-output/ and .local-tools/.

No Hostinger production database has been imported. Do not run this against a populated production database without a backup and approved migration window. A production import refuses active sandbox-funded memberships. Imported sessions/OTPs should be invalidated during the planned cutover; new student session records require normal sign-in.

## Shared test-question association repair

The source's questions.paper_id can represent only one of several papers sharing a question. Cached authorized snapshots contain 44,444 question placements across all 464 papers. The explicit import_paper_snapshots.mjs import populated test_paper_questions with these links, without duplicating canonical questions or fabricating content. Per-paper variants are supported; this dataset required 0 variants and 0 new questions. Papers imported: 464; linked placements: 44444; papers without associations: 0. A repeat import must insert zero new links.

The application now reads these associations from MySQL before any local cache fallback. The staging preview has no temp_discovery directory. Reference text is absent in 13 canonical questions; missing citations are not invented. Missing canonical answer keys: 0.
