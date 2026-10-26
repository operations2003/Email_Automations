process.env.NODE_ENV = 'test';
process.env.SIMULATE_EMAIL = 'true';

import assert from 'assert';
import {
  processIncomingEmail,
  analyzeEmailForSpamOrAutomation,
  detectDepartment,
  formatTemplateText
} from '../src/lib/inbox-engine.ts';
import {
  readConversations,
  getInboxTemplateByDepartment,
  getConversationById,
  hasMessageBeenProcessed
} from '../src/lib/inbox-db.ts';

async function runTests() {
  console.log('🧪 Starting Inbox Automation & Auto-Acknowledgment Tests...\n');

  // Test 1: Anti-Spam & Bot Detection
  console.log('Test 1: Anti-Spam & Bot Filtering');
  const spam1 = analyzeEmailForSpamOrAutomation({
    from: 'no-reply@automated-system.net',
    to: 'operations@tasknera.com',
    subject: 'Notification: Build failed'
  });
  assert.strictEqual(spam1.isSpamOrAutomated, true, 'no-reply address should be flagged as spam/automated');

  const spam2 = analyzeEmailForSpamOrAutomation({
    from: 'john.smith@clientcorp.com',
    to: 'operations@tasknera.com',
    subject: 'Automatic reply: Out of office until next Monday'
  });
  assert.strictEqual(spam2.isSpamOrAutomated, true, 'Out of office subject should be flagged as automated');

  const clean = analyzeEmailForSpamOrAutomation({
    from: 'alex.morgan@novapartner.io',
    to: 'operations@tasknera.com',
    subject: 'Partnership Inquiry for Q4'
  });
  assert.strictEqual(clean.isSpamOrAutomated, false, 'Genuine inquiry should pass spam check');
  console.log('  ✅ Passed: Spam, bot, and out-of-office autoreplies accurately flagged.\n');

  // Test 2: Department Routing
  console.log('Test 2: Department Routing');
  const deptCareers = detectDepartment({
    from: 'candidate@test.com',
    to: 'careers@tasknera.com',
    subject: 'My CV for Software Engineer'
  });
  assert.strictEqual(deptCareers.department, 'careers', 'careers@ mailbox should route to careers department');

  const deptSupport = detectDepartment({
    from: 'client@test.com',
    to: 'support@tasknera.com',
    subject: 'Bug report on API webhook'
  });
  assert.strictEqual(deptSupport.department, 'support', 'support@ mailbox should route to support department');

  const deptHR = detectDepartment({
    from: 'staff@test.com',
    to: 'hr@tasknera.com',
    subject: 'Policy question'
  });
  assert.strictEqual(deptHR.department, 'hr', 'hr@ mailbox should route to HR department');

  const deptRecruitment = detectDepartment({
    from: 'agency@test.com',
    to: 'recruitment@tasknera.com',
    subject: 'Staffing partnership'
  });
  assert.strictEqual(deptRecruitment.department, 'recruitment', 'recruitment@ mailbox should route to recruitment department');

  const deptOps = detectDepartment({
    from: 'partner@test.com',
    to: 'operations@tasknera.com',
    subject: 'General operations inquiry'
  });
  assert.strictEqual(deptOps.department, 'operations', 'operations@ mailbox should route to operations department');
  console.log('  ✅ Passed: All 5 departmental mailboxes correctly route inbound mail.\n');

  // Test 3: Template Formatting
  console.log('Test 3: Template Personalization');
  const tpl = await getInboxTemplateByDepartment('operations');
  const formatted = formatTemplateText(tpl.bodyTemplate, {
    senderName: 'Elena Rostova',
    senderEmail: 'elena@rostovagroup.com',
    department: 'Operations',
    subject: 'Consulting Proposal',
    ticketNumber: 'TNK-9999',
    companyName: 'TaskNera Solutions',
    receivedAt: 'Oct 26, 2026'
  });
  assert.ok(formatted.includes('Elena Rostova'), 'Template should contain sender name');
  assert.ok(formatted.includes('TNK-9999'), 'Template should contain ticket number');
  assert.ok(formatted.includes('TaskNera Operations'), 'Template should contain department name');
  console.log('  ✅ Passed: Dynamic template replacement works with all tokens.\n');

  // Test 4: Inbound Email Processing & Auto-Acknowledgment Dispatch
  console.log('Test 4: Inbound Processing & Auto-Acknowledgment');
  const testSender = `elena.rostova.${Date.now()}@rostovagroup.com`;
  const testMsgId = `test_msg_${Date.now()}@example.com`;
  const result1 = await processIncomingEmail({
    from: testSender,
    fromName: 'Elena Rostova',
    to: 'operations@tasknera.com',
    subject: `Inquiry regarding Enterprise Automation Capabilities ${Date.now()}`,
    text: 'Hello, we would like to know if TaskNera can support our 24/7 automation pipelines.',
    messageId: testMsgId
  });

  assert.strictEqual(result1.success, true);
  assert.ok(result1.conversation.ticketNumber.startsWith('TNK-'), 'Ticket number should start with TNK-');
  assert.strictEqual(result1.conversation.department, 'operations');
  assert.strictEqual(result1.acknowledgmentSent, true, 'Auto-acknowledgment should be sent for clean external inquiry');
  assert.strictEqual(result1.conversation.acknowledgmentStatus, 'sent');
  console.log(`  ✅ Passed: Conversation ${result1.conversation.ticketNumber} created with Auto-Ack dispatched.\n`);

  // Test 5: Strict Single-Ack Rule (Second message in same thread does NOT re-ack)
  console.log('Test 5: Strict Single-Ack Rule per Conversation');
  const secondMsgId = `test_msg_reply_${Date.now()}@example.com`;
  const result2 = await processIncomingEmail({
    from: testSender,
    fromName: 'Elena Rostova',
    to: 'operations@tasknera.com',
    subject: `Re: Inquiry regarding Enterprise Automation Capabilities [Ref: #${result1.conversation.ticketNumber}]`,
    text: 'Following up with additional requirements document.',
    messageId: secondMsgId,
    inReplyTo: testMsgId
  });

  assert.strictEqual(result2.success, true);
  assert.strictEqual(result2.conversation.id, result1.conversation.id, 'Should thread into existing conversation');
  assert.strictEqual(result2.acknowledgmentSent, false, 'Auto-ack must NOT be re-sent for same conversation thread');
  assert.strictEqual(result2.reason, 'Acknowledgment already sent for this conversation');
  console.log('  ✅ Passed: Single-Ack rule strictly enforced on subsequent replies in the thread.\n');

  // Test 6: Deduplication Check
  console.log('Test 6: Email Deduplication Check');
  const duplicateResult = await processIncomingEmail({
    from: testSender,
    fromName: 'Elena Rostova',
    to: 'operations@tasknera.com',
    subject: `Inquiry regarding Enterprise Automation Capabilities ${Date.now()}`,
    text: 'Hello, we would like to know if TaskNera can support our 24/7 automation pipelines.',
    messageId: testMsgId // EXACT SAME MESSAGE ID
  });

  assert.strictEqual(duplicateResult.duplicate, true, 'Exact same Message-ID must be recognized as duplicate');
  assert.strictEqual(duplicateResult.acknowledgmentSent, false, 'Duplicate must not send ack');
  console.log('  ✅ Passed: Message deduplication correctly prevents double processing.\n');

  // Test 7: Spam Auto-Exclusion
  console.log('Test 7: Spam Email Auto-Exclusion');
  const spamResult = await processIncomingEmail({
    from: 'no-reply@mailer-bot.example.net',
    fromName: 'Bot System',
    to: 'support@tasknera.com',
    subject: 'Out of Office: vacation auto-responder',
    text: 'I am on vacation.',
    messageId: `spam_${Date.now()}@example.net`
  });

  assert.strictEqual(spamResult.conversation.status, 'spam');
  assert.strictEqual(spamResult.conversation.acknowledgmentStatus, 'skipped');
  assert.strictEqual(spamResult.acknowledgmentSent, false);
  console.log('  ✅ Passed: Spam message automatically marked as spam and auto-ack skipped.\n');

  console.log('🎉 ALL 7 INBOX AUTOMATION & AUTO-ACKNOWLEDGMENT TESTS PASSED PERFECTLY!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
