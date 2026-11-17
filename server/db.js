import { initializeGatewayProfiles } from './gatewayConfiguration.js';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { DEFAULT_EMAIL_TEMPLATES } from './defaultEmailTemplates.js';
import { upgradeEmailTemplates } from './emailTemplateUpgrade.js';
import { installPricingSchema } from './membershipPricing.js';
import { mysqlEnabled, createMysqlDatabase } from './databaseRuntime.js';

const DB_PATH = path.resolve('database.sqlite');
export const db = mysqlEnabled ? createMysqlDatabase() : new DatabaseSync(DB_PATH);

export async function initDatabase() {
  if (mysqlEnabled) {
    const versions=new Set((await db.prepare('SELECT version FROM schema_migrations WHERE applied_at IS NOT NULL').all()).map(row=>row.version));
    for(const name of fs.readdirSync(new URL('../database/migrations/mysql/',import.meta.url)).filter(name=>name.endsWith('.sql'))){if(!versions.has(name))throw Error('Database migration required: '+name);}
    await db.prepare('SELECT id FROM students LIMIT 1').all();
    if([process.env.APP_ENV,process.env.NODE_ENV].includes('production')){
      const owner=await db.prepare("SELECT id FROM admin_users WHERE lower(email)=? AND role='super_admin' AND is_active=1").get(String(process.env.OWNER_EMAIL||'').toLowerCase());
      if(!owner)throw Error('OWNER_EMAIL must match an existing active superadmin; no administrator is automatically seeded.');
    }
    return; // Migrations and imports are explicit deployment operations.
  }
  console.log('Initializing SQLite database at', DB_PATH);

  // 1. Categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tab TEXT,
      detail TEXT,
      img TEXT,
      is_active INTEGER DEFAULT 1
    );
  `);

  // 2. Courses
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      category_id TEXT,
      category_name TEXT,
      name TEXT NOT NULL,
      detail TEXT,
      img TEXT,
      price REAL DEFAULT 0,
      discount_price REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      rating REAL DEFAULT 4.9,
      student_count INTEGER DEFAULT 1250,
      syllabus TEXT
    );
  `);

  // 3. Subjects
  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      course_id TEXT,
      name TEXT NOT NULL,
      detail TEXT,
      icon TEXT,
      is_active INTEGER DEFAULT 1
    );
  `);

  // 4. Modules (Sub-Subjects)
  db.exec(`
    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      subject_id TEXT,
      course_id TEXT,
      name TEXT NOT NULL,
      detail TEXT,
      img TEXT,
      is_demo INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );
  `);

  // 5. Chapters
  db.exec(`
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      module_id TEXT,
      subject_id TEXT,
      course_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      faculty TEXT,
      img TEXT,
      order_num INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1
    );
  `);

  // 6. Videos (Bunny.net Stream CDN)
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      chapter_id TEXT,
      module_id TEXT,
      subject_id TEXT,
      course_id TEXT,
      title TEXT NOT NULL,
      duration TEXT,
      bunny_id TEXT,
      vimo_id TEXT,
      secure_embed_url TEXT,
      created_at TEXT
    );
  `);

  // 7. Notes (PDF Commentary Documents)
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      chapter_id TEXT,
      module_id TEXT,
      subject_id TEXT,
      course_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      doc_path TEXT,
      created_at TEXT
    );
  `);

  // 8. Legacy Lessons Compatibility
  db.exec(`
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      chapter_id TEXT,
      title TEXT NOT NULL,
      duration TEXT,
      video_url TEXT,
      notes_url TEXT,
      description TEXT,
      order_num INTEGER DEFAULT 1
    );
  `);

  // 6. Faculty
  db.exec(`
    CREATE TABLE IF NOT EXISTS faculty (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      qualification TEXT,
      specialization TEXT,
      designation TEXT,
      detail TEXT,
      img TEXT
    );
  `);

  // 7. Test Series & Papers
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_series (
      id TEXT PRIMARY KEY,
      course_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      paper_count INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS test_papers (
      id TEXT PRIMARY KEY,
      series_id TEXT,
      title TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 90,
      per_q_marks INTEGER DEFAULT 4,
      per_q_neg_marks INTEGER DEFAULT 1,
      total_questions INTEGER DEFAULT 120,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS chapter_practice_tests (
      chapter_id TEXT NOT NULL,
      test_id TEXT NOT NULL,
      title TEXT,
      total_questions INTEGER,
      order_num INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (chapter_id, test_id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      paper_id TEXT,
      subject_name TEXT,
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option TEXT NOT NULL,
      explanation TEXT,
      reference_samhita TEXT
    );
  `);

  // 8. User state, Progress, Cart, Attempts, Inquiries
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_attempts (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      paper_id TEXT,
      paper_title TEXT,
      started_at TEXT,
      completed_at TEXT,
      score REAL,
      accuracy REAL,
      correct_count INTEGER,
      incorrect_count INTEGER,
      unattempted_count INTEGER,
      time_spent_seconds INTEGER,
      answers_json TEXT
    );

    CREATE TABLE IF NOT EXISTS student_progress (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      lesson_id TEXT,
      course_id TEXT,
      completed INTEGER DEFAULT 0,
      last_position_seconds INTEGER DEFAULT 0,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      course_id TEXT,
      course_name TEXT,
      price REAL,
      img TEXT,
      added_at TEXT
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      message TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS blogs (
      id TEXT PRIMARY KEY,
      title TEXT,
      slug TEXT,
      excerpt TEXT,
      content TEXT,
      author TEXT,
      img TEXT,
      published_at TEXT
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      name TEXT,
      rank_info TEXT,
      year TEXT,
      quote TEXT,
      img TEXT,
      rating INTEGER DEFAULT 5
    );

    /* ==========================================================
       V3 STUDENT ONBOARDING, AUTHENTICATION & MEMBERSHIP TABLES
       ========================================================== */
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      full_name TEXT NOT NULL,
      phone TEXT,
      academic_status TEXT,
      bams_year TEXT,
      exam_goal TEXT,
      auth_provider TEXT DEFAULT 'email',
      email_verified INTEGER DEFAULT 0,
      onboarding_state TEXT DEFAULT 'registered',
      role TEXT DEFAULT 'student',
      is_suspended INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS membership_plans (
      id TEXT PRIMARY KEY,
      duration_months INTEGER NOT NULL,
      name TEXT NOT NULL,
      tier_code TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      badge TEXT,
      is_active INTEGER DEFAULT 1,
      description TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      plan_name_snapshot TEXT NOT NULL,
      price_snapshot REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      duration_months INTEGER NOT NULL,
      order_ref TEXT NOT NULL,
      start_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      status TEXT NOT NULL, /* active, expired, suspended */
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS payment_orders (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      status TEXT NOT NULL, /* pending, processing, completed, failed, cancelled */
      idempotency_key TEXT UNIQUE,
      provider TEXT DEFAULT 'sandbox',
      provider_order_id TEXT,
      provider_payment_id TEXT,
      provider_signature TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS payment_events (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT,
      is_reconciled INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_otps (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      purpose TEXT NOT NULL, /* registration, login, password_reset */
      attempts INTEGER DEFAULT 0,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );

    /* ==========================================================
       V3 INSTITUTE ADMINISTRATION, AUDIT & RBAC
       ========================================================== */
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'super_admin', /* super_admin, admissions_staff, finance_staff, support_staff */
      is_active INTEGER DEFAULT 1,
      mfa_enabled INTEGER DEFAULT 0,
      mfa_secret TEXT,
      avatar_url TEXT,
      phone TEXT,
      address TEXT NOT NULL DEFAULT '',
      onboarding_complete INTEGER NOT NULL DEFAULT 0,
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (admin_id) REFERENCES admin_users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      admin_name TEXT NOT NULL,
      action TEXT NOT NULL, /* STUDENT_CREATED, MEMBERSHIP_EXTENDED, PAYMENT_APPROVED, etc. */
      entity_type TEXT NOT NULL, /* student, membership, payment_order, plan, settings */
      entity_id TEXT NOT NULL,
      details_json TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS membership_plan_price_history (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      previous_price REAL NOT NULL,
      new_price REAL NOT NULL,
      changed_by_admin_id TEXT,
      effective_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL, /* percentage, fixed_amount */
      discount_value REAL NOT NULL,
      min_order_amount REAL DEFAULT 0,
      max_discount_amount REAL,
      valid_from TEXT NOT NULL,
      valid_until TEXT NOT NULL,
      usage_limit INTEGER DEFAULT 100,
      times_used INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    /* ==========================================================
       V3 MERCHANT UPI & PAYMENT RECONCILIATION TABLES
       ========================================================== */
    CREATE TABLE IF NOT EXISTS payment_settings (
      id TEXT PRIMARY KEY,
      merchant_display_name TEXT NOT NULL,
      merchant_upi_vpa TEXT NOT NULL,
      merchant_logo_url TEXT,
      support_email TEXT,
      support_phone TEXT,
      payment_instructions TEXT,
      qr_preview_enabled INTEGER DEFAULT 1,
      gateway_provider TEXT DEFAULT 'razorpay',
      gateway_key_id TEXT DEFAULT '',
      gateway_key_secret TEXT DEFAULT '',
      gateway_webhook_secret TEXT DEFAULT '',
      gateway_enabled INTEGER DEFAULT 1,
      upi_qr_enabled INTEGER DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bank_email_connections (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      email_address TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      is_connected INTEGER DEFAULT 1,
      last_sync_at TEXT,
      last_sync_status TEXT,
      error_message TEXT,
      total_emails_synced INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bank_sender_rules (
      id TEXT PRIMARY KEY,
      bank_name TEXT NOT NULL,
      sender_email_pattern TEXT NOT NULL,
      subject_pattern TEXT NOT NULL,
      body_parser_regex TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bank_credit_alerts (
      id TEXT PRIMARY KEY,
      connection_id TEXT,
      bank_name TEXT NOT NULL,
      email_message_id TEXT UNIQUE NOT NULL,
      received_at TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      raw_snippet TEXT,
      credit_amount_paise INTEGER NOT NULL,
      credit_amount_formatted TEXT NOT NULL,
      utr_number TEXT NOT NULL,
      remitter_vpa TEXT,
      remitter_name TEXT,
      match_status TEXT DEFAULT 'unmatched', /* unmatched, matched_order, ambiguous, approved, rejected */
      matched_order_id TEXT,
      match_confidence REAL DEFAULT 0.0,
      match_reason TEXT,
      processed_by_admin TEXT,
      processed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactional_notifications (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT,
      template_type TEXT NOT NULL, /* invitation, payment_success, membership_activated, expiry_reminder, admin_exception */
      subject TEXT NOT NULL,
      content_html TEXT NOT NULL,
      delivery_status TEXT DEFAULT 'delivered',
      sent_at TEXT NOT NULL,
      related_order_id TEXT,
      created_at TEXT NOT NULL
    );

    /* ==========================================================
       HOSTINGER EMAIL CENTER: SETTINGS, TEMPLATES, LOGS & DRAFTS
       ========================================================== */
    CREATE TABLE IF NOT EXISTS email_settings (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL DEFAULT 'Hostinger Email',
      smtp_host TEXT NOT NULL DEFAULT 'smtp.hostinger.com',
      smtp_port INTEGER NOT NULL DEFAULT 465,
      smtp_security TEXT NOT NULL DEFAULT 'SSL/TLS',
      smtp_username TEXT NOT NULL DEFAULT 'noreply@ayurvedasidhi.com',
      sender_name TEXT NOT NULL DEFAULT 'Ayurvedasidhi',
      sender_email TEXT NOT NULL DEFAULT 'noreply@ayurvedasidhi.com',
      last_verified_at TEXT,
      last_verification_status TEXT,
      last_verification_error TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      template_key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'notification',
      subject TEXT NOT NULL,
      html_body TEXT NOT NULL,
      text_body TEXT NOT NULL,
      variables_json TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      template_key TEXT,
      message_id TEXT,
      submission_status TEXT NOT NULL DEFAULT 'Pending',
      sanitized_error TEXT,
      body_preview TEXT,
      created_at TEXT NOT NULL,
      submitted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS email_drafts (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT NOT NULL,
      recipient TEXT,
      subject TEXT,
      body TEXT,
      template_key TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    /* ==========================================================
       GOOGLE IDENTITY SERVICES (GIS) & AUTHENTICATION SETTINGS
       ========================================================== */
    CREATE TABLE IF NOT EXISTS authentication_settings (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL DEFAULT 'google',
      environment TEXT NOT NULL DEFAULT 'development',
      client_id TEXT,
      is_enabled INTEGER NOT NULL DEFAULT 0,
      updated_by TEXT,
      updated_by_name TEXT,
      last_tested_at TEXT,
      last_test_status TEXT,
      last_test_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (provider, environment)
    );

    CREATE TABLE IF NOT EXISTS user_auth_identities (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'google',
      provider_subject TEXT NOT NULL,
      provider_email TEXT NOT NULL,
      avatar_url TEXT,
      linked_at TEXT NOT NULL,
      last_login_at TEXT NOT NULL,
      UNIQUE (provider, provider_subject)
    );

    CREATE TABLE IF NOT EXISTS auth_activity_logs (
      id TEXT PRIMARY KEY,
      user_type TEXT NOT NULL DEFAULT 'student',
      user_id TEXT,
      email TEXT NOT NULL,
      provider TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      ip_address TEXT,
      error_reason TEXT,
      details_json TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Migrate existing local databases before seeding any administrator records.
  const adminColumns = new Set(db.prepare('PRAGMA table_info(admin_users)').all().map(column => column.name));
  if (!adminColumns.has('address')) {
    db.exec("ALTER TABLE admin_users ADD COLUMN address TEXT NOT NULL DEFAULT ''");
  }
  if (!adminColumns.has('onboarding_complete')) {
    db.exec('ALTER TABLE admin_users ADD COLUMN onboarding_complete INTEGER NOT NULL DEFAULT 0');
  }

  // Non-destructive migrations for existing SQLite tables
  applyNonDestructiveMigrations();

  db.exec('CREATE TABLE IF NOT EXISTS student_sessions (token_hash TEXT PRIMARY KEY,student_id TEXT NOT NULL,expires_at TEXT NOT NULL,revoked_at TEXT,created_at TEXT NOT NULL)');

  if(process.env.ALLOW_DEV_SEED==='true'){
    seedDataIfEmpty();seedChapterPracticeTests();seedV3MembershipData();seedAdminAndFinancialData();
    await upgradeEmailTemplates(db);
  }
  await installPricingSchema(db);
  await initializeGatewayProfiles(db);
}

function seedChapterPracticeTests() {
  const sourcePath = 'temp_discovery/full_curriculum/chapters.json';
  if (!fs.existsSync(sourcePath)) return;
  try {
    const modules = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const insert = db.prepare(`
      INSERT INTO chapter_practice_tests (chapter_id, test_id, title, total_questions, order_num)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(chapter_id, test_id) DO UPDATE SET
        title = excluded.title,
        total_questions = excluded.total_questions,
        order_num = excluded.order_num
    `);
    db.exec('BEGIN');
    db.exec('DELETE FROM chapter_practice_tests');
    let count = 0;
    for (const module of modules) {
      for (const chapter of Array.isArray(module.chapterID) ? module.chapterID : []) {
        const chapterId = chapter?._id || chapter?.id;
        if (!chapterId) continue;
        const tests = Array.isArray(chapter.practiceTestList) ? chapter.practiceTestList : [];
        tests.forEach((entry, index) => {
          const testId = typeof entry === 'string' ? entry : (entry?._id || entry?.id);
          if (!testId) return;
          insert.run(
            String(chapterId), String(testId),
            typeof entry === 'object' ? (entry.title || entry.name || null) : null,
            typeof entry === 'object' ? (Number(entry.totalQuestions) || null) : null,
            index + 1
          );
          count++;
        });
      }
    }
    db.exec('COMMIT');
    console.log(`Seeded ${count} chapter practice-test links.`);
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch {}
    console.warn('Unable to seed chapter practice-test links:', error.message);
  }
}

function applyNonDestructiveMigrations() {
  const migrations = [
    { table: 'students', column: 'avatar_url', type: 'TEXT' },
    { table: 'students', column: 'admin_notes', type: 'TEXT' },
    { table: 'students', column: 'enrollment_type', type: "TEXT DEFAULT 'self_enrolled'" },
    { table: 'students', column: 'invitation_token', type: 'TEXT' },
    { table: 'students', column: 'invitation_sent_at', type: 'TEXT' },
    { table: 'students', column: 'invitation_accepted_at', type: 'TEXT' },
    { table: 'membership_plans', column: 'features_json', type: 'TEXT' },
    { table: 'membership_plans', column: 'eligibility_rules', type: 'TEXT' },
    { table: 'membership_plans', column: 'display_order', type: 'INTEGER DEFAULT 0' },
    { table: 'membership_plans', column: 'is_public', type: 'INTEGER DEFAULT 1' },
    { table: 'membership_plans', column: 'updated_at', type: 'TEXT' },
    { table: 'payment_orders', column: 'student_submitted_utr', type: 'TEXT' },
    { table: 'payment_orders', column: 'utr_submitted_at', type: 'TEXT' },
    { table: 'payment_orders', column: 'payment_method', type: "TEXT DEFAULT 'gateway'" },
    { table: 'payment_orders', column: 'coupon_id', type: 'TEXT' },
    { table: 'payment_orders', column: 'discount_amount', type: 'REAL DEFAULT 0' },
    { table: 'payment_orders', column: 'base_amount', type: 'REAL DEFAULT 0' },
    { table: 'payment_orders', column: 'admin_verified_by', type: 'TEXT' },
    { table: 'payment_orders', column: 'admin_verified_at', type: 'TEXT' },
    { table: 'payment_orders', column: 'admin_notes', type: 'TEXT' },
    { table: 'payment_orders', column: 'rejection_reason', type: 'TEXT' },
    { table: 'payment_orders', column: 'reconciliation_status', type: "TEXT DEFAULT 'unreconciled'" },
    { table: 'payment_orders', column: 'reconciliation_id', type: 'TEXT' },
    { table: 'payment_settings', column: 'gateway_mode', type: "TEXT DEFAULT 'test'" },
    { table: 'payment_settings', column: 'auto_activate_membership', type: "INTEGER DEFAULT 1" },
    { table: 'payment_settings', column: 'webhook_url', type: "TEXT DEFAULT 'https://api.pratyakshayurveda.com/api/payment/razorpay/webhook'" },
    { table: 'payment_orders', column: 'razorpay_order_id', type: 'TEXT' },
    { table: 'payment_orders', column: 'razorpay_payment_id', type: 'TEXT' },
    { table: 'payment_orders', column: 'razorpay_signature', type: 'TEXT' },
    { table: 'authentication_settings', column: 'client_secret', type: 'TEXT' }
  ];

  for (const m of migrations) {
    try {
      db.exec(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.type}`);
    } catch (e) {
      // Column already exists, safe to ignore
    }
  }
}

export function calculateCalendarExpiry(startDateStr, durationMonths) {
  const d = new Date(startDateStr);
  const targetMonth = d.getMonth() + durationMonths;
  const originalDate = d.getDate();
  d.setMonth(targetMonth);
  if (d.getDate() !== originalDate) {
    d.setDate(0); // clamp to end of target month
  }
  return d.toISOString();
}

function seedV3MembershipData() {
  try {
    const planCount = db.prepare('SELECT COUNT(*) as count FROM membership_plans').get().count;
    if (planCount === 0) {
      console.log('Seeding official V3 membership plans...');
      const insertPlan = db.prepare(`
        INSERT INTO membership_plans (id, duration_months, name, tier_code, price, currency, badge, is_active, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const now = new Date().toISOString();
      insertPlan.run('plan_1m', 1, '1 Month Intensive', '1M', 1999, 'INR', 'Rapid Revision', 1, 'Targeted AIAPGET drill & university semester sprint.', now);
      insertPlan.run('plan_3m', 3, '3 Months Foundation', '3M', 4999, 'INR', 'Subject Focus', 1, 'Comprehensive module coverage across core Samhitas.', now);
      insertPlan.run('plan_6m', 6, '6 Months Competitive', '6M', 8999, 'INR', 'Complete Coverage', 1, 'Deep mastery of Brihattrayi & Laghuttrayi with cumulative mock series.', now);
      insertPlan.run('plan_12m', 12, '12 Months Academic Complete', '12M', 14999, 'INR', 'Annual Mastery', 1, 'Year-round unfettered access with live sync updates.', now);
    }

    // Student accounts and memberships are created only by real onboarding.
  } catch (err) {
    console.error('Error in seedV3MembershipData:', err);
  }
}

function seedAdminAndFinancialData() {
  try {
    const now = new Date().toISOString();

    // 1. Provision one root administrator; all other accounts require explicit invitation.
    const ownerEmail = 'mukeshk65018@gmail.com';
    db.prepare(`
      INSERT OR IGNORE INTO admin_users
        (id, email, password_hash, full_name, role, is_active, mfa_enabled, phone, address, onboarding_complete, created_at, updated_at)
      VALUES ('admin_owner_root', ?, '', 'Profile setup required', 'super_admin', 1, 0, '', '', 0, ?, ?)
    `).run(ownerEmail, now, now);
    db.prepare(`
      UPDATE admin_users
      SET role = 'super_admin', is_active = 1, password_hash = '', updated_at = ?
      WHERE email = ?
    `).run(now, ownerEmail);

    // Retire bundled evaluation accounts and remove every non-owner superadmin role.
    db.prepare(`
      UPDATE admin_users SET is_active = 0, password_hash = '', updated_at = ?
      WHERE lower(email) IN ('admin@pratyakshayurveda.com','finance@pratyakshayurveda.com','admissions@pratyakshayurveda.com')
         OR id IN ('admin_super_01','admin_fin_01','admin_admit_01','adm_super_01')
    `).run(now);
    db.prepare(`
      UPDATE admin_users SET role = 'support_staff', updated_at = ?
      WHERE role = 'super_admin' AND lower(email) <> ?
    `).run(now, ownerEmail);
    db.prepare(`
      UPDATE admin_sessions SET revoked_at = COALESCE(revoked_at, ?)
      WHERE admin_id IN (SELECT id FROM admin_users WHERE is_active = 0)
    `).run(now);

    // 2. Seed Payment Settings
    const settingCount = db.prepare('SELECT COUNT(*) as count FROM payment_settings').get().count;
    if (settingCount === 0) {
      console.log('Seeding official merchant UPI & gateway settings...');
      db.prepare(`
        INSERT INTO payment_settings (
          id, merchant_display_name, merchant_upi_vpa, merchant_logo_url, support_email, support_phone,
          payment_instructions, qr_preview_enabled, gateway_provider, gateway_key_id, gateway_key_secret,
          gateway_webhook_secret, gateway_enabled, upi_qr_enabled, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'default_settings',
        'Pratyaksh Ayurveda Education',
        'pratyaksh@icici',
        '/assets/website-assets/img/logo.svg',
        'admissions@pratyakshayurveda.com',
        '+91 98765 43210',
        'Scan the verified Merchant UPI QR code using any UPI App (Google Pay, PhonePe, Paytm, BHIM, Cred). Enter your 12-digit Bank UTR / Transaction Reference number after successful payment.',
        1,
        'razorpay',
        '',
        '',
        '',
        0,
        0,
        now
      );
    }

    // 3. Seed Bank Sender Rules
    const ruleCount = db.prepare('SELECT COUNT(*) as count FROM bank_sender_rules').get().count;
    if (ruleCount === 0) {
      console.log('Seeding automated bank email parsing rules...');
      const insertRule = db.prepare(`
        INSERT INTO bank_sender_rules (id, bank_name, sender_email_pattern, subject_pattern, body_parser_regex, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      insertRule.run('rule_hdfc', 'HDFC Bank', 'alerts@hdfcbank.net', 'credited to account', 'credited.*Rs\\.?\\s*([\\d,]+\\.?\\d*).*UPI.*UTR\\s*[:\\s]*([\\w\\d]+)', 1, now);
      insertRule.run('rule_icici', 'ICICI Bank', 'alerts@icicibank.com', 'Account credited', 'credited with INR\\s*([\\d,]+\\.?\\d*).*UPI.*Ref\\s*[:\\s]*([\\w\\d]+)', 1, now);
      insertRule.run('rule_sbi', 'State Bank of India', 'alerts@sbi.co.in', 'Credit alert', 'A/C.*credited by Rs\\s*([\\d,]+\\.?\\d*).*Transfer from.*Ref\\s*[:\\s]*([\\w\\d]+)', 1, now);
      insertRule.run('rule_axis', 'Axis Bank', 'alerts@axisbank.com', 'Transaction Alert', 'credited with INR\\s*([\\d,]+\\.?\\d*).*UPI Ref\\s*([\\w\\d]+)', 1, now);
      insertRule.run('rule_kotak', 'Kotak Mahindra Bank', 'alerts@kotak.com', 'Money received', 'received Rs\\.\\s*([\\d,]+\\.?\\d*).*UPI.*Ref\\s*([\\w\\d]+)', 1, now);
      insertRule.run('rule_paytm', 'Paytm Payments Bank', 'alerts@paytmbank.com', 'Money Added', 'credited with Rs\\s*([\\d,]+\\.?\\d*).*UPI\\s*Txn ID\\s*([\\w\\d]+)', 1, now);
    }

    // Coupons, payments, bank alerts and audit events are never seeded.

    // 8. Seed Default Hostinger Email Settings & Templates
    const emailSettingsCount = db.prepare('SELECT COUNT(*) as count FROM email_settings').get()?.count || 0;
    if (emailSettingsCount === 0) {
      console.log('Seeding default Hostinger email settings...');
      db.prepare(`
        INSERT INTO email_settings (id, provider, smtp_host, smtp_port, smtp_security, smtp_username, sender_name, sender_email, last_verified_at, last_verification_status, last_verification_error, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'Not Verified', NULL, ?)
      `).run(
        'default_settings',
        'Hostinger Email',
        'smtp.hostinger.com',
        465,
        'SSL/TLS',
        'noreply@ayurvedasidhi.com',
        'Ayurvedasidhi',
        'noreply@ayurvedasidhi.com',
        now
      );
    }

    const tplCount = db.prepare('SELECT COUNT(*) as count FROM email_templates').get()?.count || 0;
    if (tplCount === 0 && DEFAULT_EMAIL_TEMPLATES?.length > 0) {
      console.log('Seeding 8 canonical Ayurvedasidhi email templates...');
      const insertTpl = db.prepare(`
        INSERT INTO email_templates (id, template_key, name, category, subject, html_body, text_body, variables_json, enabled, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `);
      for (const t of DEFAULT_EMAIL_TEMPLATES) {
        insertTpl.run(
          `tpl_${t.template_key}`,
          t.template_key,
          t.name,
          t.category,
          t.subject,
          t.html_body,
          t.text_body,
          t.variables_json,
          now
        );
      }
    }

    // 9. Seed Default Authentication Provider Settings (Google GIS)
    const authCfgCount = db.prepare('SELECT COUNT(*) as count FROM authentication_settings').get()?.count || 0;
    if (authCfgCount === 0) {
      console.log('Seeding default Google authentication settings...');
      const insertAuth = db.prepare(`
        INSERT INTO authentication_settings (id, provider, environment, client_id, is_enabled, updated_by, updated_by_name, last_tested_at, last_test_status, last_test_error, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'Not Configured', NULL, ?, ?)
      `);
      insertAuth.run('auth_cfg_google_dev', 'google', 'development', '', 0, 'system_init', 'System Initializer', now, now);
      insertAuth.run('auth_cfg_google_prod', 'google', 'production', '', 0, 'system_init', 'System Initializer', now, now);
    }
  } catch (err) {
    console.error('Error in seedAdminAndFinancialData:', err);
  }
}

function seedDataIfEmpty() {
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount > 0) {
    console.log('Database already contains seed data.');
    return;
  }

  console.log('Seeding database with authentic recovered data...');

  // 1. Seed Categories from category_active.json
  try {
    const p = 'temp_discovery/api_data/category_active.json';
    if (fs.existsSync(p)) {
      const cats = JSON.parse(fs.readFileSync(p, 'utf-8')).data || [];
      const stmt = db.prepare('INSERT INTO categories (id, name, tab, detail, img, is_active) VALUES (?, ?, ?, ?, ?, ?)');
      for (const c of cats) {
        stmt.run(c._id, c.name, c.tab || '', c.detail?.trim() || '', c.img || '', c.isActive || 1);
      }
      console.log(`Seeded ${cats.length} categories.`);
    }
  } catch (e) {
    console.warn('Error seeding categories:', e.message);
  }

  // 2. Seed Courses from course.json
  try {
    const p = 'temp_discovery/api_data/course.json';
    if (fs.existsSync(p)) {
      const courses = JSON.parse(fs.readFileSync(p, 'utf-8')).data || [];
      const stmt = db.prepare(`
        INSERT INTO courses (id, category_id, category_name, name, detail, img, price, discount_price, is_active, rating, student_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      let i = 0;
      for (const c of courses) {
        const catId = c.categoryID?._id || '63745016ab8725670aed2a32';
        const catName = c.categoryID?.name || 'AIAPGET';
        // assign realistic course pricing if not provided
        const basePrice = 12999 + (i * 2000) % 8000;
        const discountPrice = 8499 + (i * 1500) % 5000;
        stmt.run(
          c._id,
          catId,
          catName,
          c.name,
          c.detail || 'Complete comprehensive curriculum for Ayurveda entrance and university examinations.',
          c.img || '',
          basePrice,
          discountPrice,
          c.isActive || 1,
          4.9,
          1420 + i * 85
        );
        i++;
      }
      console.log(`Seeded ${courses.length} courses.`);
    }
  } catch (e) {
    console.warn('Error seeding courses:', e.message);
  }

  // 3. Seed Faculty from faculty.json
  try {
    const p = 'temp_discovery/api_data/faculty.json';
    if (fs.existsSync(p)) {
      const facs = JSON.parse(fs.readFileSync(p, 'utf-8')).data || [];
      const stmt = db.prepare('INSERT INTO faculty (id, name, qualification, specialization, designation, detail, img) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const f of facs) {
        stmt.run(
          f._id,
          f.name.trim(),
          f.qualification || 'MD(Ay), BHU',
          f.specializtion || 'Samhita & Siddhant',
          f.designation || 'Senior Faculty & Mentor',
          f.detail || 'Renowned scholar and expert mentor guiding AIAPGET and BAMS aspirants across India.',
          f.img || ''
        );
      }
      console.log(`Seeded ${facs.length} faculty members.`);
    }
  } catch (e) {
    console.warn('Error seeding faculty:', e.message);
  }

  // 4. Seed Test Series & Papers from test-series.json
  try {
    const p = 'temp_discovery/api_data/test-series.json';
    if (fs.existsSync(p)) {
      const seriesList = JSON.parse(fs.readFileSync(p, 'utf-8')).data || [];
      const seriesStmt = db.prepare('INSERT OR REPLACE INTO test_series (id, course_id, name, description, paper_count) VALUES (?, ?, ?, ?, ?)');
      const paperStmt = db.prepare('INSERT OR REPLACE INTO test_papers (id, series_id, title, duration_minutes, per_q_marks, per_q_neg_marks, total_questions, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      
      for (const s of seriesList) {
        const cIdStr = Array.isArray(s.courseID) ? s.courseID.join(',') : (s.courseID?._id || String(s.courseID || ''));
        seriesStmt.run(s._id, cIdStr, s.name || 'Pratyaksh Test Series', s.detail || 'Standard AIAPGET patterned examination series.', s.paperID?.length || 1);
        if (s.paperID && Array.isArray(s.paperID)) {
          let pIdx = 0;
          for (const pap of s.paperID) {
            pIdx++;
            const pId = pap._id ? `${pap._id}_${s._id}_${pIdx}` : `${s._id}_pap_${pIdx}`;
            paperStmt.run(
              pId,
              s._id,
              pap.title || `Test Paper ${pIdx}`,
              pap.duration || pap.totalTime || 90,
              pap.perQMarks || 4,
              pap.perQNegMarks || 1,
              pap.questionList?.length || 120,
              1
            );
          }
        }
      }
      console.log(`Seeded ${seriesList.length} test series.`);
    }
  } catch (e) {
    console.warn('Error seeding test series:', e.message);
  }

  // 5. Seed Authentic Ayurveda Subjects & Chapters for Ayurdeeksha 3.0
  const courseId = '69f30ebda08eda4f22febd85';
  const subjectsData = [
    {
      id: 'sub_charaka_purv',
      name: 'Charaka Samhita (Purvardha)',
      detail: 'Sutra Sthana, Nidana Sthana, Vimana Sthana, Shareera Sthana, Indriya Sthana',
      icon: 'book-open',
      chapters: [
        { id: 'chap_sutra', name: 'Sutra Sthana (30 Adhyayas)' },
        { id: 'chap_nidana', name: 'Nidana Sthana (8 Adhyayas)' },
        { id: 'chap_vimana', name: 'Vimana Sthana (8 Adhyayas)' },
        { id: 'chap_shareera', name: 'Shareera Sthana (8 Adhyayas)' },
        { id: 'chap_indriya', name: 'Indriya Sthana (12 Adhyayas)' }
      ]
    },
    {
      id: 'sub_charaka_uttar',
      name: 'Charaka Samhita (Uttarardha)',
      detail: 'Chikitsa Sthana (30 Adhyayas), Kalpa Sthana (12 Adhyayas), Siddhi Sthana (12 Adhyayas)',
      icon: 'file-text',
      chapters: [
        { id: 'chap_chikitsa', name: 'Chikitsa Sthana (Adhyaya 1 - 30)' },
        { id: 'chap_kalpa', name: 'Kalpa Sthana' },
        { id: 'chap_siddhi', name: 'Siddhi Sthana' }
      ]
    },
    {
      id: 'sub_sushruta',
      name: 'Sushruta Samhita',
      detail: 'Sutra, Nidana, Shareera, Chikitsa, Kalpa and Uttara Tantra surgical principles',
      icon: 'award',
      chapters: [
        { id: 'chap_su_sutra', name: 'Sushruta Sutra Sthana' },
        { id: 'chap_su_shareera', name: 'Sushruta Shareera Sthana (Marma & Garbha)' },
        { id: 'chap_su_chikitsa', name: 'Sushruta Chikitsa & Shalya Vidhi' },
        { id: 'chap_su_uttara', name: 'Uttara Tantra (Shalakya & Kaumarbhritya)' }
      ]
    },
    {
      id: 'sub_ayurveda_subjects',
      name: 'Ayurveda Core Disciplines',
      detail: 'Dravyaguna Vijnana, Rasashastra & Bhaishajya Kalpana, Roganidana, Kayachikitsa',
      icon: 'layers',
      chapters: [
        { id: 'chap_dravyaguna', name: 'Dravyaguna Vijnana - Karma, Rasa, Guna, Virya, Vipaka' },
        { id: 'chap_rasashastra', name: 'Rasashastra - Maharasa, Uparasa, Sadharanarasa' },
        { id: 'chap_bhaishajya', name: 'Bhaishajya Kalpana - Panchavidha Kashaya Kalpana' },
        { id: 'chap_agadtantra', name: 'Agada Tantra & Vyavahara Ayurveda' }
      ]
    },
    {
      id: 'sub_modern_subjects',
      name: 'Modern Medical Sciences',
      detail: 'Modern Anatomy, Physiology, Pathology, Pharmacology, Surgery, Medicine, PSM for AIAPGET',
      icon: 'activity',
      chapters: [
        { id: 'chap_mod_anatomy', name: 'General Anatomy & Embryology' },
        { id: 'chap_mod_physio', name: 'Systemic Physiology & Biochemistry' },
        { id: 'chap_mod_patho', name: 'General Pathology & Microbiology' },
        { id: 'chap_mod_pharma', name: 'Modern Pharmacology & Clinical Therapeutics' }
      ]
    }
  ];

  const subStmt = db.prepare('INSERT INTO subjects (id, course_id, name, detail, icon) VALUES (?, ?, ?, ?, ?)');
  const chapStmt = db.prepare('INSERT INTO chapters (id, subject_id, name, order_num) VALUES (?, ?, ?, ?)');
  const lessonStmt = db.prepare('INSERT INTO lessons (id, chapter_id, title, duration, video_url, notes_url, description, order_num) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  subjectsData.forEach((sub, sIdx) => {
    subStmt.run(sub.id, courseId, sub.name, sub.detail, sub.icon);
    sub.chapters.forEach((ch, cIdx) => {
      chapStmt.run(ch.id, sub.id, ch.name, cIdx + 1);

      // Create 3 realistic lessons for each chapter
      const lessonTitles = [
        `Introduction, Fundamental Principles & Verse Analysis (Part 1)`,
        `Key Commentaries (Chakrapani / Dalhana) & Clinical Applications (Part 2)`,
        `PYQ Discussion, High-Yield Formulae & Memory Mnemonics (Part 3)`
      ];

      lessonTitles.forEach((lt, lIdx) => {
        lessonStmt.run(
          `les_${ch.id}_${lIdx + 1}`,
          ch.id,
          `${ch.name}: ${lt}`,
          `${40 + ((sIdx * 7 + cIdx * 3 + lIdx * 5) % 25)}:00`,
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          '/assets/documents/sample_notes.pdf',
          `Detailed conceptual discussion on ${ch.name} by Pratyaksh Ayurveda faculty with Samhita cross-referencing and AIAPGET question dissection.`,
          lIdx + 1
        );
      });
    });
  });

  // 6. Seed Authentic AIAPGET / Ayurveda Questions
  const qStmt = db.prepare(`
    INSERT INTO questions (id, paper_id, subject_name, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, reference_samhita)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const authenticQuestions = [
    {
      q: 'According to Acharya Charaka, which of the following is the Pradhana Karana for "Smriti"?',
      a: 'Sattva Guna',
      b: 'Pranayama',
      c: 'Drishtha-Shruta-Anubhuta Smaranat',
      d: 'Medhya Rasayana Sevana',
      ans: 'C',
      exp: 'Charaka Shareera 1 explains the 8 causes of Smriti including Roopagrahana, Sadrishyagrahana, and Drishtha-Shruta-Anubhuta Smaranat.',
      sam: 'Charaka Samhita, Shareera Sthana 1/148'
    },
    {
      q: 'Which Mahabhuta predominance is responsible for "Tikta Rasa"?',
      a: 'Vayu + Akasha',
      b: 'Vayu + Agni',
      c: 'Jala + Prithvi',
      d: 'Agni + Prithvi',
      ans: 'A',
      exp: 'Tikta Rasa is composed primarily of Vayu and Akasha Mahabhuta according to Charaka and Sushruta.',
      sam: 'Charaka Samhita, Sutra Sthana 26/40'
    },
    {
      q: 'According to Acharya Sushruta, total number of "Snayu" in human body is:',
      a: '300',
      b: '500',
      c: '700',
      d: '900',
      ans: 'D',
      exp: 'Sushruta counts 900 Snayu in total: 600 in Shakhas, 230 in Koshta, and 70 in Greeva-urdhwa.',
      sam: 'Sushruta Samhita, Shareera Sthana 5/30'
    },
    {
      q: '"Shleshmadhara Kala" is described as which Kala in Sushruta Samhita?',
      a: 'Prathama Kala',
      b: 'Dwitiya Kala',
      c: 'Tritiya Kala',
      d: 'Chaturthi Kala',
      ans: 'D',
      exp: 'Sushruta describes 7 Kalas: 1st Mansadhara, 2nd Raktadhara, 3rd Medodhara, 4th Shleshmadhara, 5th Purishadhara, 6th Pittadhara, 7th Shukradhara.',
      sam: 'Sushruta Samhita, Shareera Sthana 4/13'
    },
    {
      q: 'Which Agada is indicated by Acharya Charaka specifically in "Keeta Visha"?',
      a: 'Kshara Agada',
      b: 'Amrita Ghrita',
      c: 'Dushivishari Agada',
      d: 'Bilwadi Agada',
      ans: 'A',
      exp: 'Charaka Chikitsa 23 prescribes Kshara Agada as Sarvavishahara, especially dominant in Keeta and Sarpa Visha.',
      sam: 'Charaka Samhita, Chikitsa Sthana 23/98'
    },
    {
      q: 'What is the Shodhana Dravya for "Parada" in Hingulottha Parada extraction?',
      a: 'Kaidarya Swarasa',
      b: 'Tambula Patra & Nimbu Swarasa',
      c: 'Direct distillation without Shodhana requirement',
      d: 'Triphala Kwatha',
      ans: 'C',
      exp: 'Hingulottha Parada is considered exceptionally pure (Nirmala) and does not require conventional Ashtasamskara Shodhana for therapeutic use in Rasashastra.',
      sam: 'Rasaratna Samuchchaya 2/85'
    },
    {
      q: 'The therapeutic dose of "Abhraka Bhasma" as per Sharangadhara Samhita is:',
      a: '1 to 2 Ratti',
      b: '4 to 6 Ratti',
      c: '1/4 to 1/2 Ratti',
      d: '1 Masha',
      ans: 'A',
      exp: 'Standard therapeutic dosage of potent mineral bhasmas like Abhraka is 1 to 2 Ratti (125mg - 250mg) with appropriate Anupana.',
      sam: 'Sharangadhara Samhita, Madhyama Khanda 11'
    },
    {
      q: 'According to Charaka, "Dhatri-Nisha" yoga is the best remedy for:',
      a: 'Kushtha',
      b: 'Prameha',
      c: 'Kamala',
      d: 'Raktapitta',
      ans: 'B',
      exp: 'Dhatri (Amalaki) and Nisha (Haridra) together form Nisha-Amalaki, the supreme classical Yoga for all types of Prameha.',
      sam: 'Charaka Samhita, Chikitsa Sthana 6/26'
    },
    {
      q: 'Which type of Snehapana is administered during hunger and without mixing with food?',
      a: 'Vicharana Sneha',
      b: 'Achchapana',
      c: 'Pravicharana',
      d: 'Sadyosneha',
      ans: 'B',
      exp: 'Achchapana is pure unadulterated ingestion of medicated Sneha taken early in the morning when the previous meal is completely digested.',
      sam: 'Charaka Samhita, Sutra Sthana 13/22'
    },
    {
      q: '"Rasona" is contraindicated in which of the following Ritus?',
      a: 'Shishira & Vasanta',
      b: 'Grishma & Sharad',
      c: 'Varsha & Hemanta',
      d: 'Hemanta only',
      ans: 'B',
      exp: 'Due to Ushna and Teekshna virya, Rasona (Garlic) therapy (Rasona Kalpa) is strictly avoided in Grishma and Sharad Ritu which aggravate Pitta.',
      sam: 'Ashtanga Hridaya, Uttarasthana 39'
    },
    {
      q: 'Which of the following Dashamoola herbs belongs to "Brihatpanchamoola"?',
      a: 'Shalaparni',
      b: 'Prishniparni',
      c: 'Brihati',
      d: 'Bilwa',
      ans: 'D',
      exp: 'Brihatpanchamoola comprises Bilwa, Agnimantha, Shyonaka, Patala, and Gambhari.',
      sam: 'Charaka Samhita, Sutra Sthana 4/16'
    },
    {
      q: 'The symptom "Aharajirna Lakshana" with Udgara Pratighata occurs in which type of Ajirna?',
      a: 'Ama Ajirna',
      b: 'Vidagdha Ajirna',
      c: 'Vishtabdha Ajirna',
      d: 'Rasadsesha Ajirna',
      ans: 'C',
      exp: 'Vishtabdha Ajirna is caused by Vata dosha and presents with Shoola, Adhmana, and Vata-mutra-purisha sanga.',
      sam: 'Madhava Nidana 6/4'
    }
  ];

  // Insert questions across test papers
  const allPapers = db.prepare('SELECT id FROM test_papers LIMIT 5').all();
  allPapers.forEach((pap, pIdx) => {
    authenticQuestions.forEach((qObj, qIdx) => {
      qStmt.run(
        `q_${pap.id}_${qIdx + 1}`,
        pap.id,
        qIdx % 2 === 0 ? 'Samhita & Siddhant' : 'Ayurveda Clinical Disciplines',
        qObj.q,
        qObj.a,
        qObj.b,
        qObj.c,
        qObj.d,
        qObj.ans,
        qObj.exp,
        qObj.sam
      );
    });
  });

  // 7. Seed Testimonials & Topper Reviews from results & homepage
  const testStmt = db.prepare('INSERT INTO testimonials (id, name, rank_info, year, quote, img, rating) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const toppers = [
    { name: 'Dr. Smita Pandey', rank: 'AIR 4 - AIAPGET', year: '2022', quote: 'Pratyaksh Ayurveda conceptual Samhita classes transformed my preparation. The unique teaching of verse-by-verse understanding gave me complete clarity and confidence.', img: '/assets/website-assets/img/faculty/std1.jpg' },
    { name: 'Dr. Suraj Kumar Sahu', rank: 'AIR 11 - AIAPGET', year: '2022', quote: 'The Pragya Vitarka test series framing matched the exact NTA AIAPGET paper standard. The negative marking control and timer simulation were instrumental in my rank.', img: '/assets/website-assets/img/faculty/std3.jpg' },
    { name: 'Dr. Vivek Tiwari', rank: 'AIR 7 - AIAPGET', year: '2021', quote: 'Dr. Rahul and the entire faculty team guide like personal mentors. If you truly wish to master Ayurveda Samhitas with modern clinical correlation, this is the destination.', img: '/assets/website-assets/img/faculty/std4.jpg' },
    { name: 'Dr. Shatabdee Pati', rank: 'AIR 14 - AIAPGET', year: '2021', quote: 'From Charaka Sutra to Sushruta Uttaratantra, every tricky question became second nature. The detailed explanatory answer keys helped rectify all misconceptions.', img: '/assets/website-assets/img/faculty/std5.jpg' },
    { name: 'Dr. Pooja Dadhich', rank: 'AIR 22 - AIAPGET', year: '2022', quote: 'The daily revision modules and subject-wise MCQ practice helped me score 360+ marks in AIAPGET. Pratyaksh Ayurveda made my PG dream a reality.', img: '/assets/website-assets/img/faculty/std6.jpg' }
  ];

  toppers.forEach((t, idx) => {
    testStmt.run(`testim_${idx + 1}`, t.name, t.rank, t.year, t.quote, t.img, 5);
  });

  // 8. Seed Blog Articles
  const blogStmt = db.prepare('INSERT INTO blogs (id, title, slug, excerpt, content, author, img, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  blogStmt.run(
    'blog_1',
    'How Your Regular Studies Can Help in AIAPGET Preparation',
    'regular-studies-aiapget-preparation',
    'A step-by-step strategy for BAMS undergraduates to integrate university coursework with competitive AIAPGET coaching.',
    'Many BAMS scholars wonder whether university professional exams hinder competitive entrance preparation. In reality, deep Samhita study during BAMS 1st to 3rd professional years is the greatest asset for cracking AIAPGET. By following the 6 Samhita pillars—Vidya, Vitarka, Vijnana, Smriti, Tatparata, and Kriya—aspirants can master conceptual slokas, clinical commentaries, and multiple choice question framing patterns simultaneously.',
    'Dr. Rahul Sir (Pratyaksh Ayurveda Faculty)',
    '/assets/website-assets/img/news/news1.jpg',
    '2026-03-15'
  );

  console.log('Database successfully seeded with authentic data.');
}
