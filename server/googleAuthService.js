import { OAuth2Client } from 'google-auth-library';
import { db } from './db.js';

/**
 * Format validation regex for Google OAuth 2.0 Web Client ID
 * Standard format: <client_number>-<hash>.apps.googleusercontent.com
 */
const GOOGLE_CLIENT_ID_REGEX = /^[0-9]+-[a-zA-Z0-9_\-]+\.apps\.googleusercontent\.com$/;

/**
 * Validates Google OAuth Client ID format and safety
 */
export function validateGoogleClientId(clientId) {
  if (!clientId || typeof clientId !== 'string') {
    return { valid: false, error: 'Google Client ID is required and must be a string.' };
  }

  const trimmed = clientId.trim();
  if (trimmed.length < 10) {
    return { valid: false, error: 'Google Client ID is too short.' };
  }

  if (trimmed.length > 255) {
    return { valid: false, error: 'Google Client ID exceeds maximum permitted length (255 characters).' };
  }

  // Reject HTML tags, script injection, whitespace inside
  if (/[<>\s"';(){}]/.test(trimmed)) {
    return { valid: false, error: 'Client ID contains invalid characters or dangerous markup.' };
  }

  if (!trimmed.endsWith('.apps.googleusercontent.com')) {
    return { valid: false, error: 'Client ID must end with ".apps.googleusercontent.com".' };
  }

  if (!GOOGLE_CLIENT_ID_REGEX.test(trimmed)) {
    return { valid: false, error: 'Invalid Google Client ID format. Expected format: 1234567890-abcdef.apps.googleusercontent.com' };
  }

  return { valid: true, clientId: trimmed };
}

/**
 * Determines current runtime environment (development vs production)
 */
export function getRuntimeEnvironment() {
  const env = (process.env.NODE_ENV || process.env.APP_ENV || 'development').toLowerCase();
  return env === 'production' ? 'production' : 'development';
}

/**
 * Loads active Google authentication settings from the database
 */
export async function getGoogleAuthSettings(targetEnv = null) {
  try {
    const environment = targetEnv || getRuntimeEnvironment();
    let row = await db.prepare(`
      SELECT * FROM authentication_settings 
      WHERE provider = 'google' AND environment = ?
    `).get(environment);

    if (!row) {
      // Auto-initialize if row missing
      const now = new Date().toISOString();
      const id = `auth_cfg_google_${environment === 'production' ? 'prod' : 'dev'}`;
      await db.prepare(`
        INSERT OR IGNORE INTO authentication_settings 
        (id, provider, environment, client_id, is_enabled, updated_by, updated_by_name, created_at, updated_at)
        VALUES (?, 'google', ?, '', 0, 'system_init', 'System Initializer', ?, ?)
      `).run(id, environment, now, now);

      row = await db.prepare(`
        SELECT * FROM authentication_settings 
        WHERE provider = 'google' AND environment = ?
      `).get(environment);
    }

    // The process environment is authoritative for the running deployment; this avoids
    // shipping a stale database/test client ID to Google Identity Services.
    const rawEnvironmentClientId = environment === getRuntimeEnvironment() ?
    (process.env.GOOGLE_CLIENT_ID || '').trim() :
    '';
    // A malformed environment value must not permanently mask a valid ID saved
    // from the Admin Panel. Only a syntactically valid web client ID is authoritative.
    const environmentClientId = validateGoogleClientId(rawEnvironmentClientId).valid ?
    rawEnvironmentClientId :
    '';
    const clientId = environmentClientId || row?.client_id || '';
    const clientIdSource = environmentClientId ? 'environment' : 'admin_panel';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || row?.client_secret || '';
    const isConfigured = Boolean(clientId && GOOGLE_CLIENT_ID_REGEX.test(clientId));
    const isEnabled = Boolean(row?.is_enabled && isConfigured);

    let status = 'Not Configured';
    if (isEnabled) {
      status = 'Enabled';
    } else if (isConfigured) {
      status = 'Configured (Disabled)';
    } else if (clientId && !isConfigured) {
      status = 'Validation Error';
    }

    return {
      provider: 'google',
      providerName: 'Google Identity Services (GIS)',
      environment,
      clientId,
      clientIdSource,
      clientSecretConfigured: Boolean(clientSecret && clientSecret.length > 0),
      clientSecretStatus: Boolean(clientSecret && clientSecret.length > 0) ? 'Configured' : 'Missing',
      clientSecretMasked: Boolean(clientSecret && clientSecret.length > 0) ? 'Configured (write-only; not needed for GIS)' : 'Not required for GIS',
      isEnabled,
      isConfigured,
      status,
      updatedBy: row?.updated_by || null,
      updatedByName: row?.updated_by_name || null,
      lastTestedAt: row?.last_tested_at || null,
      lastTestStatus: row?.last_test_status || null,
      lastTestError: row?.last_test_error || null,
      createdAt: row?.created_at || null,
      updatedAt: row?.updated_at || null
    };
  } catch (err) {
    console.error('[GoogleAuth] Failed to load settings:', err);
    return {
      provider: 'google',
      providerName: 'Google Identity Services (GIS)',
      environment: targetEnv || getRuntimeEnvironment(),
      clientId: '',
      isEnabled: false,
      isConfigured: false,
      status: 'Error Loading Settings',
      error: err.message
    };
  }
}

/**
 * Saves updated Google OAuth Client ID and enabled state to database
 */
export async function updateGoogleAuthSettings({ clientId, clientSecret, isEnabled, adminId, adminName, targetEnv = null }) {
  const environment = targetEnv || getRuntimeEnvironment();
  const now = new Date().toISOString();

  let cleanClientId = (clientId || '').trim();
  if (cleanClientId) {
    const val = validateGoogleClientId(cleanClientId);
    if (!val.valid) {
      throw new Error(val.error);
    }
    cleanClientId = val.clientId;
  }

  // If enabling, verify Client ID is present and valid
  const enableFlag = Boolean(isEnabled);
  if (enableFlag && !cleanClientId) {
    throw new Error('Cannot enable Google Login without a valid Google Client ID.');
  }

  const cleanSecret = clientSecret !== undefined ? (clientSecret || '').trim() : null;
  const id = `auth_cfg_google_${environment === 'production' ? 'prod' : 'dev'}`;

  // Upsert configuration safely
  const existing = await db.prepare(`SELECT id, client_secret FROM authentication_settings WHERE provider = 'google' AND environment = ?`).get(environment);
  const secretToSave = cleanSecret !== null ? cleanSecret : existing?.client_secret || process.env.GOOGLE_CLIENT_SECRET || null;

  if (existing) {
    await db.prepare(`
      UPDATE authentication_settings 
      SET client_id = ?, client_secret = ?, is_enabled = ?, updated_by = ?, updated_by_name = ?, updated_at = ?
      WHERE provider = 'google' AND environment = ?
    `).run(cleanClientId, secretToSave, enableFlag ? 1 : 0, adminId || 'admin', adminName || 'Administrator', now, environment);
  } else {
    await db.prepare(`
      INSERT INTO authentication_settings 
      (id, provider, environment, client_id, client_secret, is_enabled, updated_by, updated_by_name, created_at, updated_at)
      VALUES (?, 'google', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, environment, cleanClientId, secretToSave, enableFlag ? 1 : 0, adminId || 'admin', adminName || 'Administrator', now, now);
  }

  // Record audit log
  await logAuthActivity({
    userType: 'admin',
    userId: adminId,
    email: adminName || 'admin',
    provider: 'google',
    action: 'update_settings',
    status: 'success',
    details: { environment, isEnabled: enableFlag, clientIdMasked: cleanClientId ? `${cleanClientId.slice(0, 12)}...apps.googleusercontent.com` : 'empty' }
  });

  return await getGoogleAuthSettings(environment);
}

/**
 * Records test outcome for Google login verification
 */
export async function recordGoogleTestResult({ status, error = null, targetEnv = null }) {
  const environment = targetEnv || getRuntimeEnvironment();
  const now = new Date().toISOString();
  await db.prepare(`
    UPDATE authentication_settings 
    SET last_tested_at = ?, last_test_status = ?, last_test_error = ?, updated_at = ?
    WHERE provider = 'google' AND environment = ?
  `).run(now, status, error, now, environment);
}

/**
 * Verifies a Google ID Token (credential) using Google's official OAuth2Client
 */
export async function verifyGoogleIdToken(idToken, options = {}) {
  const { explicitClientId = null, isTest = false } = options;
  const currentSettings = await getGoogleAuthSettings();

  const trustedClientId = explicitClientId || currentSettings.clientId;

  if (!trustedClientId) {
    throw new Error('Google Client ID is not configured on the server.');
  }

  if (!isTest && !currentSettings.isEnabled) {
    throw new Error('Google Sign-In is currently disabled by institute administration.');
  }

  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Invalid Google credential token received.');
  }

  const client = new OAuth2Client(trustedClientId);

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: trustedClientId
    });
  } catch (err) {
    const errorMsg = err.message || 'Token verification failed';
    if (errorMsg.includes('Wrong number of segments')) {
      throw new Error('Malformed Google credential payload.');
    } else if (errorMsg.includes('Token used too early') || errorMsg.includes('Token used too late')) {
      throw new Error('Google token expired or clock skew error. Please try again.');
    } else if (errorMsg.includes('Wrong recipient')) {
      throw new Error('Token audience does not match configured Google Client ID.');
    }
    throw new Error(`Google token verification failed: ${errorMsg}`);
  }

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Failed to extract claims payload from verified Google ID token.');
  }

  // 1. Verify Audience
  if (payload.aud !== trustedClientId) {
    throw new Error(`Invalid token audience: expected ${trustedClientId}, received ${payload.aud}`);
  }

  // 2. Verify Issuer
  if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
    throw new Error(`Invalid token issuer: ${payload.iss}`);
  }

  // 3. Verify Expiry
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSeconds) {
    throw new Error('Google token has expired.');
  }

  // 4. Verify Email & Email Verified status
  if (!payload.email || typeof payload.email !== 'string') {
    throw new Error('Google profile does not contain an email address.');
  }

  if (!payload.email_verified) {
    throw new Error('Google account email address is not verified by Google.');
  }

  // 5. Verify Google Subject ID (sub)
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Google profile missing permanent subject identifier (sub).');
  }

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase().trim(),
    emailVerified: true,
    fullName: payload.name || payload.given_name || payload.email.split('@')[0],
    givenName: payload.given_name || '',
    familyName: payload.family_name || '',
    picture: payload.picture || null,
    locale: payload.locale || 'en'
  };
}

/**
 * Resolves or safely links a verified Google profile with an authentic student record
 */
export async function resolveGoogleStudent(googleProfile, ipAddress = '127.0.0.1') {
  const now = new Date().toISOString();
  const { sub, email, fullName, picture, phone = '' } = googleProfile;
  const cleanPhone = String(phone || '').replace(/[\s()-]/g, '').replace(/^\+?91/, '');
  const normalizedPhone = /^[6-9][0-9]{9}$/.test(cleanPhone) ? `+91${cleanPhone}` : '';

  // 1. Look up existing identity link by Google Subject ID
  const existingIdentity = await db.prepare(`
    SELECT * FROM user_auth_identities 
    WHERE provider = 'google' AND provider_subject = ?
  `).get(sub);

  if (existingIdentity) {
    // Update last login timestamp
    await db.prepare(`
      UPDATE user_auth_identities 
      SET last_login_at = ?, avatar_url = COALESCE(?, avatar_url)
      WHERE id = ?
    `).run(now, picture, existingIdentity.id);

    const student = await db.prepare(`SELECT * FROM students WHERE id = ?`).get(existingIdentity.student_id);
    if (!student) {
      throw new Error('Linked student record not found in system database.');
    }

    await logAuthActivity({
      userType: 'student',
      userId: student.id,
      email: student.email,
      provider: 'google',
      action: 'login',
      status: 'success',
      ipAddress,
      details: { sub, existingUser: true }
    });

    const updatedStudent = normalizedPhone ?
    (async () => {
      await db.prepare("UPDATE students SET phone = CASE WHEN COALESCE(phone, '') = '' THEN ? ELSE phone END, updated_at = ? WHERE id = ?").
      run(normalizedPhone, now, student.id);
      return await db.prepare('SELECT * FROM students WHERE id = ?').get(student.id);
    })() :
    student;

    return {
      student: updatedStudent,
      isNewUser: false,
      newlyLinked: false
    };
  }

  // 2. Check if a student with this email address already exists
  const existingStudentByEmail = await db.prepare(`SELECT * FROM students WHERE email = ?`).get(email);

  if (existingStudentByEmail) {
    // Link Google Subject ID to existing student
    const identityId = `ident_goog_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await db.prepare(`
      INSERT INTO user_auth_identities 
      (id, student_id, provider, provider_subject, provider_email, avatar_url, linked_at, last_login_at)
      VALUES (?, ?, 'google', ?, ?, ?, ?, ?)
    `).run(identityId, existingStudentByEmail.id, sub, email, picture, now, now);

    // If student did not have avatar or name, update them
    await db.prepare(`
      UPDATE students 
      SET email_verified = 1, 
          avatar_url = COALESCE(avatar_url, ?),
          updated_at = ?
      WHERE id = ?
    `).run(picture, now, existingStudentByEmail.id);

    await logAuthActivity({
      userType: 'student',
      userId: existingStudentByEmail.id,
      email: existingStudentByEmail.email,
      provider: 'google',
      action: 'link_account',
      status: 'success',
      ipAddress,
      details: { sub, newlyLinked: true }
    });

    const updatedStudent = normalizedPhone ?
    (async () => {
      await db.prepare("UPDATE students SET phone = CASE WHEN COALESCE(phone, '') = '' THEN ? ELSE phone END, updated_at = ? WHERE id = ?").
      run(normalizedPhone, now, existingStudentByEmail.id);
      return await db.prepare('SELECT * FROM students WHERE id = ?').get(existingStudentByEmail.id);
    })() :
    existingStudentByEmail;

    return {
      student: updatedStudent,
      isNewUser: false,
      newlyLinked: true
    };
  }

  // 3. Create new standard student record (NOT a Pro membership)
  const newStudentId = `student_goog_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  await db.prepare(`
    INSERT INTO students (
      id, email, password_hash, full_name, phone, academic_status, exam_goal,
      auth_provider, email_verified, onboarding_state, role, avatar_url, created_at, updated_at
    ) VALUES (?, ?, '', ?, ?, 'Enrolled Scholar', 'AIAPGET & BAMS Complete', 'google', 1, 'verified_pending_payment', 'student', ?, ?, ?)
  `).run(newStudentId, email, fullName, normalizedPhone, picture, now, now);

  const identityId = `ident_goog_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  await db.prepare(`
    INSERT INTO user_auth_identities 
    (id, student_id, provider, provider_subject, provider_email, avatar_url, linked_at, last_login_at)
    VALUES (?, ?, 'google', ?, ?, ?, ?, ?)
  `).run(identityId, newStudentId, sub, email, picture, now, now);

  const newStudent = await db.prepare(`SELECT * FROM students WHERE id = ?`).get(newStudentId);

  await logAuthActivity({
    userType: 'student',
    userId: newStudentId,
    email,
    provider: 'google',
    action: 'signup',
    status: 'success',
    ipAddress,
    details: { sub, newUser: true }
  });

  return {
    student: newStudent,
    isNewUser: true,
    newlyLinked: true
  };
}

/**
 * Audit log recorder for authentication activity
 */
export async function logAuthActivity(entry) {
  try {
    const {
      userType = 'student',
      userId = null,
      email,
      provider = 'google',
      action,
      status = 'success',
      ipAddress = '127.0.0.1',
      errorReason = null,
      details = null
    } = entry;

    const id = `act_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO auth_activity_logs 
      (id, user_type, user_id, email, provider, action, status, ip_address, error_reason, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userType,
      userId,
      email || 'anonymous',
      provider,
      action,
      status,
      ipAddress,
      errorReason,
      details ? JSON.stringify(details) : null,
      now
    );
  } catch (err) {
    console.error('[GoogleAuth] Failed to record auth activity log:', err);
  }
}

/**
 * Returns recent authentication activity records
 */
export async function getRecentAuthActivity(limit = 50) {
  try {
    return await db.prepare(`
      SELECT * FROM auth_activity_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit);
  } catch (err) {
    console.error('[GoogleAuth] Failed to fetch auth activity:', err);
    return [];
  }
}
