export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Start automated background scheduler check every 30 seconds
    try {
      const { runDueFollowUps } = await import('@/lib/scheduler');
      setInterval(async () => {
        try {
          const report = await runDueFollowUps();
          if (report && report.processedCount > 0) {
            console.log(`[AutoReach Background Scheduler] Automatically dispatched ${report.processedCount} due follow-up(s).`);
          }
        } catch {
          // ignore transient background failures
        }
      }, 30000);
      console.log('[AutoReach] Background automated email scheduler active.');
    } catch (err) {
      console.error('[AutoReach] Could not initialize background scheduler:', err);
    }
  }
}
