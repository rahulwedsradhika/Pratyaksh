# Deployment test evidence

Executed locally on 17 November 2026:

| Check | Result |
|---|---|
| Isolated npm ci --ignore-scripts | PASS; 213 packages installed from lockfile in .local-tools/clean-checkout |
| Production dependency audit | PASS; zero known vulnerabilities |
| Existing production build | PASS; the current module set; large-bundle warning remains |
| Node 24.22.3 build | PASS; official executable checksum verified |
| MySQL initial migration/import | PASS; 54 source tables, 36,520 records |
| Repeat migration/import | PASS; no added duplicate records |
| Foreign-key/relationship audit | PASS; source violations zero and eleven checked links have zero missing parents |
| Real MariaDB integration under Node 24 | PASS; utf8mb4, application pricing/analytics, injection payload, rollback and version idempotency |
| Selected unit/security regression suite | PASS; 45 tests, zero failures |
| Normal student HTTP flow on MySQL | PASS; password authentication, wrong-password rejection, admin denial, own tasks/membership, live feed, watch history, real paper questions, bookmarks, revoked logout token |
| Node 24 staging-like startup | PASS; NODE_ENV=production, APP_ENV=staging, separate local MySQL, external storage |
| Browser mobile/desktop | PASS; landing/login render at 390/1440; zero JS page errors |
| Read-only Test Razorpay credentials | PASS; authenticated API read using MySQL configuration |
| SMTP TLS authentication | PASS; no email sent |
| Backup/restore and DB restart | PASS; see report 10 |
| Git secret history | BLOCKED release: historical Google secret and private SQL export require action |
| Hosted Google sign-in / inbox OTP / captured checkout | BLOCKED; normal hosted staging/browser acceptance not performed |
| Physical iOS playback / all private PDFs | NOT RETESTED; external provider entitlement/device verification required |
| Lint/typecheck | NOT CONFIGURED; JavaScript project has no such scripts |
| GitHub push/Hostinger production deployment | NOT RUN; not authorized |

Representative commands: node --env-file=.local-tools/mysql-test.env database/migrate.mjs; node --env-file=.local-tools/mysql-test.env database/import/migrate_sqlite_to_mysql.js --source database.sqlite; RUN_MYSQL_TESTS=true with node --test tests/mysql_integration.test.mjs; node scripts/mysql_http_smoke.mjs with private test settings; node scripts/smoke_deployment.mjs http://127.0.0.1:3004; node scripts/browser_deployment_smoke.mjs. On PowerShell set $env:RUN_MYSQL_TESTS='true' first. Tests refuse production targets. No test pass is inferred from an unexecuted hosted action.

Additional checks: shared-paper associations are verified in real MySQL; all 464 papers have a database association list. Normal HTTP submission persists the authoritative paper title and result. A formerly empty shared paper is exercised on the cache-free staging preview. Rich-text XSS is checked in the fresh browser. Legacy admin CRUD role/validation/unpublish behavior is checked in isolated fixtures; actual owner browser acceptance remains pending.

The final build transformed 2,218 modules. The production dependency audit was rerun after DOMPurify was added. The separate clean-install verification then installed 213 locked packages.

## Preparation file inventory

This includes touched/new preparation files and updated tests; earlier unrelated workspace changes remain separate.

