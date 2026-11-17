export function validAvatar(value) {
  if (typeof value !== 'string' || value.length > 90000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
  const bytes = Buffer.from(value.split(',')[1], 'base64');
  return bytes.length > 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes.at(-2) === 255 && bytes.at(-1) === 217;
}

export function installStudentAvatar(app, db, authenticate) {
  app.put('/api/student/avatar', async (req, res) => {
    const student = await authenticate(req);
    if (!student) return res.status(401).json({ status: false, message: 'Sign in to update your photo.' });
    if (!validAvatar(req.body?.image)) return res.status(400).json({ status: false, message: 'Please choose a valid profile photo.' });
    await db.prepare('UPDATE students SET avatar_url = ?, updated_at = ? WHERE id = ?').run(req.body.image, new Date().toISOString(), student.id);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ status: true });
  });
}
