import {spawnSync} from 'node:child_process';
const tests=['admin_fetch','admin_student_data','content_source_auth','curriculum_admin','email_templates','gateway_admin','gateway_configuration','lecture_notes','live_classes','membership_pricing','membership_renewal_security','note_files','one_time_codes','production_configuration','production_gateway','pwa_install','announcement_updates','public_asset_access'].map(name=>'tests/'+name+'.test.mjs');
const result=spawnSync(process.execPath,['--test',...tests],{stdio:'inherit',env:process.env});process.exitCode=result.status??1;
