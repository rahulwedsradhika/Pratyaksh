import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { installLiveClasses, validZoomLink } from '../server/liveClasses.js';

async function fixture() {
  const db = new DatabaseSync(':memory:');
  const routes = new Map(),app = {};
  for (const method of ['get', 'post', 'put', 'delete']) app[method] = (path, ...handlers) => routes.set(`${method} ${path}`, handlers);
  await installLiveClasses(app, db, (req, res, next) => req.admin ? next() : res.status(401).json({ status: false }), (req) => req.student);
  async function call(route, request = {}) {
    const req = { params: {}, ...request };
    let complete;const finished=new Promise(resolve=>complete=resolve);
    const res = { code: 200, setHeader() {}, status(code) {this.code = code;return this;}, json(body) {this.body = body;complete();return this;} };
    const handlers = routes.get(route);let index = 0;
    const next = () => handlers[index++]?.(req, res, next);
    await next();await finished;return res;
  }
  return { db, call };
}
const admin = { id: 'owner', role: 'super_admin' };
const post = { title: 'Charaka discussion', message: 'Bring your notes.', kind: 'class', zoomUrl: 'https://us02web.zoom.us/j/123456789?pwd=passcode', startsAt: '2026-12-01T12:00:00+05:30', state: 'draft' };

test('only superadmins can list, publish, edit or archive announcements', async () => {
  const { db, call } = await fixture();
  for (const route of ['get /api/admin/live-classes', 'post /api/admin/live-classes', 'put /api/admin/live-classes/:id', 'delete /api/admin/live-classes/:id']) {
    assert.equal((await call(route)).code, 401);
    for (const role of ['admissions_staff', 'finance_staff', 'support_staff']) assert.equal((await call(route, { admin: { id: 'staff', role }, body: post, params: { id: 'unknown' } })).code, 403);
  }
  assert.equal((await call('get /api/student/live-classes')).code, 401);
  db.close();
});

test('drafts stay private; published classes and updates appear; cancelled and archived classes cannot be joined', async () => {
  const { db, call } = await fixture();
  let result = await call('post /api/admin/live-classes', { admin, body: post });
  assert.equal(result.body.status, true);const id = result.body.data.id;
  const student = { id: 'student1' };
  assert.equal((await call('get /api/student/live-classes', { student })).body.data.length, 0);
  result = await call('put /api/admin/live-classes/:id', { admin, params: { id }, body: { ...post, state: 'published' } });
  assert.equal(result.body.data.startsAt, '2026-12-01T06:30:00.000Z');
  assert.equal((await call('get /api/student/live-classes', { student })).body.data[0].zoomUrl, post.zoomUrl);
  await call('post /api/admin/live-classes', { admin, body: { ...post, kind: 'update', state: 'published', title: 'Schedule update', zoomUrl: '' } });
  assert.equal((await call('get /api/student/live-classes', { student })).body.data.length, 2);
  await call('put /api/admin/live-classes/:id', { admin, params: { id }, body: { ...post, state: 'cancelled' } });
  assert.equal((await call('get /api/student/live-classes', { student })).body.data.find((row) => row.id === id).zoomUrl, '');
  await call('delete /api/admin/live-classes/:id', { admin, params: { id } });
  assert.equal((await call('get /api/student/live-classes', { student })).body.data.length, 1);
  assert.equal((await db.prepare('SELECT deleted FROM live_class_posts WHERE id=?').get(id)).deleted, 1);
  db.close();
});

test('invalid content and deceptive meeting URLs are rejected', async () => {
  const { db, call } = await fixture();
  for (const url of ['javascript:alert(1)', 'http://zoom.us/j/1', 'https://zoom.us.evil.example/j/1', 'https://evilzoom.us/j/1', 'https://user:pass@zoom.us/j/1']) assert.equal(validZoomLink(url), false);
  assert.equal(validZoomLink(post.zoomUrl), true);
  for (const change of [{ title: ' ' }, { title: 'x'.repeat(181) }, { zoomUrl: 'https://example.com' }, { startsAt: 'not a date' }, { state: 'published', zoomUrl: '' }]) {
    assert.equal((await call('post /api/admin/live-classes', { admin, body: { ...post, ...change } })).code, 400);
  }
  db.close();
});

test('unpublish hides both classes and announcements; delete removes them from both lists', async () => {
  const { db, call } = await fixture();const student = { id: 'student1' };
  for (const kind of ['class', 'update']) {
    const published = { ...post, kind, state: 'published' };
    const created = (await call('post /api/admin/live-classes', { admin, body: published })).body.data;
    assert.ok((await call('get /api/student/live-classes', { student })).body.data.some((p) => p.id === created.id));
    await call('put /api/admin/live-classes/:id', { admin, params: { id: created.id }, body: { ...published, state: 'draft' } });
    assert.equal((await call('get /api/student/live-classes', { student })).body.data.some((p) => p.id === created.id), false);
    assert.equal((await call('get /api/admin/live-classes', { admin })).body.data.find((p) => p.id === created.id).state, 'draft');
    await call('delete /api/admin/live-classes/:id', { admin, params: { id: created.id } });
    assert.equal((await call('get /api/admin/live-classes', { admin })).body.data.some((p) => p.id === created.id), false);
    assert.equal((await db.prepare('SELECT deleted FROM live_class_posts WHERE id=?').get(created.id)).deleted, 1);
  }
  db.close();
});
