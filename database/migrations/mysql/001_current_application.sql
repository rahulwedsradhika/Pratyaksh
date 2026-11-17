-- Baseline v2: complete current application schema, no user data.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  `id` VARCHAR(191) NOT NULL,
  `admin_id` VARCHAR(191) NOT NULL,
  `admin_name` LONGTEXT NOT NULL,
  `action` LONGTEXT NOT NULL,
  `entity_type` LONGTEXT NOT NULL,
  `entity_id` VARCHAR(191) NOT NULL,
  `details_json` LONGTEXT NULL,
  `ip_address` LONGTEXT NULL,
  `created_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `admin_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `admin_id` VARCHAR(191) NOT NULL,
  `token_hash` VARCHAR(191) NOT NULL,
  `expires_at` VARCHAR(191) NOT NULL,
  `revoked_at` LONGTEXT NULL,
  `created_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_admin_sessions_1` (`expires_at`),
  KEY `ix_admin_sessions_2` (`admin_id`),
  UNIQUE KEY `ix_admin_sessions_3` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` LONGTEXT NOT NULL,
  `full_name` LONGTEXT NOT NULL,
  `role` VARCHAR(512) NOT NULL DEFAULT 'super_admin',
  `is_active` BIGINT NULL DEFAULT 1,
  `mfa_enabled` BIGINT NULL DEFAULT 0,
  `mfa_secret` LONGTEXT NULL,
  `avatar_url` LONGTEXT NULL,
  `phone` LONGTEXT NULL,
  `last_login_at` LONGTEXT NULL,
  `created_at` LONGTEXT NOT NULL,
  `updated_at` LONGTEXT NOT NULL,
  `address` VARCHAR(512) NOT NULL DEFAULT '',
  `onboarding_complete` BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_admin_users_1` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `auth_activity_logs` (
  `id` VARCHAR(191) NOT NULL,
  `user_type` VARCHAR(512) NOT NULL DEFAULT 'student',
  `user_id` VARCHAR(191) NULL,
  `email` VARCHAR(191) NOT NULL,
  `provider` LONGTEXT NOT NULL,
  `action` LONGTEXT NOT NULL,
  `status` LONGTEXT NOT NULL,
  `ip_address` LONGTEXT NULL,
  `error_reason` LONGTEXT NULL,
  `details_json` LONGTEXT NULL,
  `created_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `authentication_settings` (
  `id` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL DEFAULT 'google',
  `environment` VARCHAR(191) NOT NULL DEFAULT 'development',
  `client_id` VARCHAR(191) NULL,
  `is_enabled` BIGINT NOT NULL DEFAULT 0,
  `updated_by` LONGTEXT NULL,
  `updated_by_name` LONGTEXT NULL,
  `last_tested_at` LONGTEXT NULL,
  `last_test_status` LONGTEXT NULL,
  `last_test_error` LONGTEXT NULL,
  `created_at` LONGTEXT NOT NULL,
  `updated_at` LONGTEXT NOT NULL,
  `client_secret` LONGTEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_authentication_settings_1` (`provider`,`environment`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `bank_credit_alerts` (
  `id` VARCHAR(191) NOT NULL,
  `connection_id` VARCHAR(191) NULL,
  `bank_name` LONGTEXT NOT NULL,
  `email_message_id` VARCHAR(191) NOT NULL,
  `received_at` LONGTEXT NOT NULL,
  `sender_email` LONGTEXT NOT NULL,
  `subject` LONGTEXT NOT NULL,
  `raw_snippet` LONGTEXT NULL,
  `credit_amount_paise` BIGINT NOT NULL,
  `credit_amount_formatted` LONGTEXT NOT NULL,
  `utr_number` LONGTEXT NOT NULL,
  `remitter_vpa` LONGTEXT NULL,
  `remitter_name` LONGTEXT NULL,
  `match_status` VARCHAR(512) NULL DEFAULT 'unmatched',
  `matched_order_id` VARCHAR(191) NULL,
  `match_confidence` DOUBLE NULL DEFAULT 0.0,
  `match_reason` LONGTEXT NULL,
  `processed_by_admin` LONGTEXT NULL,
  `processed_at` LONGTEXT NULL,
  `created_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_bank_credit_alerts_1` (`email_message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `bank_email_connections` (
  `id` VARCHAR(191) NOT NULL,
  `admin_id` VARCHAR(191) NOT NULL,
  `email_address` LONGTEXT NOT NULL,
  `refresh_token` LONGTEXT NOT NULL,
  `is_connected` BIGINT NULL DEFAULT 1,
  `last_sync_at` LONGTEXT NULL,
  `last_sync_status` LONGTEXT NULL,
  `error_message` LONGTEXT NULL,
  `total_emails_synced` BIGINT NULL DEFAULT 0,
  `created_at` LONGTEXT NOT NULL,
  `updated_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `bank_sender_rules` (
  `id` VARCHAR(191) NOT NULL,
  `bank_name` LONGTEXT NOT NULL,
  `sender_email_pattern` LONGTEXT NOT NULL,
  `subject_pattern` LONGTEXT NOT NULL,
  `body_parser_regex` LONGTEXT NOT NULL,
  `is_active` BIGINT NULL DEFAULT 1,
  `created_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `blogs` (
  `id` VARCHAR(191) NOT NULL,
  `title` LONGTEXT NULL,
  `slug` LONGTEXT NULL,
  `excerpt` LONGTEXT NULL,
  `content` LONGTEXT NULL,
  `author` LONGTEXT NULL,
  `img` LONGTEXT NULL,
  `published_at` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` VARCHAR(191) NOT NULL,
  `student_id` VARCHAR(191) NULL,
  `course_id` VARCHAR(191) NULL,
  `course_name` LONGTEXT NULL,
  `price` DECIMAL(14,2) NULL,
  `img` LONGTEXT NULL,
  `added_at` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(191) NOT NULL,
  `name` LONGTEXT NOT NULL,
  `tab` LONGTEXT NULL,
  `detail` LONGTEXT NULL,
  `img` LONGTEXT NULL,
  `is_active` BIGINT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `chapter_practice_tests` (
  `chapter_id` VARCHAR(191) NOT NULL,
  `test_id` VARCHAR(191) NOT NULL,
  `title` LONGTEXT NULL,
  `total_questions` BIGINT NULL,
  `order_num` BIGINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`chapter_id`,`test_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `chapters` (
  `id` VARCHAR(191) NOT NULL,
  `module_id` VARCHAR(191) NULL,
  `subject_id` VARCHAR(191) NULL,
  `course_id` VARCHAR(191) NULL,
  `name` LONGTEXT NOT NULL,
  `description` LONGTEXT NULL,
  `faculty` LONGTEXT NULL,
  `img` LONGTEXT NULL,
  `order_num` BIGINT NULL DEFAULT 1,
  `is_active` BIGINT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `coupon_reservations` (
  `order_id` VARCHAR(191) NOT NULL,
  `coupon_id` VARCHAR(191) NOT NULL,
  `state` VARCHAR(512) NOT NULL DEFAULT 'reserved',
  `created_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `coupons` (
  `id` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `discount_type` LONGTEXT NOT NULL,
  `discount_value` DECIMAL(14,2) NOT NULL,
  `min_order_amount` DECIMAL(14,2) NULL DEFAULT 0,
  `max_discount_amount` DECIMAL(14,2) NULL,
  `valid_from` LONGTEXT NOT NULL,
  `valid_until` LONGTEXT NOT NULL,
  `usage_limit` BIGINT NULL DEFAULT 100,
  `times_used` BIGINT NULL DEFAULT 0,
  `is_active` BIGINT NULL DEFAULT 1,
  `created_at` LONGTEXT NOT NULL,
  `deleted_at` LONGTEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_coupons_1` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `courses` (
  `id` VARCHAR(191) NOT NULL,
  `category_id` VARCHAR(191) NULL,
  `category_name` LONGTEXT NULL,
  `name` LONGTEXT NOT NULL,
  `detail` LONGTEXT NULL,
  `img` LONGTEXT NULL,
  `price` DECIMAL(14,2) NULL DEFAULT 0,
  `discount_price` DECIMAL(14,2) NULL DEFAULT 0,
  `is_active` BIGINT NULL DEFAULT 1,
  `rating` DOUBLE NULL DEFAULT 4.9,
  `student_count` BIGINT NULL DEFAULT 1250,
  `purchase_type` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `demo_cleanup_archive` (
  `sequence` BIGINT NOT NULL,
  `run_id` VARCHAR(191) NOT NULL,
  `table_name` LONGTEXT NOT NULL,
  `record_json` LONGTEXT NOT NULL,
  `archived_at` LONGTEXT NOT NULL,
  `restored_at` LONGTEXT NULL,
  PRIMARY KEY (`sequence`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `email_drafts` (
  `id` VARCHAR(191) NOT NULL,
  `admin_user_id` VARCHAR(191) NOT NULL,
  `recipient` LONGTEXT NULL,
  `subject` LONGTEXT NULL,
  `body` LONGTEXT NULL,
  `template_key` LONGTEXT NULL,
  `created_at` LONGTEXT NOT NULL,
  `updated_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` VARCHAR(191) NOT NULL,
  `recipient` LONGTEXT NOT NULL,
  `subject` LONGTEXT NOT NULL,
  `template_key` LONGTEXT NULL,
  `message_id` VARCHAR(191) NULL,
  `submission_status` VARCHAR(512) NOT NULL DEFAULT 'Pending',
  `sanitized_error` LONGTEXT NULL,
  `body_preview` LONGTEXT NULL,
  `created_at` LONGTEXT NOT NULL,
  `submitted_at` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `email_settings` (
  `id` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(512) NOT NULL DEFAULT 'Hostinger Email',
  `smtp_host` VARCHAR(512) NOT NULL DEFAULT 'smtp.hostinger.com',
  `smtp_port` BIGINT NOT NULL DEFAULT 465,
  `smtp_security` VARCHAR(512) NOT NULL DEFAULT 'SSL/TLS',
  `smtp_username` VARCHAR(512) NOT NULL DEFAULT 'noreply@ayurvedasidhi.com',
  `sender_name` VARCHAR(512) NOT NULL DEFAULT 'Ayurvedasidhi',
  `sender_email` VARCHAR(512) NOT NULL DEFAULT 'noreply@ayurvedasidhi.com',
  `last_verified_at` LONGTEXT NULL,
  `last_verification_status` LONGTEXT NULL,
  `last_verification_error` LONGTEXT NULL,
  `updated_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `email_template_backups` (
  `version` VARCHAR(191) NOT NULL,
  `template_key` VARCHAR(191) NOT NULL,
  `template_json` LONGTEXT NOT NULL,
  `backed_up_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`version`,`template_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `email_template_upgrades` (
  `version` VARCHAR(191) NOT NULL,
  `applied_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `email_templates` (
  `id` VARCHAR(191) NOT NULL,
  `template_key` VARCHAR(191) NOT NULL,
  `name` LONGTEXT NOT NULL,
  `category` VARCHAR(512) NOT NULL DEFAULT 'notification',
  `subject` LONGTEXT NOT NULL,
  `html_body` LONGTEXT NOT NULL,
  `text_body` LONGTEXT NOT NULL,
  `variables_json` LONGTEXT NULL,
  `enabled` BIGINT NOT NULL DEFAULT 1,
  `updated_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_email_templates_1` (`template_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `faculty` (
  `id` VARCHAR(191) NOT NULL,
  `name` LONGTEXT NOT NULL,
  `qualification` LONGTEXT NULL,
  `specialization` LONGTEXT NULL,
  `designation` LONGTEXT NULL,
  `detail` LONGTEXT NULL,
  `img` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `gateway_diagnostic_orders` (
  `id` VARCHAR(191) NOT NULL,
  `admin_id` VARCHAR(191) NOT NULL,
  `provider_order_id` VARCHAR(191) NULL,
  `amount_paise` BIGINT NOT NULL,
  `status` LONGTEXT NOT NULL,
  `payment_id` VARCHAR(191) NULL,
  `created_at` LONGTEXT NOT NULL,
  `verified_at` LONGTEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_gateway_diagnostic_orders_1` (`provider_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `gateway_profiles` (
  `mode` VARCHAR(191) NOT NULL,
  `key_id` VARCHAR(191) NOT NULL DEFAULT '',
  `key_secret` VARCHAR(512) NOT NULL DEFAULT '',
  `webhook_secret` VARCHAR(512) NOT NULL DEFAULT '',
  `verified_at` LONGTEXT NULL,
  `updated_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`mode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `gateway_webhook_receipts` (
  `event_id` VARCHAR(191) NOT NULL,
  `mode` LONGTEXT NOT NULL,
  `event_type` LONGTEXT NOT NULL,
  `received_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `inquiries` (
  `id` VARCHAR(191) NOT NULL,
  `name` LONGTEXT NULL,
  `email` VARCHAR(191) NULL,
  `phone` LONGTEXT NULL,
  `message` LONGTEXT NULL,
  `created_at` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `lecture_history` (
  `student_id` VARCHAR(191) NOT NULL,
  `lecture_id` VARCHAR(191) NOT NULL,
  `chapter_id` VARCHAR(191) NOT NULL,
  `title` LONGTEXT NOT NULL,
  `chapter_title` LONGTEXT NULL,
  `position_seconds` DOUBLE NULL DEFAULT 0,
  `last_watched_at` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`student_id`,`lecture_id`,`chapter_id`),
  KEY `ix_lecture_history_1` (`student_id`,`last_watched_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `lessons` (
  `id` VARCHAR(191) NOT NULL,
  `chapter_id` VARCHAR(191) NULL,
  `title` LONGTEXT NOT NULL,
  `duration` LONGTEXT NULL,
  `video_url` LONGTEXT NULL,
  `notes_url` LONGTEXT NULL,
  `description` LONGTEXT NULL,
  `order_num` BIGINT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `live_class_posts` (
  `id` VARCHAR(191) NOT NULL,
  `title` LONGTEXT NOT NULL,
  `message` LONGTEXT NOT NULL,
  `kind` LONGTEXT NOT NULL,
  `zoom_url` LONGTEXT NOT NULL,
  `starts_at` LONGTEXT NULL,
  `state` LONGTEXT NOT NULL,
  `deleted` BIGINT NOT NULL DEFAULT 0,
  `created_by` LONGTEXT NOT NULL,
  `updated_by` LONGTEXT NOT NULL,
  `created_at` LONGTEXT NOT NULL,
  `updated_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `membership_plan_price_history` (
  `id` VARCHAR(191) NOT NULL,
  `plan_id` VARCHAR(191) NOT NULL,
  `previous_price` DECIMAL(14,2) NOT NULL,
  `new_price` DECIMAL(14,2) NOT NULL,
  `changed_by_admin_id` VARCHAR(191) NULL,
  `effective_date` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `membership_plans` (
  `id` VARCHAR(191) NOT NULL,
  `duration_months` BIGINT NOT NULL,
  `name` LONGTEXT NOT NULL,
  `tier_code` LONGTEXT NOT NULL,
  `price` DECIMAL(14,2) NOT NULL,
  `currency` VARCHAR(512) NULL DEFAULT 'INR',
  `badge` LONGTEXT NULL,
  `is_active` BIGINT NULL DEFAULT 1,
  `description` LONGTEXT NULL,
  `created_at` LONGTEXT NOT NULL,
  `features_json` LONGTEXT NULL,
  `eligibility_rules` LONGTEXT NULL,
  `display_order` BIGINT NULL DEFAULT 0,
  `is_public` BIGINT NULL DEFAULT 1,
  `updated_at` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `memberships` (
  `id` VARCHAR(191) NOT NULL,
  `student_id` VARCHAR(191) NOT NULL,
  `plan_id` VARCHAR(191) NOT NULL,
  `plan_name_snapshot` LONGTEXT NOT NULL,
  `price_snapshot` DECIMAL(14,2) NOT NULL,
  `currency` VARCHAR(512) NULL DEFAULT 'INR',
  `duration_months` BIGINT NOT NULL,
  `order_ref` LONGTEXT NOT NULL,
  `start_date` LONGTEXT NOT NULL,
  `expiry_date` LONGTEXT NOT NULL,
  `status` LONGTEXT NOT NULL,
  `created_at` LONGTEXT NOT NULL,
  `updated_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `modules` (
  `id` VARCHAR(191) NOT NULL,
  `subject_id` VARCHAR(191) NULL,
  `course_id` VARCHAR(191) NULL,
  `name` LONGTEXT NOT NULL,
  `detail` LONGTEXT NULL,
  `img` LONGTEXT NULL,
  `is_demo` BIGINT NULL DEFAULT 0,
  `is_active` BIGINT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `notes` (
  `id` VARCHAR(191) NOT NULL,
  `chapter_id` VARCHAR(191) NULL,
  `module_id` VARCHAR(191) NULL,
  `subject_id` VARCHAR(191) NULL,
  `course_id` VARCHAR(191) NULL,
  `title` LONGTEXT NOT NULL,
  `description` LONGTEXT NULL,
  `doc_path` LONGTEXT NULL,
  `created_at` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `payment_events` (
  `id` VARCHAR(191) NOT NULL,
  `order_id` VARCHAR(191) NOT NULL,
  `event_type` LONGTEXT NOT NULL,
  `payload` LONGTEXT NULL,
  `is_reconciled` BIGINT NULL DEFAULT 0,
  `created_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `payment_orders` (
  `id` VARCHAR(191) NOT NULL,
  `student_id` VARCHAR(191) NOT NULL,
  `plan_id` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `currency` VARCHAR(512) NULL DEFAULT 'INR',
  `status` LONGTEXT NOT NULL,
  `idempotency_key` VARCHAR(191) NULL,
  `provider` VARCHAR(512) NULL DEFAULT 'sandbox',
  `provider_order_id` VARCHAR(191) NULL,
  `provider_payment_id` VARCHAR(191) NULL,
  `provider_signature` LONGTEXT NULL,
  `metadata` LONGTEXT NULL,
  `created_at` LONGTEXT NOT NULL,
  `updated_at` LONGTEXT NOT NULL,
  `student_submitted_utr` LONGTEXT NULL,
  `utr_submitted_at` LONGTEXT NULL,
  `payment_method` VARCHAR(512) NULL DEFAULT 'gateway',
  `coupon_id` VARCHAR(191) NULL,
  `discount_amount` DECIMAL(14,2) NULL DEFAULT 0,
  `base_amount` DECIMAL(14,2) NULL DEFAULT 0,
  `admin_verified_by` LONGTEXT NULL,
  `admin_verified_at` LONGTEXT NULL,
  `admin_notes` LONGTEXT NULL,
  `rejection_reason` LONGTEXT NULL,
  `reconciliation_status` VARCHAR(512) NULL DEFAULT 'unreconciled',
  `reconciliation_id` VARCHAR(191) NULL,
  `razorpay_order_id` VARCHAR(191) NULL,
  `razorpay_payment_id` VARCHAR(191) NULL,
  `razorpay_signature` LONGTEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_payment_orders_1` (`idempotency_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `payment_settings` (
  `id` VARCHAR(191) NOT NULL,
  `merchant_display_name` LONGTEXT NOT NULL,
  `merchant_upi_vpa` LONGTEXT NOT NULL,
  `merchant_logo_url` LONGTEXT NULL,
  `support_email` LONGTEXT NULL,
  `support_phone` LONGTEXT NULL,
  `payment_instructions` LONGTEXT NULL,
  `qr_preview_enabled` BIGINT NULL DEFAULT 1,
  `gateway_provider` VARCHAR(512) NULL DEFAULT 'razorpay',
  `gateway_key_id` VARCHAR(191) NULL DEFAULT '',
  `gateway_key_secret` VARCHAR(512) NULL DEFAULT '',
  `gateway_webhook_secret` VARCHAR(512) NULL DEFAULT '',
  `gateway_enabled` BIGINT NULL DEFAULT 1,
  `upi_qr_enabled` BIGINT NULL DEFAULT 1,
  `updated_at` LONGTEXT NOT NULL,
  `gateway_mode` VARCHAR(512) NULL DEFAULT 'test',
  `auto_activate_membership` BIGINT NULL DEFAULT 1,
  `webhook_url` VARCHAR(512) NULL DEFAULT 'https://api.pratyakshayurveda.com/api/payment/razorpay/webhook',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `questions` (
  `id` VARCHAR(191) NOT NULL,
  `paper_id` VARCHAR(191) NULL,
  `subject_name` LONGTEXT NULL,
  `question_text` LONGTEXT NOT NULL,
  `question_eng` LONGTEXT NULL,
  `option_a` LONGTEXT NOT NULL,
  `option_b` LONGTEXT NOT NULL,
  `option_c` LONGTEXT NOT NULL,
  `option_d` LONGTEXT NOT NULL,
  `correct_option` LONGTEXT NOT NULL,
  `correct_opt_num` BIGINT NULL DEFAULT 1,
  `explanation` LONGTEXT NULL,
  `reference_samhita` LONGTEXT NULL,
  `code` LONGTEXT NULL,
  `q_type` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `student_exam_history` (
  `id` VARCHAR(191) NOT NULL,
  `student_id` VARCHAR(191) NOT NULL,
  `paper_id` VARCHAR(191) NOT NULL,
  `title` LONGTEXT NOT NULL,
  `completed_at` VARCHAR(191) NOT NULL,
  `result_json` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_student_exam_history_1` (`student_id`,`completed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `student_otps` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `otp_code` LONGTEXT NOT NULL,
  `purpose` LONGTEXT NOT NULL,
  `attempts` BIGINT NULL DEFAULT 0,
  `expires_at` LONGTEXT NOT NULL,
  `used_at` LONGTEXT NULL,
  `created_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `student_progress` (
  `id` VARCHAR(191) NOT NULL,
  `student_id` VARCHAR(191) NULL,
  `lesson_id` VARCHAR(191) NULL,
  `course_id` VARCHAR(191) NULL,
  `completed` BIGINT NULL DEFAULT 0,
  `last_position_seconds` BIGINT NULL DEFAULT 0,
  `updated_at` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `student_saved_questions` (
  `student_id` VARCHAR(191) NOT NULL,
  `question_id` VARCHAR(191) NOT NULL,
  `question_json` LONGTEXT NOT NULL,
  `saved_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`student_id`,`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `student_tasks` (
  `id` VARCHAR(191) NOT NULL,
  `student_id` VARCHAR(191) NOT NULL,
  `title` LONGTEXT NOT NULL,
  `category` LONGTEXT NOT NULL,
  `priority` LONGTEXT NOT NULL,
  `due_date` LONGTEXT NULL,
  `notes` VARCHAR(512) NOT NULL DEFAULT '',
  `done` BIGINT NOT NULL DEFAULT 0,
  `deleted` BIGINT NOT NULL DEFAULT 0,
  `created_at` LONGTEXT NOT NULL,
  `updated_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_student_tasks_1` (`student_id`,`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `students` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` LONGTEXT NULL,
  `full_name` LONGTEXT NOT NULL,
  `phone` LONGTEXT NULL,
  `academic_status` LONGTEXT NULL,
  `bams_year` LONGTEXT NULL,
  `exam_goal` LONGTEXT NULL,
  `auth_provider` VARCHAR(512) NULL DEFAULT 'email',
  `email_verified` BIGINT NULL DEFAULT 0,
  `onboarding_state` VARCHAR(512) NULL DEFAULT 'registered',
  `role` VARCHAR(512) NULL DEFAULT 'student',
  `is_suspended` BIGINT NULL DEFAULT 0,
  `created_at` LONGTEXT NOT NULL,
  `updated_at` LONGTEXT NOT NULL,
  `avatar_url` LONGTEXT NULL,
  `admin_notes` LONGTEXT NULL,
  `enrollment_type` VARCHAR(512) NULL DEFAULT 'self_enrolled',
  `invitation_token` LONGTEXT NULL,
  `invitation_sent_at` LONGTEXT NULL,
  `invitation_accepted_at` LONGTEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_students_1` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `subjects` (
  `id` VARCHAR(191) NOT NULL,
  `course_id` VARCHAR(191) NULL,
  `name` LONGTEXT NOT NULL,
  `detail` LONGTEXT NULL,
  `icon` LONGTEXT NULL,
  `is_active` BIGINT NULL DEFAULT 1,
  `img` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `test_attempts` (
  `id` VARCHAR(191) NOT NULL,
  `student_id` VARCHAR(191) NULL,
  `paper_id` VARCHAR(191) NULL,
  `paper_title` LONGTEXT NULL,
  `started_at` LONGTEXT NULL,
  `completed_at` LONGTEXT NULL,
  `score` DOUBLE NULL,
  `accuracy` DOUBLE NULL,
  `correct_count` BIGINT NULL,
  `incorrect_count` BIGINT NULL,
  `unattempted_count` BIGINT NULL,
  `time_spent_seconds` BIGINT NULL,
  `answers_json` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `test_papers` (
  `id` VARCHAR(191) NOT NULL,
  `series_id` VARCHAR(191) NULL,
  `title` LONGTEXT NOT NULL,
  `description` LONGTEXT NULL,
  `img` LONGTEXT NULL,
  `duration_minutes` BIGINT NULL DEFAULT 90,
  `per_q_marks` BIGINT NULL DEFAULT 4,
  `per_q_neg_marks` BIGINT NULL DEFAULT 1,
  `total_questions` BIGINT NULL DEFAULT 120,
  `total_marks` BIGINT NULL DEFAULT 480,
  `cutoff` BIGINT NULL DEFAULT 240,
  `is_active` BIGINT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `test_series` (
  `id` VARCHAR(191) NOT NULL,
  `course_id` VARCHAR(191) NULL,
  `name` LONGTEXT NOT NULL,
  `description` LONGTEXT NULL,
  `img` LONGTEXT NULL,
  `paper_count` BIGINT NULL DEFAULT 1,
  `is_active` BIGINT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `testimonials` (
  `id` VARCHAR(191) NOT NULL,
  `name` LONGTEXT NULL,
  `rank_info` LONGTEXT NULL,
  `year` LONGTEXT NULL,
  `quote` LONGTEXT NULL,
  `img` LONGTEXT NULL,
  `rating` BIGINT NULL DEFAULT 5,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `transactional_notifications` (
  `id` VARCHAR(191) NOT NULL,
  `recipient_email` LONGTEXT NOT NULL,
  `recipient_name` LONGTEXT NULL,
  `template_type` LONGTEXT NOT NULL,
  `subject` LONGTEXT NOT NULL,
  `content_html` LONGTEXT NOT NULL,
  `delivery_status` VARCHAR(512) NULL DEFAULT 'delivered',
  `sent_at` LONGTEXT NOT NULL,
  `related_order_id` VARCHAR(191) NULL,
  `created_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `user_auth_identities` (
  `id` VARCHAR(191) NOT NULL,
  `student_id` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL DEFAULT 'google',
  `provider_subject` VARCHAR(191) NOT NULL,
  `provider_email` LONGTEXT NOT NULL,
  `avatar_url` LONGTEXT NULL,
  `linked_at` LONGTEXT NOT NULL,
  `last_login_at` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_user_auth_identities_1` (`provider`,`provider_subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS `videos` (
  `id` VARCHAR(191) NOT NULL,
  `chapter_id` VARCHAR(191) NULL,
  `module_id` VARCHAR(191) NULL,
  `subject_id` VARCHAR(191) NULL,
  `course_id` VARCHAR(191) NULL,
  `title` LONGTEXT NOT NULL,
  `duration` LONGTEXT NULL,
  `bunny_id` VARCHAR(191) NULL,
  `vimo_id` VARCHAR(191) NULL,
  `secure_embed_url` LONGTEXT NULL,
  `created_at` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

ALTER TABLE `admin_sessions` ADD CONSTRAINT `fk_admin_sessions_0` FOREIGN KEY (`admin_id`) REFERENCES `admin_users` (`id`);

ALTER TABLE `memberships` ADD CONSTRAINT `fk_memberships_0` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`);

ALTER TABLE `payment_orders` ADD CONSTRAINT `fk_payment_orders_0` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`);
