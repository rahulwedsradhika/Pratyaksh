export function subjectSummary(subject, chapterCount) {
  return {
    _id: subject.id,
    id: subject.id,
    courseID: subject.course_id,
    name: subject.name,
    detail: subject.detail,
    icon: subject.icon,
    img: typeof subject.img === 'string' ? subject.img : '',
    ...(chapterCount === undefined ? {} : { chapterCount, chaptersCount: chapterCount })
  };
}

export function createCourseDetailHandler(db) {
  return async (req, res) => {
    try {
      const course = await db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
      if (!course) return res.status(404).json({ status: false, message: 'Course not found' });
      const subjects = await db.prepare('SELECT * FROM subjects WHERE course_id = ? AND is_active=1').all(req.params.id);
      return res.json({
        status: true,
        message: 'Course retrieved successfully',
        data: {
          _id: course.id, name: course.name, detail: course.detail, img: course.img,
          price: course.price, discount_price: course.discount_price,
          categoryID: { _id: course.category_id, name: course.category_name },
          rating: course.rating, studentCount: course.student_count,
          subjects: subjects.map(subject => subjectSummary(subject))
        }
      });
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message });
    }
  };
}
