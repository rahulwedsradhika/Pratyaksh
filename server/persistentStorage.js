import path from 'node:path';import fs from 'node:fs';
const configured=process.env.PERSISTENT_STORAGE_DIR;
export const storageRoot=configured?path.resolve(configured):null;
export function storageDirectory(kind){
  if(!['branding','uploads','notes'].includes(kind))throw Error('Unknown persistent storage category.');
  const directory=storageRoot?path.join(storageRoot,kind):path.resolve(kind==='branding'?'public/assets/checkout-branding':kind==='notes'?'.local-content/notes':'public/assets/upload');
  fs.mkdirSync(directory,{recursive:true});return directory;
}
