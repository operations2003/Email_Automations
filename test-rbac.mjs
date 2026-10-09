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

  // Test 6: Employee Can Add Company
  console.log('\n--- 6. Testing Employee Can Add Target Company ---');
  const testCompanyUnique = `EmpTest_${Date.now()}`;
  const empAddCompanyRes = await fetch(`${base}/api/companies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${empToken}`
    },
    body: JSON.stringify({
      name: `Acme Corp ${testCompanyUnique}`,
      email: `contact_${testCompanyUnique}@acmetest.org`,
      website: 'https://acmetest.org',
      industry: 'Technology & AI',
      description: 'Added by employee Atul for AI recruitment outreach'
    })
  });
  const empAddCompanyData = await empAddCompanyRes.json();
  console.log('Employee Add Company Status (Expected 200):', empAddCompanyRes.status);
  console.log('Company created:', empAddCompanyData.company?.name);
  if (empAddCompanyRes.status !== 200 || !empAddCompanyData.success || !empAddCompanyData.company?.id) {
    throw new Error('FAILED: Employee was unable to add company');
  }
  const createdCompanyId = empAddCompanyData.company.id;
  console.log('✅ Employee successfully added target company!');

  // Test 7: Employee Can Update Company Details
  console.log('\n--- 7. Testing Employee Can Update Company Details ---');
  const empUpdateCompanyRes = await fetch(`${base}/api/companies/${createdCompanyId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${empToken}`
    },
    body: JSON.stringify({
      industry: 'Enterprise Software & Cloud'
    })
  });
  const empUpdateCompanyData = await empUpdateCompanyRes.json();
  console.log('Employee Update Company Status (Expected 200):', empUpdateCompanyRes.status);
  if (empUpdateCompanyRes.status !== 200 || !empUpdateCompanyData.success) {
    throw new Error('FAILED: Employee was unable to update company');
  }
  console.log('✅ Employee successfully updated company details!');

  // Test 8: Employee Cannot Delete Company (Admin Only)
  console.log('\n--- 8. Testing Employee Cannot Delete Company (Admin Only) ---');
  const empDeleteCompanyRes = await fetch(`${base}/api/companies/${createdCompanyId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${empToken}`
    }
  });
  const empDeleteCompanyData = await empDeleteCompanyRes.json();
  console.log('Employee Delete Company Status (Expected 403):', empDeleteCompanyRes.status);
  if (empDeleteCompanyRes.status !== 403) {
    throw new Error('FAILED: Employee was incorrectly permitted to delete company');
  }
  console.log('✅ Employee delete request correctly blocked with 403 Forbidden!');

  // Test 9: Employee Can Create Outreach & Send Email To That Specified Company
  console.log('\n--- 9. Testing Employee Can Create Outreach & Send Mail to Specified Company ---');
  const outreachTargetEmail = `ceo_${testCompanyUnique}@acmetest.org`;
  const empOutreachRes = await fetch(`${base}/api/outreach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${empToken}`
    },
    body: JSON.stringify({
      companyName: `Acme Corp ${testCompanyUnique}`,
      email: outreachTargetEmail,
      mailTopic: 'recruitment services',
      reason: 'AI automated screening partnership for engineering candidates',
      recipientName: 'Dr. Jane Smith',
      forceDuplicate: true
    })
  });
  const empOutreachData = await empOutreachRes.json();
  console.log('Employee Create Outreach Status (Expected 200):', empOutreachRes.status);
  if (empOutreachRes.status !== 200 || !empOutreachData.success || !empOutreachData.campaign?.id) {
    throw new Error('FAILED: Employee outreach creation failed');
  }
  const campaignId = empOutreachData.campaign.id;
  console.log(`Campaign created for ${outreachTargetEmail} with ID: ${campaignId}`);

  // Send email to specified company
  const empSendRes = await fetch(`${base}/api/outreach/${campaignId}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${empToken}`
    },
    body: JSON.stringify({
      stage: 'initial',
      subject: `Tailored recruitment solution for Acme Corp ${testCompanyUnique}`,
      body: `Hello Dr. Jane Smith,\n\nWe saw Acme Corp ${testCompanyUnique} is scaling engineering roles. Our AI screening system delivers shortlist candidates in 48 hours.\n\nBest,\nAtul`
    })
  });
  const empSendData = await empSendRes.json();
  console.log('Employee Send Email Status (Expected 200):', empSendRes.status);
  console.log('Delivery status:', empSendData.campaign?.status);
  if (empSendRes.status !== 200 || !empSendData.success || empSendData.campaign?.status !== 'Initial Email Sent') {
    throw new Error('FAILED: Employee send email failed');
  }
  console.log('✅ Employee successfully sent email to specified company!');

  // Test 10: Admin Cleans Up Test Company
  console.log('\n--- 10. Admin Cleans Up Test Company ---');
  const adminCleanupRes = await fetch(`${base}/api/companies/${createdCompanyId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  console.log('Admin Delete Company Status (Expected 200):', adminCleanupRes.status);
  if (adminCleanupRes.status !== 200) {
    throw new Error('FAILED: Admin cleanup failed');
  }
  console.log('✅ Admin successfully cleaned up test company!');

  console.log('\n====================================================');
  console.log('🎉 ALL ROLE-BASED ACCESS CONTROL TESTS PASSED!');
  console.log('====================================================');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
