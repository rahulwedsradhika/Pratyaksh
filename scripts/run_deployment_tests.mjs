import {spawnSync} from 'node:child_process';
const tests=['apple_external_player','sandbox_payments','google_student_resolution','mobile_delivery','auth_recovery','static_cache','admin_fetch','admin_student_data','content_source_auth','curriculum_admin','email_templates','gateway_admin','gateway_configuration','lecture_notes','live_classes','membership_pricing','membership_renewal_security','note_files','one_time_codes','production_configuration','production_gateway','pwa_install','subject_artwork'].map(name=>'tests/'+name+'.test.mjs');
tests.push('tests/verify_ipados_video.test.mjs');
const result=spawnSync(process.execPath,['--test',...tests],{stdio:'inherit',env:process.env});process.exitCode=result.status??1;
