import fs from 'node:fs/promises';
import path from 'node:path';
import { contentSourceHeaders } from './contentSourceAuth.js';
import {storageDirectory} from './persistentStorage.js';

export function noteSourcePath(value) {
  let relative = String(value || '');
  if (relative.startsWith('https://')) {
    const url = new URL(relative);
    if (url.origin !== 'https://portal.pratyakshayurveda.in') throw new Error('Invalid note source');
    relative = url.pathname;
  }
  relative = decodeURIComponent(relative).replace(/^\/+/, '');
  if (!relative.startsWith('upload/') || !relative.toLowerCase().endsWith('.pdf') || relative.includes('\\') || relative.includes('\0') || relative.split('/').some((part) => part === '..' || part === '.')) throw new Error('Invalid note source');
  return relative.slice('upload/'.length);
}

export function installNoteFiles(app, db, authenticate, { fetchImpl = globalThis.fetch, root = storageDirectory('notes') } = {}) {
  app.get('/api/student/notes/:id/file', async (req, res) => {
    if (!(await authenticate(req))) return res.status(401).json({ status: false, message: 'Sign in to open notes.' });
    const note = await db.prepare('SELECT title, doc_path FROM notes WHERE id = ?').get(req.params.id);
    if (!note) return res.status(404).json({ status: false, message: 'Notes not found.' });
    try {
      const relative = noteSourcePath(note.doc_path);
      const maxBytes = 100 * 1024 * 1024;
      let data;
      const setHeaders=()=>{
        const name=(note.title||'Lecture notes').replace(/[\r\n"/\\]/g,'').slice(0,120)+'.pdf';
        res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition',`${req.query.download==='1'?'attachment':'inline'}; filename="notes.pdf"; filename*=UTF-8''${encodeURIComponent(name)}`);res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');
      };
      try {
        const resolvedRoot = await fs.realpath(root);
        const local = await fs.realpath(path.join(resolvedRoot, relative));
        if (!local.startsWith(resolvedRoot + path.sep)) throw new Error('Invalid file path');
        const stat = await fs.stat(local);
        if (stat.size > maxBytes) return res.status(413).json({ status: false, message: 'This PDF is too large.' });
        const handle=await fs.open(local,'r'),head=Buffer.alloc(5);
        try{await handle.read(head,0,5,0);}finally{await handle.close();}
        if(head.toString()!=='%PDF-')return res.status(415).json({status:false,message:'The stored file is not a valid PDF.'});
        setHeaders();
        // sendFile streams and supports HTTP Range requests used by Safari's PDF viewer.
        await new Promise((resolve,reject)=>res.sendFile(local,{dotfiles:'allow',cacheControl:false},error=>error?reject(error):resolve()));
        return;
      } catch (error) {
        if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error;
      }
      if (!data) {
        if(process.env.NOTES_ALLOW_UPSTREAM_FALLBACK==='false')return res.status(503).json({status:false,message:'These notes have not yet been transferred to permanent storage.'});
        const url = 'https://portal.pratyakshayurveda.in/upload/' + relative.split('/').map(encodeURIComponent).join('/');
        const response = await fetchImpl(url, { headers: { ...contentSourceHeaders(process.env.PRATYAKSH_CONTENT_TOKEN), Accept: 'application/pdf' }, redirect: 'error', signal: AbortSignal.timeout(15000) });
        if (!response.ok) return res.status([401, 403, 404].includes(response.status) ? response.status : 502).json({ status: false, message: 'This PDF is unavailable from the notes provider. Please try again later.' });
        if (Number(response.headers.get('content-length')) > maxBytes) return res.status(413).json({ status: false, message: 'This PDF is too large.' });
        const chunks=[];let bytes=0;const reader=response.body.getReader();
        try{while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.length;if(bytes>maxBytes){await reader.cancel();return res.status(413).json({status:false,message:'This PDF is too large.'});}chunks.push(Buffer.from(chunk.value));}}finally{reader.releaseLock();}
        data = Buffer.concat(chunks);
      }
      if (data.length > maxBytes || data.subarray(0, 5).toString() !== '%PDF-') return res.status(415).json({ status: false, message: 'The notes provider did not return a valid PDF.' });
      setHeaders();
      return res.send(data);
    } catch {
      if(res.headersSent){res.destroy?.();return;}
      return res.status(503).json({ status: false, message: 'Notes could not be loaded. Please retry shortly.' });
    }
  });
}
