import assert from 'node:assert/strict';
const base=process.argv[2]||'http://localhost:3001';
for(const [route,expected]of [['/',200],['/login',200],['/api/health',200],['/api/course/active',200],['/api/membership/plans',200],['/api/admin/students',401],['/api/student/tasks',401]]){
 const response=await fetch(new URL(route,base),{signal:AbortSignal.timeout(12000)});assert.equal(response.status,expected,route);
 if(route==='/api/health'){const health=await response.json();assert.equal(health.database.engine,'mysql');assert.equal(health.database.connected,true);}
 console.log('PASS',route,expected);
}
