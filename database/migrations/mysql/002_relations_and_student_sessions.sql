-- Proven relationships checked against the source before migration.
ALTER TABLE subjects ADD CONSTRAINT fk_subject_course FOREIGN KEY (course_id) REFERENCES courses(id);
ALTER TABLE modules ADD CONSTRAINT fk_module_subject FOREIGN KEY (subject_id) REFERENCES subjects(id);
ALTER TABLE chapters ADD CONSTRAINT fk_chapter_module FOREIGN KEY (module_id) REFERENCES modules(id);
ALTER TABLE videos ADD CONSTRAINT fk_video_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id);
ALTER TABLE notes ADD CONSTRAINT fk_note_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id);
ALTER TABLE questions ADD CONSTRAINT fk_question_paper FOREIGN KEY (paper_id) REFERENCES test_papers(id);
ALTER TABLE test_papers ADD CONSTRAINT fk_paper_series FOREIGN KEY (series_id) REFERENCES test_series(id);
ALTER TABLE student_tasks ADD CONSTRAINT fk_task_student FOREIGN KEY (student_id) REFERENCES students(id);
ALTER TABLE lecture_history ADD CONSTRAINT fk_lecture_history_student FOREIGN KEY (student_id) REFERENCES students(id);
ALTER TABLE student_saved_questions ADD CONSTRAINT fk_bookmark_student FOREIGN KEY (student_id) REFERENCES students(id);
ALTER TABLE user_auth_identities ADD CONSTRAINT fk_identity_student FOREIGN KEY (student_id) REFERENCES students(id);
CREATE TABLE IF NOT EXISTS student_sessions (
 token_hash CHAR(64) PRIMARY KEY, student_id VARCHAR(191) NOT NULL,
 expires_at VARCHAR(32) NOT NULL, revoked_at VARCHAR(32), created_at VARCHAR(32) NOT NULL,
 CONSTRAINT fk_student_session_student FOREIGN KEY (student_id) REFERENCES students(id),
 INDEX ix_student_session_user (student_id,expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE UNIQUE INDEX uk_membership_order_fulfillment ON memberships(order_ref);
