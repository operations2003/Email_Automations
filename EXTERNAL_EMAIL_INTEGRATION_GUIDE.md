# AutoReach AI — External Email Connections, Configuration & Infrastructure Guide
**Document Owner:** Shubham (External Integrations, Provider Configuration & Infrastructure)  
**Application Developer:** Sakshi (Application Code, UI, Backend APIs, Inbox Automation Engine)  
**System Domain:** `tasknera.com`  
**Status:** Ready for Provider Credential & Mailbox Binding (Application Engine Tested & Validated)

---

## Executive Summary & Current System State

The **AutoReach AI / Sheet-Outreach** platform includes a fully implemented **Inbox Automation & Auto-Acknowledgment Module**. 

### Verified Infrastructure State
- **Email Host**: **Google Workspace** (MX records confirmed pointing to `aspmx.l.google.com`, `alt1.aspmx.l.google.com`, etc.)
- **SPF Record**: `v=spf1 include:_spf.google.com ~all` (Configured & Validated)
- **DMARC Record**: `v=DMARC1; p=none; rua=mailto:sheetalbedi@tasknera.com; ...` (Configured & Reporting)
- **DKIM Selector**: `google._domainkey.tasknera.com` (Google Workspace Standard)
- **Application Test Status**: All 7 core inbox automation tests, 6 security tests, and 6 deliverability/DNS tests pass 100%.

> [!IMPORTANT]
> **Live Mailbox Notice**: The application engine currently operates in simulated / testing mode until Shubham provisions the production Google Workspace credentials, webhook callbacks, or OAuth credentials. Do not mark live mailbox automation as active until end-to-end delivery is confirmed across both departmental inboxes.

---

## Phase 1: Review Existing Email Infrastructure

| Component | Current State | Notes |
| :--- | :--- | :--- |
| **Domain** | `tasknera.com` | Primary corporate domain |
| **Email Host** | **Google Workspace** | Verified via DNS MX records (`aspmx.l.google.com`) |
| **Outgoing Sending** | SMTP (`smtp.gmail.com:587`, TLS) or Resend API | Outgoing auto-acknowledgments and outreach emails |
| **Incoming Detection** | Webhook Engine (`/api/inbox/webhook`) | Ready to receive both `multipart/form-data` and `application/json` |
| **Cross-Linking** | Active | Inbound replies automatically pause cold outreach sequences |

> [!WARNING]
> **SMTP Limitation**: SMTP (Simple Mail Transfer Protocol) is strictly an **outgoing/transmission** protocol. It cannot retrieve or detect incoming emails. Incoming email connectivity requires either:
> 1. An Inbound Webhook forwarder / parser, OR
> 2. Gmail API with OAuth 2.0 / PubSub notifications, OR
> 3. IMAP mailbox polling.

---

## Phase 2: Departmental Mailboxes to Connect

The application has configured dedicated routing, ticket formatting, and automated templates for 5 departmental mailboxes:

1. **Operations**: `operations@tasknera.com` (Primary operational & business communications)
2. **Careers**: `careers@tasknera.com` (Job applications, CVs, candidate correspondence)
3. **Human Resources**: `hr@tasknera.com` (Employee relations, workplace policies)
4. **Recruitment**: `recruitment@tasknera.com` (Staffing agencies, talent sourcing)
5. **Support**: `support@tasknera.com` (Technical help desk, bug reports, user assistance)

---

## Phase 3: Authentication & Credentials (Google Workspace)

To connect Google Workspace securely without exposing root account credentials:

### Method A: Google Workspace App Passwords (Recommended for SMTP Outgoing)
1. Log in to the TaskNera Google Workspace Admin Console (`admin.google.com`).
2. Ensure 2-Step Verification (2FA) is enabled for `operations@tasknera.com` and `careers@tasknera.com`.
3. In each account's Google Account security settings (`https://myaccount.google.com/apppasswords`), generate a dedicated 16-character **App Password**:
   - App Name: `AutoReach AI Auto-Acknowledgment`
4. Set the resulting credentials in the server environment variables (`EMAIL_USER` and `EMAIL_PASSWORD`).

### Method B: Gmail API with OAuth 2.0 (For Advanced Direct Mailbox API Integration)
If connecting via Google Cloud Platform (GCP) OAuth:
1. Create a GCP Project: `TaskNera-Inbox-Automation`.
2. Enable the **Gmail API** in APIs & Services.
3. Configure the OAuth Consent Screen:
   - User Type: **Internal** (restricted to `@tasknera.com` users).
4. Create OAuth 2.0 Client IDs:
   - Application Type: Web application.
   - Authorized redirect URIs: `https://<production-domain>/api/auth/callback/google`
5. Minimum Scopes Required (Least Privilege):
   - `https://www.googleapis.com/auth/gmail.send` (to send acknowledgments)
   - `https://www.googleapis.com/auth/gmail.readonly` (to read incoming messages)
   - `https://www.googleapis.com/auth/gmail.modify` (to label or archive processed emails)
6. Securely store `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and refresh tokens in your cloud secret manager.

---

## Phase 4: Incoming Email Connectivity & Webhook Setup

The application exposes a production-ready webhook endpoint designed to receive inbound emails from mail forwarders and providers.

### Endpoint Details
- **Production URL**: `https://<YOUR_PRODUCTION_DOMAIN>/api/inbox/webhook`
- **Query Parameter Token Auth**: `https://<YOUR_PRODUCTION_DOMAIN>/api/inbox/webhook?token=<INBOX_WEBHOOK_SECRET>`
- **Header Auth**: `Authorization: Bearer <INBOX_WEBHOOK_SECRET>`
- **Accepted Formats**:
  - `multipart/form-data` (SendGrid Inbound Parse, Cloudmailin, Mailgun, Postmark)
  - `application/json` (Custom JSON forwarders, GCP Cloud Function relays)

