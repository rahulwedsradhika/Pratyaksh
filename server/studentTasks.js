import crypto from 'node:crypto';

export async function installStudentTasks(app, db, authenticate) {
  await db.exec(`CREATE TABLE IF NOT EXISTS student_tasks (
    id TEXT PRIMARY KEY, student_id TEXT NOT NULL, title TEXT NOT NULL,
    category TEXT NOT NULL, priority TEXT NOT NULL, due_date TEXT,
    notes TEXT NOT NULL DEFAULT '', done INTEGER NOT NULL DEFAULT 0,
    deleted INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  ); CREATE INDEX IF NOT EXISTS student_tasks_owner ON student_tasks(student_id, deleted);`);
  const categories = new Set(['Reading', 'Lecture', 'Revision', 'Test', 'Other']);
  const priorities = new Set(['Low', 'Medium', 'High']);
  function validate(body) {
    if (!body || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200 ||
    !categories.has(body.category) || !priorities.has(body.priority) ||
    typeof body.notes !== 'string' || body.notes.length > 3000 || typeof body.done !== 'boolean') return null;
    const date = body.dueDate || null;
    if (date && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) return null;
    return { title: body.title.trim(), category: body.category, priority: body.priority, notes: body.notes.trim(), date, done: body.done ? 1 : 0 };
  }
  const shape = (row) => ({ id: row.id, title: row.title, category: row.category, priority: row.priority, dueDate: row.due_date || '', notes: row.notes, done: Boolean(row.done), createdAt: row.created_at });
  app.get('/api/student/tasks', async (req, res) => {
    const student = await authenticate(req);
    if (!student) return res.status(401).json({ status: false });
    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ status: true, data: (await db.prepare('SELECT * FROM student_tasks WHERE student_id = ? AND deleted = 0 ORDER BY created_at DESC, id').all(student.id)).map(shape) });
  });
  app.post('/api/student/tasks', async (req, res) => {
    const student = await authenticate(req);
    if (!student) return res.status(401).json({ status: false });
    const value = validate(req.body);
    if (!value) return res.status(400).json({ status: false, message: 'Check the task title, category, priority and due date.' });
    const id = crypto.randomUUID(),now = new Date().toISOString();
    await db.prepare('INSERT INTO student_tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)').run(id, student.id, value.title, value.category, value.priority, value.date, value.notes, value.done, now, now);
    return res.status(201).json({ status: true, data: shape(await db.prepare('SELECT * FROM student_tasks WHERE id = ?').get(id)) });
  });
  app.patch('/api/student/tasks/:id', async (req, res) => {
    const student = await authenticate(req);
    if (!student) return res.status(401).json({ status: false });
    const row = await db.prepare('SELECT * FROM student_tasks WHERE id = ? AND student_id = ? AND deleted = 0').get(req.params.id, student.id);
    if (!row) return res.status(404).json({ status: false, message: 'Task not found.' });
    const value = validate(req.body);
    if (!value) return res.status(400).json({ status: false, message: 'Please check the task details.' });
    await db.prepare('UPDATE student_tasks SET title=?, category=?, priority=?, due_date=?, notes=?, done=?, updated_at=? WHERE id=? AND student_id=?').run(value.title, value.category, value.priority, value.date, value.notes, value.done, new Date().toISOString(), row.id, student.id);
    return res.json({ status: true, data: shape(await db.prepare('SELECT * FROM student_tasks WHERE id = ?').get(row.id)) });
  });
  for (const [method, deleted] of [['delete', 1], ['post', 0]]) {
    app[method](`/api/student/tasks/:id${deleted ? '' : '/restore'}`, async (req, res) => {
      const student = await authenticate(req);
      if (!student) return res.status(401).json({ status: false });
      const row = await db.prepare('SELECT * FROM student_tasks WHERE id = ? AND student_id = ?').get(req.params.id, student.id);
      if (!row) return res.status(404).json({ status: false, message: 'Task not found.' });
      await db.prepare('UPDATE student_tasks SET deleted=?, updated_at=? WHERE id=? AND student_id=?').run(deleted, new Date().toISOString(), row.id, student.id);
      return res.json({ status: true, data: shape(row) });
    });
  }
}
