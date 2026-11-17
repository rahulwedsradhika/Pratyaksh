// APP_ENV/NODE_ENV and all secrets are supplied privately by the hosting runtime.
// Startup deliberately does not migrate, seed, import, or reset the database.
await import('../../server/index.js');
