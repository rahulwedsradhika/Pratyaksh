# Deployment readiness

Classification: NOT READY for production go-live. Local MySQL implementation/build/preparation is substantially verified; this classification is driven by release security and external acceptance blockers, not an assertion that production has already been deployed.

Completed: asynchronous MySQL runtime across database consumers; preserved data with resumable non-overwriting import; additive checksummed migrations; relationship/index/session schema; Test/production payment isolation; session revocation; persistent storage separation; build/start package; Node 24 staging preview; real local database/HTTP/browser tests; environment and operating documentation.

Blockers: revoke/rotate the historically exposed Google client secret and privately review the historical SQL export; confirm intended GitHub destination/access and watched deployment branch; verify account Web App/migration/storage capabilities; provision separate hosted staging/production databases; perform hosted Google sign-in and OTP inbox delivery, normal superadmin acceptance, captured Razorpay Test purchase and duplicate webhook checks; verify external authorized media/PDF access and content provenance. Backups/restoration must be signed off for the actual hosting account.

Git: codex/hostinger-mysql-preparation; work remains uncommitted alongside previous authorized work. No new commit, remote change, push, PR, production deployment, merchant-webhook change or Live activation occurred. database/seed_data.sql is staged for removal from tracking; the local file is preserved and its historical export still needs review.

Next owner action: in Hostinger Websites, check whether Create site/Add website offers Web App/Node.js on the confirmed Business plan. Report that result. Do not switch the public domain or make a purchase. The interactive setup continues from that result.

Legacy general media upload now reports an actual failure when its authorized service is unavailable; it no longer fabricates success. A permanent general document-upload workflow and a signed-in audit of every legacy admin form remain pending. Custom gateway-logo upload uses persistent storage. Course/question CRUD now operates on MySQL; question bulk import validates complete options and commits batches atomically.