- .env.example
- .github/workflows/deployment-preparation.yml
- .gitignore
- database/README.md
- database/import/import_paper_snapshots.mjs
- database/import/migrate_sqlite_to_mysql.js
- database/import/source-schema.json
- database/indexes.sql
- database/migrate.mjs
- database/migrations/mysql/001_current_application.sql
- database/migrations/mysql/002_relations_and_student_sessions.sql
- database/migrations/mysql/003_activity_query_indexes.sql
- database/migrations/mysql/004_paper_question_associations.sql
- database/schema.sql
- deploy/hostinger/.env.example
- deploy/hostinger/.env.production.example
- deploy/hostinger/DEPLOYMENT_CHECKLIST.md
- deploy/hostinger/README.md
- deploy/hostinger/build.mjs
- deploy/hostinger/ecosystem.config.cjs
- deploy/hostinger/hostinger-deploy.sh
- deploy/hostinger/runtime.json
- deploy/hostinger/start.mjs
- deploy/hostinger/verify_hostinger_db.js
- docs/01_PROJECT_AUDIT.md
- docs/02_DATA_MIGRATION_REPORT.md
- docs/03_HOSTINGER_BUILD_CONFIGURATION.md
- docs/04_MYSQL_SCHEMA_AND_IMPORT.md
- docs/05_ENVIRONMENT_SETUP.md
- docs/06_GITHUB_DEPLOYMENT.md
- docs/07_GOOGLE_AND_EMAIL_VERIFICATION.md
- docs/08_RAZORPAY_DEPLOYMENT.md
- docs/09_SECURITY_AUDIT.md
- docs/10_BACKUP_AND_RESTORE.md
- docs/11_FUTURE_UPDATE_WORKFLOW.md
- docs/12_DEPLOYMENT_TEST_RESULTS.md
- docs/13_HOSTINGER_STEP_BY_STEP_GUIDE.md
- docs/14_DEPLOYMENT_READINESS.md
- docs/LOGIN_ROUTE_REPAIR.md
- package-lock.json
- package.json
- scripts/browser_deployment_smoke.mjs
- scripts/check_mysql_data.mjs
- scripts/connect_admin_fetch.mjs
- scripts/convert_database_async.cjs
- scripts/generate_mysql_schema.mjs
- scripts/inspect_database.mjs
- scripts/minimize_migration_diff.cjs
- scripts/mysql_http_smoke.mjs
- scripts/prepare_staging_check.mjs
- scripts/probe_services_mysql.mjs
- scripts/redact_known_secret_document.mjs
- scripts/restart_local_mysql.mjs
- scripts/run_deployment_tests.mjs
- scripts/run_mysql_tests.mjs
- scripts/scan_secrets.mjs
- scripts/setup_local_mysql.mjs
- scripts/smoke_deployment.mjs
- scripts/test_backup_restore_mysql.mjs
- scripts/write_deployment_reports.mjs
- server/adminAnalytics.js
- server/adminClassroom.js
- server/adminGateway.js
- server/adminRoutes.js
- server/asyncCollections.js
- server/curriculumAdmin.js
- server/databaseRuntime.js
- server/db.js
- server/db_mysql.js
- server/emailService.js
- server/emailTemplateUpgrade.js
- server/gatewayAdmin.js
- server/gatewayConfiguration.js
- server/googleAuthService.js
- server/index.js
- server/liveClasses.js
- server/membershipEligibility.js
- server/membershipOverview.js
- server/membershipPricing.js
- server/noteFiles.js
- server/oneTimeCodes.js
- server/paperQuestions.js
- server/persistentStorage.js
- server/productionConfiguration.js
- server/razorpayService.js
- server/studentActivity.js
- server/studentAvatar.js
- server/studentTasks.js
- src/components/RichText.jsx
- src/context/AuthContext.jsx
- src/pages/AdminCmsPage.jsx
- src/pages/admin/AdminAddCoursePage.jsx
- src/pages/admin/AdminCategoryPage.jsx
- src/pages/admin/AdminChapterBankPage.jsx
- src/pages/admin/AdminCourseMapPage.jsx
- src/pages/admin/AdminDashboardOverview.jsx
- src/pages/admin/AdminDashboardPage.jsx
- src/pages/admin/AdminEmailCenter.jsx
- src/pages/admin/AdminEnquiriesPage.jsx
- src/pages/admin/AdminFacultyPage.jsx
- src/pages/admin/AdminGoogleLoginSettings.jsx
- src/pages/admin/AdminLoginPage.jsx
- src/pages/admin/AdminMembershipPlans.jsx
- src/pages/admin/AdminPaymentReconciliation.jsx
- src/pages/admin/AdminPaymentSettings.jsx
- src/pages/admin/AdminQuestionBankPage.jsx
- src/pages/admin/AdminRegisteredStudentsPage.jsx
- src/pages/admin/AdminReportsAndExports.jsx
- src/pages/admin/AdminStudentDirectory.jsx
- src/pages/admin/AdminSubjectPage.jsx
- src/pages/admin/AdminSupabaseDiagnostics.jsx
- src/pages/admin/AdminTestSeriesPage.jsx
- src/pages/admin/AdminViewCoursePage.jsx
- src/pages/admin/AdminWebCmsPage.jsx
- src/services/adminFetch.js
- src/services/safeHtml.js
- src/services/supabaseClient.js
- tests/admin_fetch.test.mjs
- tests/admin_student_data.test.mjs
- tests/content_source_auth.test.mjs
- tests/curriculum_admin.test.mjs
- tests/email_templates.test.mjs
- tests/gateway_admin.test.mjs
- tests/gateway_configuration.test.mjs
- tests/lecture_notes.test.mjs
- tests/live_classes.test.mjs
- tests/membership_pricing.test.mjs
- tests/membership_renewal_security.test.mjs
- tests/mysql_integration.test.mjs
- tests/note_files.test.mjs
- tests/one_time_codes.test.mjs
- tests/production_configuration.test.mjs
- tests/production_gateway.test.mjs
- tests/pwa_install.test.mjs
