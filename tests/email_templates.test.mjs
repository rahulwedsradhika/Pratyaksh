import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_EMAIL_TEMPLATES, emailBrandVariables } from '../server/defaultEmailTemplates.js';
import { upgradeEmailTemplates } from '../server/emailTemplateUpgrade.js';
import { interpolateVariables, interpolateTextVariables } from '../server/emailService.js';

const sample = { ...emailBrandVariables({}), student_name: 'Asha & Dev', otp_code: '123456', expiry_minutes: '10', membership_name: 'Academic plan', membership_expiry: '17 Nov 2027', payment_reference: 'pay_example', amount: '1,000', notification_title: 'Classroom update', notification_message: 'Your class starts at 7 PM.' };

test('all branded templates render complete HTML and text with current hash routes', () => {
  assert.equal(DEFAULT_EMAIL_TEMPLATES.length, 10);
  assert.equal(new Set(DEFAULT_EMAIL_TEMPLATES.map((t) => t.template_key)).size, 10);
  for (const template of DEFAULT_EMAIL_TEMPLATES) {
    const html = interpolateVariables(template.html_body, sample);
    const text = interpolateTextVariables(template.text_body, sample);
    assert.doesNotMatch(html + text, /\{\{\w+\}\}|ayurvedasidhi|10,000|500\+|no-loss/i);
    assert.match(html, /<meta name="viewport"/);
    assert.match(html, /role="presentation"/);
    assert.match(html, /Asha &amp; Dev/);
    assert.match(text, /Asha & Dev/);
    assert.doesNotMatch(html, /<script|@import|display:flex/);
  }
  assert.equal(sample.dashboard_url, 'https://pratyakshayurveda.in/#/app');
  assert.equal(sample.live_url, 'https://pratyakshayurveda.in/#/learn-live');
  assert.throws(() => emailBrandVariables({ EMAIL_APP_URL: 'javascript:alert(1)' }));
});

test('HTML variables cannot inject markup and authentication subjects do not expose OTPs', () => {
  for (const template of DEFAULT_EMAIL_TEMPLATES) {
    const html = interpolateVariables(template.html_body, { ...sample, student_name: '<img src=x onerror=alert(1)>' });
    assert.doesNotMatch(html, /<img src=x/);
    if (template.category === 'authentication') assert.doesNotMatch(template.subject, /otp_code/);
  }
  assert.match(DEFAULT_EMAIL_TEMPLATES.find((t) => t.template_key === 'admin_login_otp').html_body, /administrator portal/);
});

test('upgrade backs up existing content, preserves disabled status and runs once', async () => {
  const db = new DatabaseSync(':memory:');
  await db.exec(`CREATE TABLE email_templates(id TEXT PRIMARY KEY, template_key TEXT UNIQUE, name TEXT, category TEXT, subject TEXT, html_body TEXT, text_body TEXT, variables_json TEXT, enabled INTEGER, updated_at TEXT);
    CREATE TABLE email_settings(sender_name TEXT);
    INSERT INTO email_settings VALUES ('Ayurvedasidhi');
    INSERT INTO email_templates VALUES ('custom-id','login_otp','Old login','authentication','Old subject','Old HTML','Old text','[]',0,'old');`);
  assert.equal(await upgradeEmailTemplates(db), true);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM email_templates').get()).n, 10);
  const row = await db.prepare("SELECT * FROM email_templates WHERE template_key='login_otp'").get();
  assert.equal(row.id, 'custom-id');
  assert.equal(row.enabled, 0);
  assert.equal(JSON.parse((await db.prepare('SELECT template_json FROM email_template_backups').get()).template_json).html_body, 'Old HTML');
  await db.prepare("UPDATE email_templates SET subject='My later edit' WHERE template_key='login_otp'").run();
  assert.equal(await upgradeEmailTemplates(db), false);
  assert.equal((await db.prepare("SELECT subject FROM email_templates WHERE template_key='login_otp'").get()).subject, 'My later edit');
  db.close();
});
