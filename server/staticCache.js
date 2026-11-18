import path from 'node:path';

// Only content-hashed build output is immutable. HTML and worker updates revalidate.
export function setStaticCacheHeaders(res, filename) {
  const normalized=filename.replaceAll('\\','/');
  const basename=path.basename(filename);
  const hashed=/\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(?:js|css)$/.test(normalized);
  const publicAsset=/\.(?:css|js|png|jpe?g|webp|avif|svg|ico|woff2?|ttf)$/.test(basename);
  res.setHeader('Cache-Control',hashed?'public, max-age=31536000, immutable':
    basename==='sw.js'||basename.endsWith('.html')||basename.endsWith('.webmanifest')?'no-cache':
    publicAsset?'public, max-age=86400':'public, max-age=0');
}
