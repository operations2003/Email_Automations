#!/usr/bin/env node

/**
 * Email Deliverability Diagnostic Tool
 * Checks domain authentication, reputation, and configuration
 */

import { promises as dns } from 'dns';
import https from 'https';

const DOMAIN = 'tasknera.com';
const SENDER_EMAIL = 'operations@tasknera.com';

console.log('🔍 EMAIL DELIVERABILITY DIAGNOSTIC\n');
console.log(`Domain: ${DOMAIN}`);
console.log(`Sender: ${SENDER_EMAIL}\n`);

async function checkDNSRecord(domain, type, description) {
  try {
    const records = await dns.resolve(domain, type);
    console.log(`✅ ${description}:`);
    records.forEach(record => console.log(`   ${record}`));
    return records;
  } catch (error) {
    console.log(`❌ ${description}: NOT FOUND`);
    return [];
  }
}

async function checkSPF() {
  console.log('\n📧 SPF (Sender Policy Framework) Check:');
  const txtRecords = await checkDNSRecord(DOMAIN, 'TXT', 'TXT Records');
  
  const spfRecord = txtRecords.find(record => 
    typeof record === 'string' ? record.startsWith('v=spf1') : 
    record.includes && record.includes('v=spf1')
  );
  if (spfRecord) {
    console.log(`✅ SPF Record Found: ${spfRecord}`);
    
    // Check if Gmail is included
    if (spfRecord.includes('include:_spf.google.com') || spfRecord.includes('include:gmail.com')) {
      console.log('✅ Gmail/Google Workspace included in SPF');
    } else {
      console.log('❌ Gmail/Google Workspace NOT included in SPF - THIS IS THE PROBLEM!');
      console.log('   Add this SPF record: v=spf1 include:_spf.google.com ~all');
    }
  } else {
    console.log('❌ NO SPF RECORD FOUND - CRITICAL ISSUE!');
    console.log('   Add this SPF record: v=spf1 include:_spf.google.com ~all');
  }
}

async function checkDKIM() {
  console.log('\n🔐 DKIM (DomainKeys Identified Mail) Check:');
  
  // Common DKIM selectors for Google Workspace
  const selectors = ['google', 'default', 'selector1', 'selector2'];
  let dkimFound = false;
  
  for (const selector of selectors) {
    try {
      const dkimDomain = `${selector}._domainkey.${DOMAIN}`;
      const records = await dns.resolve(dkimDomain, 'TXT');
      if (records.length > 0) {
        console.log(`✅ DKIM Record Found (${selector}): ${records[0]}`);
        dkimFound = true;
      }
    } catch (error) {
      // Continue checking other selectors
    }
  }
  
  if (!dkimFound) {
    console.log('❌ NO DKIM RECORDS FOUND - MAJOR DELIVERABILITY ISSUE!');
    console.log('   Set up DKIM in Google Workspace Admin Console');
  }
}

async function checkDMARC() {
  console.log('\n🛡️ DMARC (Domain-based Message Authentication) Check:');
  try {
    const dmarcDomain = `_dmarc.${DOMAIN}`;
    const records = await dns.resolve(dmarcDomain, 'TXT');
    
    if (records.length > 0) {
      console.log(`✅ DMARC Record Found: ${records[0]}`);
      
      const dmarcRecord = records[0];
      if (dmarcRecord.includes('p=reject') || dmarcRecord.includes('p=quarantine')) {
        console.log('⚠️  DMARC policy is strict - good for reputation but requires perfect setup');
      } else {
        console.log('✅ DMARC policy allows monitoring');
      }
    }
  } catch (error) {
    console.log('❌ NO DMARC RECORD FOUND - RECOMMENDED FOR REPUTATION');
    console.log('   Add: v=DMARC1; p=none; rua=mailto:dmarc@tasknera.com');
  }
}

async function checkMXRecords() {
  console.log('\n📬 MX (Mail Exchange) Records:');
  await checkDNSRecord(DOMAIN, 'MX', 'MX Records');
}

async function checkReputationServices() {
  console.log('\n📊 REPUTATION CHECKS:');
  
  const reputationChecks = [
    {
      name: 'Google Postmaster',
      url: 'https://postmaster.google.com',
      note: 'Register domain to monitor Gmail deliverability'
    },
    {
      name: 'Microsoft SNDS',
      url: 'https://sendersupport.olc.protection.outlook.com/snds/',
      note: 'Monitor Outlook deliverability'
    },
    {
      name: 'Sender Score',
      url: 'https://senderscore.org',
      note: 'Check IP reputation (0-100 score)'
    }
  ];
  
  reputationChecks.forEach(check => {
    console.log(`🔗 ${check.name}: ${check.url}`);
    console.log(`   ${check.note}`);
  });
}

async function checkBlacklists() {
  console.log('\n🚫 BLACKLIST CHECKS:');
  
  // Get MX records to find mail server IPs
  try {
    const mxRecords = await dns.resolve(DOMAIN, 'MX');
    console.log('📋 Check these IPs/domains on blacklist services:');
    
    for (const mx of mxRecords) {
      console.log(`   ${mx.exchange} (priority: ${mx.priority})`);
    }
    
    console.log('\n🔍 Recommended blacklist checkers:');
    console.log('   • MXToolbox: https://mxtoolbox.com/blacklists.aspx');
    console.log('   • MultiRBL: http://multirbl.valli.org/');
    console.log('   • Spamhaus: https://www.spamhaus.org/lookup/');
    
  } catch (error) {
    console.log('❌ Could not resolve MX records for blacklist checking');
  }
}

function provideSolutions() {
  console.log('\n🔧 IMMEDIATE FIXES TO IMPLEMENT:\n');
  
  console.log('1️⃣ SET UP SPF RECORD (CRITICAL):');
  console.log('   Add this TXT record to tasknera.com DNS:');
  console.log('   Name: @');
  console.log('   Value: v=spf1 include:_spf.google.com ~all\n');
  
  console.log('2️⃣ SET UP DKIM (CRITICAL):');
  console.log('   • Go to Google Workspace Admin Console');
  console.log('   • Navigate to Apps > Google Workspace > Gmail > Authenticate email');
  console.log('   • Generate DKIM keys and add the provided DNS records\n');
  
  console.log('3️⃣ SET UP DMARC (RECOMMENDED):');
  console.log('   Add this TXT record to tasknera.com DNS:');
  console.log('   Name: _dmarc');
  console.log('   Value: v=DMARC1; p=none; rua=mailto:dmarc@tasknera.com\n');
  
  console.log('4️⃣ WARM UP YOUR DOMAIN:');
  console.log('   • Start with 5-10 emails per day');
  console.log('   • Gradually increase volume over 2-4 weeks');
  console.log('   • Send to engaged recipients first\n');
  
  console.log('5️⃣ MONITOR REPUTATION:');
  console.log('   • Register with Google Postmaster Tools');
  console.log('   • Monitor bounces and spam complaints');
  console.log('   • Keep spam rate below 0.1%\n');
  
  console.log('6️⃣ USE DEDICATED IP (Optional):');
  console.log('   • Consider dedicated IP for high volume (500+ emails/day)');
  console.log('   • Use services like SendGrid, Mailgun, or Amazon SES');
}

// Run all checks
async function runDiagnostics() {
  try {
    await checkSPF();
    await checkDKIM();
    await checkDMARC();
    await checkMXRecords();
    await checkReputationServices();
    await checkBlacklists();
    provideSolutions();
    
    console.log('\n✨ Run this script regularly to monitor your domain health!');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

runDiagnostics();