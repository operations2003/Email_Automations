async function run() {
  const base = 'http://localhost:3000';

  console.log('====================================================');
  console.log('🔒 Testing End-to-End Role-Based Access Control (RBAC)...');
  console.log('====================================================');

  // Test 1: Admin Login with hardcoded credentials
  console.log('\n--- 1. Testing Sheetal Bedi Admin Login ---');
  const adminRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sheetalbedi@tasknera.com',
      password: 'tasknera@2003'
    })
  });
  const adminData = await adminRes.json();
  console.log('Status:', adminRes.status);
  console.log('Admin User:', adminData.user);
  if (adminRes.status !== 200 || adminData.user?.role !== 'admin') {
    throw new Error('FAILED: Sheetal Bedi login failed');
  }
  const adminToken = adminData.token;
  console.log('✅ Sheetal Bedi logged in as ADMIN successfully!');

  // Test 2: Employee Login (Atul)
  console.log('\n--- 2. Testing Employee Login (Atul) ---');
  const empRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'atul@tasknera.com',
      password: 'atul@1010'
    })
  });
  const empData = await empRes.json();
  console.log('Status:', empRes.status);
  console.log('Employee User:', empData.user);
  if (empRes.status !== 200 || empData.user?.role !== 'employee' || empData.user?.email !== 'atul@tasknera.com') {
    throw new Error('FAILED: Atul employee login failed');
  }
  const empToken = empData.token;
  console.log('✅ Atul logged in as EMPLOYEE successfully!');

  // Test 3: Bad Password Rejection
  console.log('\n--- 3. Testing Bad Password Rejection ---');
  const badRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sheetalbedi@tasknera.com',
      password: 'wrong_password_123'
    })
  });
  const badData = await badRes.json();
  console.log('Bad Login Status (Expected 401):', badRes.status);
  console.log('Error Message:', badData.error);
  if (badRes.status !== 401) {
    throw new Error('FAILED: Bad password was not rejected!');
  }
  console.log('✅ Invalid password correctly rejected with 401 Unauthorized!');

  // Test 4: Settings API Protection (Employee should be 403 Forbidden)
  console.log('\n--- 4. Testing Settings API Access Restriction for Employee ---');
  const empSettingsRes = await fetch(`${base}/api/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${empToken}`
    },
    body: JSON.stringify({ aiTone: 'Friendly' })
  });
  const empSettingsData = await empSettingsRes.json();
  console.log('Employee Settings POST Status (Expected 403):', empSettingsRes.status);
  console.log('Response Message:', empSettingsData.error);
  if (empSettingsRes.status !== 403) {
    throw new Error('FAILED: Employee was permitted to modify settings!');
  }
  console.log('✅ Employee modification blocked with 403 Forbidden!');

  // Test 5: Settings API Allowed for Admin
  console.log('\n--- 5. Testing Settings API Access Allowed for Admin ---');
  const adminSettingsRes = await fetch(`${base}/api/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ companyName: 'TaskNera Solutions' })
  });
  const adminSettingsData = await adminSettingsRes.json();
  console.log('Admin Settings POST Status (Expected 200):', adminSettingsRes.status);
  if (adminSettingsRes.status !== 200 || !adminSettingsData.success) {
    throw new Error('FAILED: Admin modification failed');
  }
  console.log('✅ Admin modification permitted with 200 OK!');

  console.log('\n====================================================');
  console.log('🎉 ALL ROLE-BASED ACCESS CONTROL TESTS PASSED!');
  console.log('====================================================');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
