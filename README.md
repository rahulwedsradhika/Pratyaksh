# Ayurvedasidhi deployment preparation

Clean source release for Node.js 24, Express and Vite React. This repository contains no student records, private notes, uploads, credentials or original Git history. Those are preserved locally and require a separate private migration.

Run npm ci, npm run test:deployment, and npm run build. Managed hosting start: node deploy/hostinger/start.mjs. Production startup requires an explicitly migrated MySQL database, existing owner account, private environment variables and persistent content storage. Build/start never import or seed production data.

## Deployment status

Preparation branch only. Do not deploy against an empty database. Target final domain: https://study.ayurvedasidhi.com. The owner has chosen direct production deployment after local verification; no hosted staging site is required. Back up the target before any import. Razorpay remains Test mode; Live payments require owner approval and server-side enablement. Google client-secret rotation was confirmed by the owner; secrets must be configured privately.

The local content transfer is incomplete. Banner images and private PDFs must be transferred separately to persistent hosting storage and verified before launch. Original data and localhost preview remain in the original workspace. Dated audit documents describe preparation findings and do not certify hosted acceptance.

See deploy/hostinger/README.md and docs/14_DEPLOYMENT_READINESS.md.
