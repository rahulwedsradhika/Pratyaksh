# Safe future updates

Develop on a feature branch → local MySQL tests → isolated staging MySQL and public staging acceptance → protected backup checkpoint → owner approval → production deployment → read-only health/auth/content/payment verification.

Build/start commands must never reset, truncate, import or seed production tables. Run additive versioned migrations explicitly with the migration operator and record applied versions/checksums. Migration edits after application are rejected. Add new migrations; do not rewrite successful ones. Keep backward compatibility across release/rollback windows.

Hostinger deployments may replace the checkout under hbuilds/versions; persistent records live in MySQL and files live outside that tree. Never package .env, SQLite files, SQL data dumps, original uploaded PDFs or credential CSVs into GitHub artifacts. Copy persistent storage through a controlled one-time migration and back it up independently.

Use manual production approval initially. Confirm watched branches before pushing. No assumption is made that this repository's current origin or default branch is the intended production trigger. Rotate secrets separately from ordinary UI releases, retaining the vault key needed for encrypted data.
