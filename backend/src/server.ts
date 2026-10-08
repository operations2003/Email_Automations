import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import outreachRouter from './routes/outreach.js';
import dashboardRouter from './routes/dashboard.js';
import settingsRouter from './routes/settings.js';
import schedulerRouter from './routes/scheduler.js';
import webhooksRouter from './routes/webhooks.js';
import { runDueFollowUps } from './services/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Mount API routes
app.use('/api/outreach', outreachRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/scheduler', schedulerRouter);
app.use('/api/webhooks', webhooksRouter);

import { checkBackendDbHealth } from './services/mongodb.js';

// Health check with real database connectivity check
app.get('/health', async (_req, res) => {
  const dbHealth = await checkBackendDbHealth();
  res.json({
    status: dbHealth.connected ? 'ok' : 'degraded',
    service: 'AutoReach AI Backend Engine',
    timestamp: new Date().toISOString(),
    database: {
      provider: 'MongoDB Atlas',
      connected: dbHealth.connected,
      latencyMs: dbHealth.latencyMs ?? null,
      databaseName: dbHealth.database,
      collections: dbHealth.collections || [],
      error: dbHealth.error || null
    }
  });
});

// Automated background scheduler cron (runs every 30 seconds)
cron.schedule('*/30 * * * * *', async () => {
  try {
    const report = await runDueFollowUps();
    if (report.processedCount > 0) {
      console.log(`[Scheduler Cron] Executed ${report.processedCount} due follow-up(s) automatically.`);
    }
  } catch (err) {
    console.error('[Scheduler Cron Error]:', err);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AutoReach Backend running on http://localhost:${PORT}`);
  console.log(`⏰ Automated Follow-Up Scheduler active (checking every 30s)`);
});
