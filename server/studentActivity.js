import { asyncMap } from "./asyncCollections.js";import crypto from 'node:crypto';

export async function installStudentActivity(app, db, authenticate) {
  async function reviewWithOptions(result) {
    return { ...result, detailedReview: await asyncMap(result.detailedReview || [], async (item) => {
        if (Array.isArray(item.options) && item.options.length) return item;
        const source = await db.prepare('SELECT * FROM questions WHERE id = ?').get(item.questionId);
        if (!source) return item;
        return { ...item, options: ['a', 'b', 'c', 'd'].map((key) => ({ key: key.toUpperCase(), text: source[`option_${key}`] || '' })),
          explanation: item.explanation || source.explanation || '', reference: item.reference || source.reference_samhita || '' };
      }) };
  }
  async function withAnswer(question) {
    const source = await db.prepare('SELECT correct_option, explanation, reference_samhita FROM questions WHERE id = ?').get(question.id || question._id);
    const rawAnswer = source?.correct_option;
    const answer = String(rawAnswer || '').trim().toUpperCase();
    const correctOption = /^[A-D]$/.test(answer) ? answer : /^[1-4]$/.test(answer) ? ['A', 'B', 'C', 'D'][Number(answer) - 1] : null;
    return { ...question, correctOption, explanation: source?.explanation || '', samhitaReference: source?.reference_samhita || '' };
  }
  await db.exec(`
    CREATE TABLE IF NOT EXISTS lecture_history (
      student_id TEXT NOT NULL, lecture_id TEXT NOT NULL, chapter_id TEXT NOT NULL,
      title TEXT NOT NULL, chapter_title TEXT, position_seconds REAL DEFAULT 0,
      last_watched_at TEXT NOT NULL, PRIMARY KEY(student_id, lecture_id, chapter_id)
    );
    CREATE TABLE IF NOT EXISTS student_exam_history (
      id TEXT PRIMARY KEY, student_id TEXT NOT NULL, paper_id TEXT NOT NULL,
      title TEXT NOT NULL, completed_at TEXT NOT NULL, result_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS lecture_history_student ON lecture_history(student_id, last_watched_at);
    CREATE INDEX IF NOT EXISTS exam_history_student ON student_exam_history(student_id, completed_at);
    CREATE TABLE IF NOT EXISTS student_saved_questions (
      student_id TEXT NOT NULL, question_id TEXT NOT NULL, question_json TEXT NOT NULL,
      saved_at TEXT NOT NULL, PRIMARY KEY(student_id, question_id)
    );
  `);
  app.get('/api/student/bookmarks', async (req, res) => {
    const student = await authenticate(req);
    if (!student) return res.status(401).json({ status: false });
    const rows = await db.prepare('SELECT question_json, saved_at FROM student_saved_questions WHERE student_id = ? ORDER BY saved_at DESC').all(student.id);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ status: true, data: await asyncMap(rows, async (row) => ({ ...(await withAnswer(JSON.parse(row.question_json))), savedAt: row.saved_at })) });
  });
  app.get('/api/student/bookmarks/:id/answer', async (req, res) => {
    const student = await authenticate(req);
    if (!student) return res.status(401).json({ status: false });
    const row = await db.prepare('SELECT question_json FROM student_saved_questions WHERE student_id = ? AND question_id = ?').get(student.id, req.params.id);
    if (!row) return res.status(404).json({ status: false, message: 'Saved question not found.' });
    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ status: true, data: await withAnswer(JSON.parse(row.question_json)) });
  });
  app.post('/api/student/bookmarks', async (req, res) => {
    const student = await authenticate(req);
    if (!student) return res.status(401).json({ status: false });
    const input = req.body || {};
    const id = input._id || input.id;
    if (typeof id !== 'string' || !/^[\w-]{1,100}$/.test(id) || typeof input.question !== 'string' || input.question.length > 30000 || !input.question.trim()) {
      return res.status(400).json({ status: false, message: 'Invalid question.' });
    }
    const text = (value) => typeof value === 'string' ? value.slice(0, 30000) : '';
    const question = { id, _id: id, question: input.question, questionEng: text(input.questionEng),
      subject: text(input.subject), paperId: text(input.paperId).slice(0, 100), paperTitle: text(input.paperTitle).slice(0, 250),
      options: (Array.isArray(input.options) ? input.options : []).slice(0, 4).map((option) => ({ key: text(option?.key).slice(0, 1), text: text(option?.text) })) };
    const savedAt = new Date().toISOString();
    await db.prepare(`INSERT INTO student_saved_questions VALUES (?, ?, ?, ?)
      ON CONFLICT(student_id, question_id) DO UPDATE SET question_json=excluded.question_json, saved_at=excluded.saved_at
    `).run(student.id, id, JSON.stringify(question), savedAt);
    return res.json({ status: true, data: { ...(await withAnswer(question)), savedAt } });
  });
  app.delete('/api/student/bookmarks/:id', async (req, res) => {
    const student = await authenticate(req);
    if (!student) return res.status(401).json({ status: false });
    await db.prepare('DELETE FROM student_saved_questions WHERE student_id = ? AND question_id = ?').run(student.id, req.params.id);
    return res.json({ status: true });
  });
  app.get('/api/student/activity', async (req, res) => {
    const student = await authenticate(req);
    if (!student) return res.status(401).json({ status: false });
    const lectures = await db.prepare('SELECT * FROM lecture_history WHERE student_id = ? ORDER BY last_watched_at DESC LIMIT 50').all(student.id);
    const tests = (await db.prepare('SELECT * FROM student_exam_history WHERE student_id = ? ORDER BY completed_at DESC LIMIT 50').all(student.id)).map((row) => {
      const result = JSON.parse(row.result_json);
      return { id: row.id, title: row.title, completedAt: row.completed_at, score: result.score, totalMarks: result.totalMarks, accuracy: result.accuracy };
    });
    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ status: true, data: { lectures, tests } });
  });
  app.get('/api/student/performance', async (req, res) => {
    const student = await authenticate(req);
    if (!student) return res.status(401).json({ status: false });
    const attempts = (await db.prepare('SELECT * FROM student_exam_history WHERE student_id = ? ORDER BY completed_at DESC, id DESC').all(student.id)).map((row) => {
      const result = JSON.parse(row.result_json);
      return { id: row.id, paperTitle: row.title, date: row.completed_at, score: result.score,
        totalMarks: result.totalMarks, accuracy: result.accuracy, timeSpentSeconds: result.timeSpentSeconds };
    });
    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ status: true, data: { attempts } });
  });
  app.get('/api/student/activity/tests/:id', async (req, res) => {
    const student = await authenticate(req);
    if (!student) return res.status(401).json({ status: false });
    const row = await db.prepare('SELECT * FROM student_exam_history WHERE id = ? AND student_id = ?').get(req.params.id, student.id);
    if (!row) return res.status(404).json({ status: false, message: 'Test result not found.' });
    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ status: true, data: { result: await reviewWithOptions(JSON.parse(row.result_json)), paperTitle: row.title } });
  });
  app.post('/api/student/activity/lecture', async (req, res) => {
    const student = await authenticate(req);
    if (!student) return res.status(401).json({ status: false });
    const { lectureId, chapterId, positionSeconds } = req.body || {};
    if (typeof lectureId !== 'string' || typeof chapterId !== 'string' || lectureId.length > 100 || chapterId.length > 100) return res.status(400).json({ status: false });
    const lecture = await db.prepare('SELECT v.title, c.name chapter_title FROM videos v JOIN chapters c ON c.id = v.chapter_id WHERE v.id = ? AND c.id = ?').get(lectureId, chapterId);
    if (!lecture) return res.status(404).json({ status: false });
    const position = Number(positionSeconds);
    await db.prepare(`INSERT INTO lecture_history VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id, lecture_id, chapter_id) DO UPDATE SET title=excluded.title,
      chapter_title=excluded.chapter_title, position_seconds=COALESCE(excluded.position_seconds, lecture_history.position_seconds), last_watched_at=excluded.last_watched_at
    `).run(student.id, lectureId, chapterId, lecture.title, lecture.chapter_title, Number.isFinite(position) ? Math.max(0, Math.min(position, 86400)) : null, new Date().toISOString());
    return res.json({ status: true });
  });
  // Capture only results computed by the server, including the live gateway.
  app.use(async (req, res, next) => {
    if(process.env.PRATYAKSH_CONTENT_MODE==='local')return next(); // Local submissions already persist atomically.
    if (req.method !== 'POST' || !/^\/api\/test-response(?:\/|$)/.test(req.path)) return next();
    const student = await authenticate(req);
    if (!student) return next();
    const originalJson = res.json.bind(res);
    res.json = async (payload) => {
      if (payload?.status && payload.data && Number.isFinite(payload.data.score)) {
        const paperId = String(req.body?.paperId || '').slice(0, 100);
        const paper = await db.prepare('SELECT title FROM test_papers WHERE id = ?').get(paperId);
        const result = payload.data;
        const id = result.attemptId || crypto.randomUUID();
        await db.prepare('INSERT OR IGNORE INTO student_exam_history VALUES (?, ?, ?, ?, ?, ?)').run(id, student.id, paperId, paper?.title || String(req.body?.paperTitle || 'Test').slice(0, 250), new Date().toISOString(), JSON.stringify(result));
      }
      return originalJson(payload);
    };
    next();
  });
}
