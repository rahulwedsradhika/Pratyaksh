CREATE TABLE IF NOT EXISTS test_paper_questions (
 paper_id VARCHAR(191) NOT NULL,question_id VARCHAR(191) NOT NULL,position INT NOT NULL,
 question_snapshot LONGTEXT NULL,
 PRIMARY KEY(paper_id,question_id),UNIQUE KEY uk_paper_question_position(paper_id,position),
 CONSTRAINT fk_paper_question_paper FOREIGN KEY(paper_id) REFERENCES test_papers(id),
 CONSTRAINT fk_paper_question_question FOREIGN KEY(question_id) REFERENCES questions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
