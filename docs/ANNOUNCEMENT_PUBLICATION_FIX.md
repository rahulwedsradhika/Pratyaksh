# Announcement publication and current deployment step

The owner’s current announcement in the original SQLite database is a private draft. The other existing post is deleted. A draft is intentionally excluded from the student feed; saving changes is not the same as publishing.

Changes: explicit **Publish to students** action in draft rows and the editor, clearer private-draft labels, accurate publication confirmation, 15-second student refresh, cross-tab refresh notifications, and stale-response protection. Publishing still uses the normal superadmin-authenticated API; no draft was published or privileged session fabricated by this fix. Draft/delete/unpublish protections remain.

Use the same original preview (`http://127.0.0.1:5173`) for admin and student checks. Refresh Admin → Live Classes & Announcements, then click **Publish to students** on the intended draft. Open student Learn Live / All announcements. Eligible signed-in students see the published post; use Refresh or wait up to 15 seconds. The separate port 3004 preview uses a copied test database and does not receive new writes to the original database.

Verification: the four server publication/permission tests and the refresh/subscription test passed. The production build passed after the UI changes. Actual publication of the owner’s draft must occur through the owner’s normal admin session.

The owner confirmed that the exposed Google client secret was disabled/replaced. This is an owner confirmation, not an independent Google Cloud audit. No replacement secret is needed for this project’s GIS sign-in flow.

The intended deployment repository is `https://github.com/rahulwedsradhika/Pratyaksh`. Read-only checks confirmed access, write permission, public visibility and no existing branch/code. The existing local origin was not changed and no push occurred. Prepare a clean source release without old Git history, credentials, database dumps, discovery responses, uploaded notes or private browser artifacts before publishing there.

Next Hostinger action: hPanel → Websites → Create site/Add website → Web App. Stop at the next screen and review it together. Prefer a temporary staging address initially. Do not click Deploy, attach the final public domain, enable Live payments, or enter secrets into chat. The material transfer is incomplete and remains a production-readiness blocker.

Hostinger reference: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
