# AutoReach AI — Smart Spreadsheet & Follow-Up Management System

A production-grade, AI-powered cold email outreach and automated 3-stage follow-up sequencer built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Lucide Icons**.

---

## 🚀 Key Features

### 1. Spreadsheet-Style Interface (Google Sheets Feel)
Features an interactive 18-column spreadsheet view:
1. **Date**
2. **Company Name** (with optional website & recipient name)
3. **Email Address** (with quick copy-to-clipboard)
4. **Keep in CC**
5. **Reason for Email**
6. **Subject** (AI generated with single-click trigger)
7. **Email Template** (AI generated body snippet)
8. **Status** (Supports all 14 statuses: *Draft, Ready to Send, Initial Email Sent, Follow-Up Scheduled, Follow-Up 1 Sent, Follow-Up 2 Sent, Follow-Up 3 Sent, Replied, Interested, Meeting Scheduled, Not Interested, Closed, Completed - No Response, Follow-Up Paused*)
9. **Initial Email Sent At** (Timestamp)
10. **Follow-Up 1** (Day 2 copy)
11. **Follow-Up 1 Date** (Scheduled / Sent date)
12. **Follow-Up 2** (Day 4 copy)
13. **Follow-Up 2 Date** (Scheduled / Sent date)
14. **Follow-Up 3** (Day 6 closing loop)
15. **Follow-Up 3 Date** (Scheduled / Sent date)
16. **Reply Status** (*Not Replied, Replied, Interested, Meeting Requested, Bounced*)
17. **Last Activity** (Timestamp & description)
18. **Actions** (*Generate, Send, Preview, Regenerate, View History, Fast-Forward +2d, Simulate Reply, Delete*)

### 2. Dual AI Generation & Dynamic Variation Engine
- **Anti-Repetition Engine**: Automatically stores and inspects previously generated subjects and copy for each target to ensure no repetitive openings, subject lines, or templates are ever reused.
- **Spam Phrase Filter & Quality Checks**: Enforces zero spam clichés (*"Hope you're doing well"*, *"I am writing to introduce"*, *"We would love to connect"*, etc.), no fake urgency, and strict length benchmarks.
- **Dual Engine**: Works out-of-the-box with an internal intelligent semantic generation engine (no API key required), and seamlessly integrates with OpenAI (`gpt-4o-mini` / `gpt-4o`) when an `OPENAI_API_KEY` is provided.

### 3. Automated 3-Stage Follow-Up Sequence (Day 0 → Day 2 → Day 4 → Day 6)
- **Initial Email (Day 0)**: Compelling introduction, value proposition, and low-friction CTA (100–180 words).
- **Follow-Up 1 (Day 2)**: Short reminder + additional value angle or proof point (50–120 words).
- **Follow-Up 2 (Day 4)**: Specific benefit, concrete use case, or focused question (50–100 words).
- **Follow-Up 3 (Day 6)**: Polite closing loop, zero pressure, graceful exit (40–80 words). If no response, transitions to *Completed - No Response*.

### 4. Automatic Halt on Inbound Reply
- If the recipient replies (or is simulated / webhook-triggered):
  - **Reply Status** switches to `Replied`.
  - **Status** switches to `Follow-Up Paused`.
  - All pending automated follow-ups immediately stop.
  - Option to manually resume if desired.

### 5. Duplicate Contact Prevention
- Automatically detects if a recipient email already exists before creating campaigns.
- Displays duplicate resolution modal: `[View Existing]`, `[Create New Campaign Anyway]`, or `[Cancel]`.

### 6. Interactive Testing & Simulation Tools
- **Simulate Reply Button**: Instantly verifies that an inbound reply pauses the sequence.
- **Fast-Forward +2 Days Button**: Advances schedule timestamps by 2 days so you can test Follow-Up 1, 2, and 3 triggers immediately without waiting 48 hours.
- **Manual Scheduler Trigger**: `Run Due Follow-Ups` button + autonomous background interval runner every 30 seconds.

### 7. SaaS Dashboard & Analytics
- Displays KPI cards: *Total Companies, Emails Sent, Due Today, Follow-Ups Sent, Replies, Interested, Meetings, Completed Campaigns*.
- Pipeline stage funnel and reply conversion rate charts.

---

## 🛠️ Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with rich dark theme
- **Icons**: Lucide React
- **Data Persistence**: Atomic JSON storage in `data/`
- **Scheduler**: Backend automated cron/tick worker (`POST /api/scheduler/tick`)

---

## 🔐 Environment Configuration & Email Setup

### 1. Local Setup
Copy the environment template and customize:
```bash
cp .env.example .env.local
```

Configure your email delivery credentials in `.env.local`:
```env
# Company Email & SMTP Settings
EMAIL_PROVIDER="smtp"
EMAIL_USER="operations@yourcompany.com"
EMAIL_PASSWORD="your_16_character_app_password"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false

# Optional Database & OpenAI
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/tasknera?retryWrites=true&w=majority"
OPENAI_API_KEY=""
```

> **Google Workspace / Gmail Notice**: Google requires a 16-character **App Password** for automated email sending (not your standard Google account login password). Generate one at: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).

### 2. Secret Scanning & Security Verification
To verify your project and staged commits for secrets before pushing:
```bash
npm run security:scan
```

---

## 🏃 Running the Application

### Development:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Production Build & Start:
```bash
npm run build
npm run start -- -p 3000
```
Open [http://localhost:3000](http://localhost:3000)

---

## 📡 API Reference
- `GET /api/outreach` — List campaigns with search, filter, and sorting.
- `POST /api/outreach` — Create campaign with duplicate prevention.
- `GET /api/outreach/:id` — Get campaign details.
- `PUT /api/outreach/:id` — Update campaign fields/status.
- `DELETE /api/outreach/:id` — Delete campaign.
- `POST /api/outreach/:id/generate` — AI generate initial or follow-up email.
- `POST /api/outreach/:id/regenerate` — Generate fresh unique variation.
- `POST /api/outreach/:id/send` — Send email and schedule +2 day follow-ups.
- `POST /api/outreach/:id/pause` — Pause follow-ups.
- `POST /api/outreach/:id/resume` — Resume follow-ups.
- `POST /api/outreach/:id/reply` — Register reply and halt follow-ups.
- `POST /api/outreach/:id/fast-forward` — Advance schedule +2 days for testing.
- `GET /api/outreach/:id/history` — Get conversation timeline.
- `POST /api/webhooks/email` — Inbound reply webhook.
- `GET /api/dashboard/stats` — Dashboard analytics and KPI metrics.
- `POST /api/scheduler/tick` — Check and execute due follow-ups.
- `GET /api/settings` & `POST /api/settings` — App configuration.
