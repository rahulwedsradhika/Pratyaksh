# Razorpay deployment

Current gateway remains Test mode. Separate Test/Live encrypted profiles and write-only secrets are preserved. AES-GCM vault encryption requires the original private server key, stored separately from MySQL. Current Test credentials authenticated a read-only Razorpay API request using the migrated MySQL configuration. No keys, merchant webhooks, other websites or Live settings were changed.

The frontend quotes a database plan; the backend reserves valid coupons and creates provider orders with authoritative INR paise values. Checkout verification checks the stored order ID, HMAC signature, captured status, exact amount/currency and independent provider confirmation. Order locks and a unique membership/order fulfillment index prevent concurrent duplicate activation. Webhook handling verifies original raw bytes and order environment before fulfillment. Gateway orders cannot be manually approved through bank reconciliation.

Canonical webhook: https://study.ayurvedasidhi.com/api/payments/razorpay/webhook. Existing /api/payment/razorpay/webhook and /test or /live aliases remain compatible. Configure only the approved deployment's URL in the correct merchant environment, with its own private webhook secret; do not edit other websites' webhooks. The endpoint is not reachable at localhost from Razorpay.

Use the Admin Gateway's sandbox checkout button for real Test-mode UI acceptance after normal administrator login on staging. Relevant events: order.paid and payment.captured; validate event delivery/signatures and duplicate retries. A Test payment can activate membership only in development/staging with their separate databases. APP_ENV=production rejects Test-funded membership even when the Node runtime is otherwise identical. Do not enable Live mode as part of this task.

Automated fake-provider tests cover signatures, capture/amount checks, separate-profile behavior and diagnostic checkout isolation. The earlier user reported successful sandbox popup verification on the old preview; that does not prove hosted MySQL checkout acceptance. A real MySQL-backed captured Test purchase, duplicate webhook delivery over public HTTPS and end-to-end membership access remain BLOCKED until normal staging/browser setup. No real money was charged.

Student checkout is also disabled when APP_ENV=production while only Test credentials are selected; use the separate staging database for Test purchases. Admin diagnostics remain a separate non-membership Test flow. This avoids displaying a checkout that cannot grant production access.
