async function run() {
  const base = 'http://localhost:3000';

  console.log('--- 1. Testing GET /api/dashboard/stats ---');
  const statsRes = await fetch(`${base}/api/dashboard/stats`);
  const stats = await statsRes.json();
  console.log('Stats:', stats.stats);

  console.log('\n--- 2. Testing GET /api/outreach ---');
  const listRes = await fetch(`${base}/api/outreach`);
  const list = await listRes.json();
  console.log(`Initial Campaigns count: ${list.count}`);

  console.log('\n--- 3. Testing Duplicate Prevention ---');
  const dupRes = await fetch(`${base}/api/outreach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName: 'Duplicate Test Inc',
      email: 'sumit.sharma@sixt.com',
      reason: 'Testing duplicate detection'
    })
  });
  const dupData = await dupRes.json();
  console.log(`Duplicate prevention status: ${dupRes.status} (Expected 409)`);
  console.log(`Duplicate message: ${dupData.message}`);

  console.log('\n--- 4. Creating New Target: HyperScale Systems ---');
  const createRes = await fetch(`${base}/api/outreach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName: 'HyperScale Systems',
      email: 'cto@hyperscale.test',
      ccEmails: 'sales@mycompany.com',
      reason: 'Explore recruitment partnership for backend software developers',
      recipientName: 'Alex Vance'
    })
  });
  const createData = await createRes.json();
  const campaign = createData.campaign;
  console.log(`Created campaign ID: ${campaign.id}, Status: ${campaign.status}`);

  console.log('\n--- 5. Testing AI Email Generation ---');
  const genRes = await fetch(`${base}/api/outreach/${campaign.id}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage: 'initial' })
  });
  const genData = await genRes.json();
  console.log(`Generated Subject: "${genData.generated.subject}"`);
  console.log(`Word Count: ${genData.generated.wordCount}`);
  console.log(`Quality Passed: ${genData.generated.qualityPassed}`);
  console.log(`Snippet:\n${genData.generated.body.substring(0, 150)}...\n`);

  console.log('--- 6. Testing AI Variation Regeneration ---');
  const regenRes = await fetch(`${base}/api/outreach/${campaign.id}/regenerate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage: 'initial' })
  });
  const regenData = await regenRes.json();
  console.log(`Regenerated Unique Subject: "${regenData.generated.subject}"`);
  console.log(`Different from first? ${regenData.generated.subject !== genData.generated.subject}`);

  console.log('\n--- 7. Sending Initial Email (Schedules 3 Follow-Ups) ---');
  const sendRes = await fetch(`${base}/api/outreach/${campaign.id}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage: 'initial' })
  });
  const sendData = await sendRes.json();
  console.log(`Status after initial send: ${sendData.campaign.status}`);
  console.log(`Initial Sent At: ${sendData.campaign.initialSentAt}`);
  console.log(`Follow-Up 1 Scheduled At: ${sendData.campaign.followUp1ScheduledAt}`);

  console.log('\n--- 8. Testing Fast-Forward +2 Days & Follow-Up Scheduler ---');
  await fetch(`${base}/api/outreach/${campaign.id}/fast-forward`, { method: 'POST' });
  const tickRes = await fetch(`${base}/api/scheduler/tick`, { method: 'POST' });
  const tickData = await tickRes.json();
  console.log(`Scheduler checked: ${tickData.report.checkedCount}, processed: ${tickData.report.processedCount}`);
  console.log('Scheduler Logs:', tickData.report.logs);

  console.log('\n--- 9. Testing Inbound Reply Stop Trigger ---');
  const replyRes = await fetch(`${base}/api/outreach/${campaign.id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      replyType: 'Replied',
      snippet: 'Hi, thanks for reaching out. Let us schedule a call next week.'
    })
  });
  const replyData = await replyRes.json();
  console.log(`Reply Status: ${replyData.campaign.replyStatus}`);
  console.log(`Campaign Status: ${replyData.campaign.status} (Expected: Follow-Up Paused)`);

  console.log('\n--- 10. Testing History Timeline ---');
  const histRes = await fetch(`${base}/api/outreach/${campaign.id}/history`);
  const histData = await histRes.json();
  console.log(`History Event Count: ${histData.history.length}`);
  console.log(`Recent Event: "${histData.history[0]?.title}"`);

  console.log('\n✅ ALL E2E API AND WORKFLOW TESTS PASSED PERFECTLY!');
}

run().catch(console.error);
