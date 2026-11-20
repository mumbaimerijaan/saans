import { app } from './app.js';
import { config } from './config/env.js';
import { db } from './db/index.js';

async function startServer() {
  // Authoritative Hydration from Supabase PostgreSQL on startup
  if (config.supabaseUrl && (config.supabaseServiceRoleKey || config.supabaseAnonKey)) {
    console.log('🔄 Hydrating authoritative state from Supabase PostgreSQL...');
    const hydrated = await db.hydrateFromSupabase();
    if (!hydrated) {
      throw new Error('Supabase authoritative hydration failed: database client not connected or returned failure.');
    }
  }

  app.listen(config.port, () => {
    console.log(`=========================================`);
    console.log(`🌬️  SAANS Backend Server Active`);
    console.log(`📍 Port: http://localhost:${config.port}`);
    console.log(`🌱 Environment: ${config.nodeEnv}`);
    console.log(`=========================================`);
  });
}

startServer().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
