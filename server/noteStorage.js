import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Only complete, validated files become visible. Never replace an existing file.
export async function storeVerifiedNote(root, relative, data) {
  if (!Buffer.isBuffer(data) || data.subarray(0,5).toString() !== '%PDF-') throw Error('Invalid PDF');
  if (!relative || relative.includes('\\') || relative.includes('\0') || path.isAbsolute(relative) || relative.split('/').some(p => !p || p === '.' || p === '..')) throw Error('Invalid note path');
  await fs.mkdir(root, {recursive:true,mode:0o700});
  const resolvedRoot = await fs.realpath(root);
  const segments = relative.split('/');
  let parent = resolvedRoot;
  for (const segment of segments.slice(0,-1)) {
    parent = path.join(parent, segment);
    await fs.mkdir(parent, {mode:0o700}).catch(error => {if (error.code !== 'EEXIST') throw error;});
    const real = await fs.realpath(parent);
    if (!real.startsWith(resolvedRoot + path.sep)) throw Error('Invalid note path');
    parent = real;
  }
  const target = path.join(parent, segments.at(-1));
  const temporary = path.join(parent, '.note-cache-' + crypto.randomUUID() + '.tmp');
  try {
    await fs.writeFile(temporary, data, {flag:'wx',mode:0o600});
    await fs.link(temporary, target).catch(error => {if (error.code !== 'EEXIST') throw error;});
  } finally {
    await fs.unlink(temporary).catch(() => {});
  }
}
