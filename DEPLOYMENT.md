# AutoReach AI — Production Deployment Guide

This project is 100% production-ready and can be deployed with zero friction on **Vercel**, **Railway**, **Render**, **Docker**, or any Node.js hosting platform.

---

## 1. Quick Deploy on Vercel (Recommended)

Because AutoReach AI is a modern Next.js App Router application with integrated API routes, Vercel gives you high-performance serverless endpoints and global edge CDN with zero server maintenance.

### Steps:
1. Push your code to your GitHub repository:
   ```bash
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository (`Email_Automations`).
4. Set the **Environment Variables**:
   | Variable | Value (Example) | Description |
   | :--- | :--- | :--- |
   | `MONGODB_URI` | `mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/tasknera?retryWrites=true&w=majority` | MongoDB Atlas Cluster URI |
   | `EMAIL_USER` | `operations@yourcompany.com` | Google Workspace / SMTP sender email |
   | `EMAIL_PASSWORD` | `your_16_char_app_password` | 16-character Google App Password |
   | `SMTP_HOST` | `smtp.gmail.com` | SMTP Host |
   | `SMTP_PORT` | `587` | SMTP Port |
   | `OPENAI_API_KEY` | *(Your OpenAI Key, or leave empty to use built-in AI engine)* | Generative Model API Key |
5. Click **"Deploy"**.
6. That's it! Your app will be live with a production HTTPS URL in under 2 minutes.

---

## 2. Deploy with Docker (Railway / Render / DigitalOcean / VPS)

The repository includes an optimized multi-stage `Dockerfile`.

### Build and Run locally:
```bash
# 1. Build the Docker image
docker build -t autoreach-ai:latest .

# 2. Run the container with environment variables
docker run -p 3000:3000 \
  -e MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/tasknera?retryWrites=true&w=majority" \
  -e EMAIL_USER="your_email@example.com" \
  -e EMAIL_PASSWORD="your_app_password" \
  autoreach-ai:latest
```

---

## 3. Production Environment Variables Checklist

Ensure the following variables are configured in your production environment settings (or `.env.local` locally):

```env
# MongoDB Atlas Database Connection
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/tasknera?retryWrites=true&w=majority"

# Email Delivery Configuration (Google Workspace / Gmail / Custom SMTP)
EMAIL_PROVIDER="smtp"
EMAIL_USER="your_company_email@example.com"
EMAIL_PASSWORD="your_app_password"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false

# Optional: Custom OpenAI API Key (Built-in engine works out of the box if empty)
OPENAI_API_KEY="sk-..."

# Optional: Production Role Overrides
ADMIN_EMAIL="admin@yourcompany.com"
ADMIN_PASSWORD="your_strong_admin_password"
EMPLOYEE_EMAIL="employee@yourcompany.com"
EMPLOYEE_PASSWORD="your_strong_employee_password"
```

---

## 4. Production Role-Based Access Control (RBAC)

Access to the system is divided into two primary tiers:

| Role | Default Email | Permissions |
| :--- | :--- | :--- |
| **Admin** | `sheetalbedi@tasknera.com` | Full system access, company management, settings, API configurations |
| **Employee** | `atul@tasknera.com` | Outreach sheets, drafting, email sending, logging replies |

> **Security Note:** In production, you can customize the email and password for Admin and Employee by defining `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `EMPLOYEE_EMAIL`, and `EMPLOYEE_PASSWORD` in your hosting provider's environment variables.

---

## 5. Automated Health & Diagnostics

Once deployed, you can verify your production cluster connectivity via the health endpoint:
```
GET /api/health
```
**Response Preview:**
```json
{
  "status": "healthy",
  "service": "AutoReach AI Full-Stack Platform",
  "database": {
    "provider": "MongoDB Atlas",
    "connected": true,
    "latencyMs": 140,
    "databaseName": "tasknera",
    "collections": ["campaigns", "settings", "companies"]
  }
}
```
