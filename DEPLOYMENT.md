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
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `MONGODB_URI` | `mongodb+srv://tasknera:tasknera%402003@cluster0.2ba7uww.mongodb.net/tasknera?retryWrites=true&w=majority` | MongoDB Atlas Cluster URI |
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

# 2. Run the container
docker run -p 3000:3000 \
  -e MONGODB_URI="mongodb+srv://tasknera:tasknera%402003@cluster0.2ba7uww.mongodb.net/tasknera?retryWrites=true&w=majority" \
  autoreach-ai:latest
```

---

## 3. Production Environment Variables Checklist

Ensure the following variables are configured in your production environment settings:

```env
# MongoDB Atlas Database Connection
MONGODB_URI="mongodb+srv://tasknera:tasknera%402003@cluster0.2ba7uww.mongodb.net/tasknera?retryWrites=true&w=majority"

# Optional: Custom OpenAI API Key (Built-in engine works out of the box if empty)
OPENAI_API_KEY="sk-proj-..."
```

---

## 4. Default Production Access Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `sheetalbedi@tasknera.com` | `tasknera@2003` | Full access, settings, API secrets, deletions |
| **Employee** | `atul@tasknera.com` | `atul@1010` | Outreach sheets, drafting, sending, logging replies |

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
    "latencyMs": 264,
    "databaseName": "tasknera",
    "collections": ["campaigns", "settings", "test_connection"],
    "campaignsCount": 5
  }
}
```
