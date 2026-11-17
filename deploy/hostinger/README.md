# Hostinger package

Express / Node 24.x. Install npm ci; build node deploy/hostinger/build.mjs; start node deploy/hostinger/start.mjs; output dist. See runtime.json.

Read docs/03_HOSTINGER_BUILD_CONFIGURATION.md through docs/14_DEPLOYMENT_READINESS.md at project root. Configure private environment and storage outside release directories. Explicit migrations/import precede startup; no automatic schema changes or database seeds. Production remains blocked pending documented security and staging acceptance. Do not deploy without approval.
