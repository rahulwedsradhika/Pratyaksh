import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, writeFile, unlink, rmdir, readFile, rm, readdir, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { installNoteFiles, noteSourcePath } from '../server/noteFiles.js';
import { storeVerifiedNote } from '../server/noteStorage.js';

async function fixture(options = {}) {
  const db = new DatabaseSync(':memory:');
  await db.exec('CREATE TABLE notes(id TEXT PRIMARY KEY, title TEXT, doc_path TEXT)');
  await db.prepare('INSERT INTO notes VALUES (?,?,?)').run('note1', 'Charaka Notes', 'upload/lecture notes.pdf');
  let handler;
  installNoteFiles({ get(route, fn) {handler = fn;} }, db, (req) => req.student, options);
  async function request({ user = true, id = 'note1', download = false } = {}) {
    const res = { code: 200, headers: {}, status(code) {this.code = code;return this;}, setHeader(key, value) {this.headers[key] = value;}, json(body) {this.body = body;return this;}, send(body) {this.body = body;return this;},sendFile(file,_options,done){readFile(file).then(data=>{this.body=data;done();},done);} };
    await handler({ student: user ? { id: 'learner' } : null, params: { id }, query: download ? { download: '1' } : {} }, res);
    return res;
  }
  return { db, request };
}

test('local PDF supports inline viewing and attachment download without fetching upstream', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'classroom-pdf-'));
  const file = path.join(root, 'lecture notes.pdf');
  await writeFile(file, '%PDF-1.4\nTest fixture\n%%EOF');
  const { db, request } = await fixture({ root, fetchImpl: () => {throw new Error('Must use local PDF');} });
  try {
    const view = await request();
    assert.equal(view.code, 200);
    assert.equal(view.headers['Content-Type'], 'application/pdf');
    assert.ok(view.headers['Content-Disposition'].startsWith('inline;'));
    const download = await request({ download: true });
    assert.ok(download.headers['Content-Disposition'].startsWith('attachment;'));
    assert.equal(download.body.toString(), view.body.toString());
    assert.equal((await request({ user: false })).code, 401);
    assert.equal((await request({ id: 'missing' })).code, 404);
  } finally {db.close();await unlink(file);await rmdir(root);}
});

test('upstream PDF requests preserve access errors and reject HTML responses', async t => {
  const base = await mkdtemp(path.join(tmpdir(), 'source-pdf-'));
  t.after(()=>rm(base,{recursive:true,force:true}));
  const missingRoot = path.join(base,'good');
  let seen;
  const good = await fixture({ root: missingRoot, fetchImpl: async (url, options) => {
      seen = { url, options };return new Response('%PDF-1.4\n%%EOF', { headers: { 'Content-Type': 'application/pdf' } });
    } });
  assert.equal((await good.request()).code, 200);
  assert.equal(seen.url, 'https://portal.pratyakshayurveda.in/upload/lecture%20notes.pdf');
  assert.equal(seen.options.redirect, 'error');good.db.close();
  for (const status of [401, 403, 404]) {
    const item = await fixture({ root: path.join(base,String(status)), fetchImpl: async () => new Response('', { status }) });
    assert.equal((await item.request()).code, status);item.db.close();
  }
  const html = await fixture({ root: path.join(base,'html'), fetchImpl: async () => new Response('<html>Not a PDF</html>') });
  assert.equal((await html.request()).code, 415);html.db.close();
});

test('a validated PDF is saved privately and subsequent views/downloads work with the provider offline', async t => {
  const base=await mkdtemp(path.join(tmpdir(),'durable-note-')),root=path.join(base,'notes');
  t.after(()=>rm(base,{recursive:true,force:true}));
  let calls=0;
  const pdf='%PDF-1.4\nDurable note fixture\n%%EOF';
  const {db,request}=await fixture({root,allowUpstream:true,fetchImpl:async()=>{calls++;if(calls>1)throw Error('Provider offline');return new Response(pdf);}});
  t.after(()=>db.close());
  assert.equal((await request({user:false})).code,401);assert.equal(calls,0);
  const first=await request();assert.equal(first.code,200);assert.equal(first.headers['X-Notes-Storage'],'permanent-cached');
  assert.equal(await readFile(path.join(root,'lecture notes.pdf'),'utf8'),pdf);
  const second=await request({download:true});assert.equal(second.code,200);assert.equal(second.headers['X-Notes-Storage'],'permanent');assert.equal(second.body.toString(),pdf);assert.match(second.headers['Content-Disposition'],/^attachment;/);assert.equal(calls,1);
  assert.deepEqual(await readdir(root),['lecture notes.pdf']);
});

test('local-only mode still fails closed for an untransferred PDF and makes no upstream request', async t => {
  const base=await mkdtemp(path.join(tmpdir(),'local-only-note-'));t.after(()=>rm(base,{recursive:true,force:true}));
  const {db,request}=await fixture({root:base,allowUpstream:false,fetchImpl:()=>assert.fail('Upstream must remain disabled')});t.after(()=>db.close());
  assert.equal((await request()).code,503);
});

test('private PDF caching never replaces an existing file or writes through an escaping directory', async t=>{
  const base=await mkdtemp(path.join(tmpdir(),'safe-cache-')),root=path.join(base,'notes'),outside=path.join(base,'outside');t.after(()=>rm(base,{recursive:true,force:true}));
  await mkdir(root);await mkdir(outside);
  const first=Buffer.from('%PDF-1.4\nOriginal\n%%EOF');
  await storeVerifiedNote(root,'note.pdf',first);
  await storeVerifiedNote(root,'note.pdf',Buffer.from('%PDF-1.4\nReplacement\n%%EOF'));
  assert.deepEqual(await readFile(path.join(root,'note.pdf')),first);
  await symlink(outside,path.join(root,'escape'),process.platform==='win32'?'junction':'dir');
  await assert.rejects(storeVerifiedNote(root,'escape/secret.pdf',first));
  assert.deepEqual(await readdir(outside),[]);
  for(const relative of ['../bad.pdf','/bad.pdf','bad\\file.pdf'])await assert.rejects(storeVerifiedNote(root,relative,first));
  await assert.rejects(storeVerifiedNote(root,'html.pdf',Buffer.from('<html>')));
});

test('note source is restricted to PDF files inside the configured upload directory', () => {
  assert.equal(noteSourcePath('upload/Charaka notes.pdf'), 'Charaka notes.pdf');
  assert.equal(noteSourcePath('https://portal.pratyakshayurveda.in/upload/Charaka%20notes.pdf'), 'Charaka notes.pdf');
  for (const value of ['upload/../secret.pdf', 'upload/%2e%2e/secret.pdf', 'upload/..\\secret.pdf', 'https://evil.example/upload/notes.pdf', 'upload/not-a-pdf.html']) assert.throws(() => noteSourcePath(value));
});
