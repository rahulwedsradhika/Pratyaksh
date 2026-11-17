import { DEFAULT_EMAIL_TEMPLATES } from './defaultEmailTemplates.js';

// A one-time upgrade: retain the prior editable content, and never overwrite
// subsequent administrator edits when the application restarts.
export async function upgradeEmailTemplates(db) {
  await db.exec(`CREATE TABLE IF NOT EXISTS email_template_upgrades (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS email_template_backups (version TEXT NOT NULL, template_key TEXT NOT NULL, template_json TEXT NOT NULL, backed_up_at TEXT NOT NULL, PRIMARY KEY(version, template_key));`);
  const version = 'pratyaksh-email-design-2026-11-v1';
  if (await db.prepare('SELECT version FROM email_template_upgrades WHERE version = ?').get(version)) return false;
  const now = new Date().toISOString();
  await db.exec('BEGIN');
  try {
    const backup = db.prepare('INSERT INTO email_template_backups (version, template_key, template_json, backed_up_at) VALUES (?, ?, ?, ?)');
    const update = db.prepare('UPDATE email_templates SET name=?, category=?, subject=?, html_body=?, text_body=?, variables_json=?, updated_at=? WHERE template_key=?');
    const insert = db.prepare('INSERT INTO email_templates (id,template_key,name,category,subject,html_body,text_body,variables_json,enabled,updated_at) VALUES (?,?,?,?,?,?,?,?,1,?)');
    for (const item of DEFAULT_EMAIL_TEMPLATES) {
      const current = await db.prepare('SELECT * FROM email_templates WHERE template_key = ?').get(item.template_key);
      if (current) {
        await backup.run(version, item.template_key, JSON.stringify(current), now);
        await update.run(item.name, item.category, item.subject, item.html_body, item.text_body, item.variables_json, now, item.template_key);
      } else {
        await insert.run(`tpl_${item.template_key}`, item.template_key, item.name, item.category, item.subject, item.html_body, item.text_body, item.variables_json, now);
      }
    }
    await db.prepare("UPDATE email_settings SET sender_name = 'Pratyaksh Ayurveda' WHERE sender_name = 'Ayurvedasidhi'").run();
    await db.prepare('INSERT INTO email_template_upgrades (version,applied_at) VALUES (?,?)').run(version, now);
    await db.exec('COMMIT');
    return true;
  } catch (error) {await db.exec('ROLLBACK');throw error;}
}