### Supported Inbound Webhook Providers
To pipe incoming emails from `operations@tasknera.com` and `careers@tasknera.com` into the webhook:

#### Option 1: Google Workspace Email Routing Rule (No 3rd Party Cost)
1. In Google Workspace Admin Console, go to **Apps > Google Workspace > Gmail > Routing**.
2. Add a Routing Rule for `operations@tasknera.com` and `careers@tasknera.com`:
   - Dual-deliver or forward a copy to an inbound parser address (e.g. `tasknera-inbound@cloudmailin.net` or `inbound.tasknera.com`).
3. The parser sends an HTTP POST with the parsed email to `/api/inbox/webhook?token=YOUR_SECRET`.

#### Option 2: SendGrid Inbound Parse or Cloudmailin
1. Point MX records for a dedicated subdomain (e.g. `parse.tasknera.com`) to the parser service.
2. Set the Destination Webhook URL to:
   ```
   https://<YOUR_APP_DOMAIN>/api/inbox/webhook?token=INBOX_WEBHOOK_SECRET
   ```
3. Whenever an email arrives, the parser posts multipart form data with fields: `from`, `to`, `subject`, `text`, `html`, `headers`, and `message-id`.

---

## Phase 5: Outgoing Acknowledgment Configuration

1. **From Address Alignment**:
   - Operations acknowledgments are sent as: `"TaskNera Operations" <operations@tasknera.com>`
   - Careers acknowledgments are sent as: `"TaskNera Talent Acquisition" <careers@tasknera.com>`
2. **Reply-To & Threading**:
   - The engine automatically attaches `In-Reply-To` and `References` headers matching the sender's original RFC `Message-ID`.
   - Headers include `Auto-Submitted: auto-replied` and `X-Auto-Response-Suppress: All` to avoid generating autoreply loops with other servers.
3. **Single-Acknowledgment Protection**:
   - The engine strictly enforces a **1-ack-per-conversation** rule.
   - Follow-up replies in the same thread do not trigger additional automated emails.

---

## Phase 6: Production Environment Variables Checklist

Set these environment variables in your production hosting platform (Vercel, Railway, Render, or Docker `.env`):

```env
# ==============================================================================
# Database Configuration
# ==============================================================================
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/tasknera?retryWrites=true&w=majority"

# ==============================================================================
# Outgoing Mailbox SMTP Credentials (Google Workspace)
# ==============================================================================
EMAIL_PROVIDER="smtp"
EMAIL_USER="operations@tasknera.com"
EMAIL_PASSWORD="<16_character_google_app_password>"
EMAIL_SENDER_NAME="TaskNera Operations"
DEFAULT_CC="operations@tasknera.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false

# ==============================================================================
# Inbound Webhook Security Token
# ==============================================================================
# Required to authenticate incoming webhook requests from mail parsers
INBOX_WEBHOOK_SECRET="<generate_a_random_32_character_hex_token>"

# ==============================================================================
# System RBAC Credentials (Admin & Staff)
# ==============================================================================
ADMIN_EMAIL="sheetalbedi@tasknera.com"
ADMIN_PASSWORD="<production_secure_admin_password>"
EMPLOYEE_EMAIL="atul@tasknera.com"
EMPLOYEE_PASSWORD="<production_secure_employee_password>"

# ==============================================================================
# Generative AI (Optional, Built-in Fallback Active if Empty)
# ==============================================================================
OPENAI_API_KEY=""
```

---

## Phase 7: End-to-End Testing Procedure (Shubham & Sakshi)

Once Shubham completes environment and webhook configuration, perform the following verification protocol:

1. **Operations Inquiry Test**:
   - From an external email (e.g. `test.contact@gmail.com`), send an email to `operations@tasknera.com` with subject: `Business Consultation Request`.
   - **Expected Result**: 
     - Webhook receives payload.
     - Conversation is registered in MongoDB with ticket `TNK-XXXX`.
     - Automated acknowledgment is received in the sender's inbox from `operations@tasknera.com` within seconds.
     - In-Reply-To references the original message.

2. **Careers Application Test**:
   - From an external email, send an email to `careers@tasknera.com` with subject: `Application for Senior Engineer`.
   - **Expected Result**:
     - Routed automatically to `careers` department.
     - Ticket tagged with careers acknowledgment template.
     - Confirmation email received from `careers@tasknera.com`.

3. **Loop Prevention & Duplicate Test**:
   - Reply to the received confirmation email.
   - **Expected Result**: Message is appended to the existing conversation thread, status updates to `pending_human`, and **NO second auto-acknowledgment is dispatched**.

4. **Cold Outreach Reply-Pause Test**:
   - Send an email from a lead address currently queued in an active outreach sequence.
   - **Expected Result**: Outreach sequence immediately pauses (`Follow-Up Paused`), status updates to `Replied`, and reply is logged in activity history.

---

## Phase 8: Troubleshooting & Support

| Symptom | Probable Cause | Action |
| :--- | :--- | :--- |
| `401 Unauthorized` on `/api/inbox/webhook` | Webhook secret mismatch | Verify `?token=` parameter matches `INBOX_WEBHOOK_SECRET` in environment variables |
| Auto-ack not delivered | Invalid SMTP credentials | Confirm 16-character Google App Password for `EMAIL_PASSWORD` without extra spaces |
| Inbound email not reaching app | DNS MX or parser routing not active | Verify parser MX records or Google Workspace dual-delivery routing rule |
| Outgoing email landing in spam | SPF / DKIM alignment | Check `verifyDomainDns('tasknera.com')` via UI Settings to ensure SPF and DMARC pass |
