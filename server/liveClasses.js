import crypto from 'node:crypto';

export function validZoomLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
    ['zoom.us', 'zoom.com'].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {return false;}
}

export async function installLiveClasses(app, db, adminAuth, studentAuth) {
  await db.exec(`CREATE TABLE IF NOT EXISTS live_class_posts (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, message TEXT NOT NULL, kind TEXT NOT NULL,
    zoom_url TEXT NOT NULL, starts_at TEXT, state TEXT NOT NULL, deleted INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL, updated_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`);
  const shape = (row) => ({ id: row.id, title: row.title, message: row.message, kind: row.kind, zoomUrl: row.zoom_url,
    startsAt: row.starts_at, state: row.state, updatedAt: row.updated_at });
  function superadmin(req, res, next) {
    if (req.admin?.role !== 'super_admin') return res.status(403).json({ status: false, message: 'Only superadmins can manage live classes.' });
    return next();
  }
  function validate(body) {
    if (!body || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 180 ||
    typeof body.message !== 'string' || body.message.length > 6000 || !['class', 'update'].includes(body.kind) ||
    !['draft', 'published', 'ended', 'cancelled'].includes(body.state)) return null;
    const zoom = typeof body.zoomUrl === 'string' ? body.zoomUrl.trim() : '';
    if (zoom.length > 2000 || zoom && !validZoomLink(zoom) || body.kind === 'class' && body.state === 'published' && !zoom) return null;
    if (body.startsAt && (typeof body.startsAt !== 'string' || !Number.isFinite(Date.parse(body.startsAt)))) return null;
    return { title: body.title.trim(), message: body.message.trim(), kind: body.kind, zoom,
      startsAt: body.startsAt ? new Date(body.startsAt).toISOString() : null, state: body.state };
  }
  app.get('/api/admin/live-classes', adminAuth, superadmin, async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ status: true, data: (await db.prepare('SELECT * FROM live_class_posts WHERE deleted = 0 ORDER BY updated_at DESC').all()).map(shape) });
  });
  async function save(req, res) {
    const input = validate(req.body);
    if (!input) return res.status(400).json({ status: false, message: 'Check the title, update text, date and HTTPS Zoom link. Published classes require a Zoom link.' });
    if (req.params.id && !(await db.prepare('SELECT id FROM live_class_posts WHERE id = ? AND deleted = 0').get(req.params.id))) return res.status(404).json({ status: false, message: 'Post not found.' });
    const id = req.params.id || crypto.randomUUID(),now = new Date().toISOString();
    if (req.params.id) await db.prepare('UPDATE live_class_posts SET title=?, message=?, kind=?, zoom_url=?, starts_at=?, state=?, updated_by=?, updated_at=? WHERE id=?').run(input.title, input.message, input.kind, input.zoom, input.startsAt, input.state, req.admin.id, now, id);else
    await db.prepare('INSERT INTO live_class_posts VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)').run(id, input.title, input.message, input.kind, input.zoom, input.startsAt, input.state, req.admin.id, req.admin.id, now, now);
    res.json({ status: true, data: shape(await db.prepare('SELECT * FROM live_class_posts WHERE id = ?').get(id)) });
  }
  app.post('/api/admin/live-classes', adminAuth, superadmin, save);
  app.put('/api/admin/live-classes/:id', adminAuth, superadmin, save);
  app.delete('/api/admin/live-classes/:id', adminAuth, superadmin, async (req, res) => {
    const changed = await db.prepare('UPDATE live_class_posts SET deleted=1, updated_by=?, updated_at=? WHERE id=? AND deleted=0').run(req.admin.id, new Date().toISOString(), req.params.id);
    return res.status(changed.changes ? 200 : 404).json({ status: Boolean(changed.changes) });
  });
  app.get('/api/student/live-classes', async (req, res) => {
    if (!(await studentAuth(req))) return res.status(401).json({ status: false, message: 'Sign in to view classes.' });
    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ status: true, data: (await db.prepare("SELECT * FROM live_class_posts WHERE deleted=0 AND state <> 'draft' ORDER BY CASE state WHEN 'published' THEN 0 ELSE 1 END, COALESCE(starts_at, updated_at) DESC").all()).map((row) => ({ ...shape(row), zoomUrl: row.state === 'published' ? row.zoom_url : '' })) });
  });
}
