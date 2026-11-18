import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_EMAIL_TEMPLATES, emailBrandVariables } from '../server/defaultEmailTemplates.js';
import { upgradeEmailTemplates } from '../server/emailTemplateUpgrade.js';
import { interpolateVariables, interpolateTextVariables, authenticationEmailSubject, redactSensitiveBody, renderEmailTemplate } from '../server/emailService.js';

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

test('HTML variables cannot inject markup and authentication subjects start with the requested OTP', () => {
  for (const template of DEFAULT_EMAIL_TEMPLATES) {
    const html = interpolateVariables(template.html_body, { ...sample, student_name: '<img src=x onerror=alert(1)>' });
    assert.doesNotMatch(html, /<img src=x/);
    if (template.category === 'authentication') assert.match(interpolateTextVariables(template.subject,sample), /^123456 - /);
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

test('saved legacy authentication subjects include notification codes while stored previews redact them',()=>{
  for(const key of ['login_otp','admin_login_otp','email_verification_otp','password_recovery_otp']) {
    assert.equal(authenticationEmailSubject(key,'Saved custom subject','012345'),'012345 - Saved custom subject');
    assert.equal(authenticationEmailSubject(key,'012345 - Custom subject','012345'),'012345 - Custom subject');
    assert.throws(()=>authenticationEmailSubject(key,'Subject','123456\r\nBcc: victim@example.invalid'));
  }
  assert.equal(authenticationEmailSubject('payment_confirmation','Payment received',undefined),'Payment received');
  assert.equal(redactSensitiveBody('012345 - Sign in'),'[REDACTED_CODE] - Sign in');
});

test('the real mail renderer prefixes existing saved authentication subjects without changing custom bodies',async()=>{
 const db=new DatabaseSync(':memory:');
 db.exec("CREATE TABLE email_templates(template_key TEXT,subject TEXT,html_body TEXT,text_body TEXT,enabled INTEGER)");
 db.prepare('INSERT INTO email_templates VALUES (?,?,?,?,1)').run('login_otp','Saved login subject','<p>Custom code: {{otp_code}}</p>','Custom code: {{otp_code}}');
 try {
  const mail=await renderEmailTemplate('login_otp',{otp_code:'012345'},db);
  assert.equal(mail.subject,'012345 - Saved login subject');
  assert.equal(mail.html,'<p>Custom code: 012345</p>');
  assert.equal(mail.text,'Custom code: 012345');
  db.exec('UPDATE email_templates SET enabled=0');
  await assert.rejects(()=>renderEmailTemplate('login_otp',{otp_code:'012345'},db),/disabled/);
 }finally{db.close();}
});
