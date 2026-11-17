# Environment setup

.env.example is the canonical safe key list. deploy/hostinger/.env.production.example supplies the production public defaults. Fill secrets privately in hPanel/server configuration, never in VITE_* values or chat. APP_URL and EMAIL_APP_URL must both match the actual origin; production uses https://study.ayurvedasidhi.com. Use the real Hostinger-provided DB host/name/user, not assumed account prefixes.

Development: APP_ENV=development and a local MySQL database. Staging: NODE_ENV=production, APP_ENV=staging, a separate staging MySQL database and staging HTTPS origin. Production: both environments production and a separate production database. Separate session/SMTP/test settings by environment. Do not copy staging memberships to production.

Required private bootstrap: DB_HOST/PORT/NAME/USER/PASSWORD, AUTH_SESSION_SECRET (32+ random characters), the ORIGINAL RAZORPAY_ENCRYPTION_KEY for imported encrypted profiles, OWNER_EMAIL for the existing verified superadmin, and PERSISTENT_STORAGE_DIR. Preserve the vault key in a separate encrypted backup; replacing it makes saved gateway credentials unreadable. Runtime DB user should have only required data privileges; use a separate migration operator for DDL/import.

Keep ALLOW_LIVE_PAYMENTS=false. Production blocks sandbox membership fulfillment; perform payment acceptance testing in the separate staging database. Live mode requires separate owner approval and private server enablement. No production key was generated or activated.

SMTP_HOST=smtp.hostinger.com, SMTP_PORT=465, SMTP_SECURE=true, SMTP_USER/SMTP_FROM_EMAIL=noreply@ayurvedasidhi.com; password private. GOOGLE_CLIENT_ID may override admin-managed settings; ID-token popup sign-in does not require a client secret. Do not copy the historically exposed Google secret into a release.

Use PRATYAKSH_CONTENT_MODE=local for imported MySQL metadata. Bunny/PDF playback may still require authorized external sources. PRATYAKSH_REMOTE_ADMIN_ENABLED=false prevents the old portal being treated as this app's database. Set ALLOWED_ORIGINS to exact public origins. Bearer authentication has no ambient authentication cookie; cross-origin mutation requests are rejected in production. A future cookie-based flow must add explicit secure/HttpOnly/SameSite and CSRF handling.
