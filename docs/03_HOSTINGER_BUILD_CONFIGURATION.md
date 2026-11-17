# Hostinger build configuration

Application: Node.js Web App; framework preset: Express; Node version: 24.x. Hostinger's public documentation currently lists 18/20/22/24; this project selects 24 because it imports node:sqlite for development/import tooling. Node 24.22.3 was downloaded from nodejs.org, checksum verified, and used for build/database checks locally.

Install: npm ci (include build dependencies). Build: node deploy/hostinger/build.mjs. Start: node deploy/hostinger/start.mjs. Entry: deploy/hostinger/start.mjs. Static output: dist. The managed app must run the Express server as well as serve dist; deploying dist alone cannot provide login, MySQL or payments.

PORT is read from process.env.PORT. Set HOST=0.0.0.0 on hosting. Production configuration validates MySQL, HTTPS APP_URL, private session/vault secrets, OWNER_EMAIL and an absolute persistent storage directory outside the release directory. Startup checks migration versions; it never seeds/imports/migrates MySQL.

The Node 24 build passed (the current module set). Bundle-size warning remains (~1.75 MB JS before gzip); code splitting is a performance follow-up, not a successful optimization claim. No lint or typecheck script is configured in this JavaScript project.

Local Node 24 staging-like startup used NODE_ENV=production, APP_ENV=staging, isolated MySQL and storage outside the deployed directory. /login initially failed when sendFile encountered a hidden parent path; the fixed trusted-file response now handles it. Landing/login rendered at 390 and 1440 widths without JavaScript page errors.

Sources: https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/ and https://www.hostinger.com/support/how-to-select-the-node-js-version-for-your-application/ . Account-specific capability remains to be checked interactively.
