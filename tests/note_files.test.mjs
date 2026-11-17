import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, writeFile, unlink, rmdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { installNoteFiles, noteSourcePath } from '../server/noteFiles.js';

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

test('upstream PDF requests preserve access errors and reject HTML responses', async () => {
  const missingRoot = path.join(tmpdir(), `missing-notes-${Date.now()}`);
  let seen;
  const good = await fixture({ root: missingRoot, fetchImpl: async (url, options) => {
      seen = { url, options };return new Response('%PDF-1.4\n%%EOF', { headers: { 'Content-Type': 'application/pdf' } });
    } });
  assert.equal((await good.request()).code, 200);
  assert.equal(seen.url, 'https://portal.pratyakshayurveda.in/upload/lecture%20notes.pdf');
  assert.equal(seen.options.redirect, 'error');good.db.close();
  for (const status of [401, 403, 404]) {
    const item = await fixture({ root: missingRoot, fetchImpl: async () => new Response('', { status }) });
    assert.equal((await item.request()).code, status);item.db.close();
  }
  const html = await fixture({ root: missingRoot, fetchImpl: async () => new Response('<html>Not a PDF</html>') });
  assert.equal((await html.request()).code, 415);html.db.close();
});

test('note source is restricted to PDF files inside the configured upload directory', () => {
  assert.equal(noteSourcePath('upload/Charaka notes.pdf'), 'Charaka notes.pdf');
  assert.equal(noteSourcePath('https://portal.pratyakshayurveda.in/upload/Charaka%20notes.pdf'), 'Charaka notes.pdf');
  for (const value of ['upload/../secret.pdf', 'upload/%2e%2e/secret.pdf', 'upload/..\\secret.pdf', 'https://evil.example/upload/notes.pdf', 'upload/not-a-pdf.html']) assert.throws(() => noteSourcePath(value));
});
