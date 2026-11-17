CREATE INDEX ix_student_tasks_timeline ON student_tasks(student_id,deleted,created_at(32));
CREATE INDEX ix_payment_student_timeline ON payment_orders(student_id,created_at(32));
CREATE INDEX ix_attempt_student_timeline ON test_attempts(student_id,completed_at(32));
CREATE INDEX ix_otp_email_purpose ON student_otps(email,purpose(32),created_at(32));
