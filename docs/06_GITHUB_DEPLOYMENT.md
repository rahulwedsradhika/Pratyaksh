# GitHub deployment preparation

Local preparation branch: codex/hostinger-mysql-preparation, created from feature/admin-panel-and-payment-management with existing changes preserved. The existing origin is https://github.com/rahulwedsradhika/pratyakshayurveda.git. This was discovered, not assumed to be the user's intended new deployment destination. No remote was replaced, fetched or pushed in this task, and no commit/PR was created.

The user will supply the actual repository URL. Then verify identity/access, inspect remote branches and determine which branch Hostinger watches before fetching/reconciling. Review all accumulated changes; do not blindly stage the entire workspace. Commit logical reviewed changes only after the historical-secret issue is addressed. Push the tested preparation branch only when authorized. No force push, branch deletion, production merge or automatic go-live is permitted.

The tracked private database/seed_data.sql export has been removed from the index while the local file remains. Its historical blob remains reachable. .env, local databases, uploads, private dumps, test tools and generated reports are ignored. Exposed historical secrets cannot be repaired by a new commit alone: revoke/rotate and coordinate any history cleanup before making a public repository or sending old history to a new destination.

After identity/access and safety checks: git fetch origin; review the target's latest commits; git add explicit-reviewed-paths; git commit; git push -u origin codex/hostinger-mysql-preparation. These are later instructions, not executed actions. No production-connected branch should be pushed until its deployment trigger is understood and approval is recorded.

.github/workflows/deployment-preparation.yml runs Node 24 build, unit/security tests and production dependency audit on pull requests/manual invocation. It contains no deployment or private database import step and has not been run on GitHub.

The old temp_discovery cache and generated audit/browser artifacts were also removed from Git tracking while preserving every local file. Their older history remains; review it privately before publishing a repository. Authorized paper data must be imported privately into MySQL, not bundled as discovery-cache files.
