export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Automated background auto-sending is intentionally disabled.
    // Follow-ups must remain intact until user manually clicks "Send Follow-Up".
    console.log('[AutoReach] Automated background email dispatch disabled. Follow-ups are controlled manually.');
  }
}
