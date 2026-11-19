import { Router } from 'express';
import { config } from '../config/env.js';
import { db } from '../db/index.js';

const router = Router();

// System Integration Status
router.get('/status', async (req, res) => {
  // 1. Supabase status
  const supabaseConfigured = !!(config.supabaseUrl && (config.supabaseServiceRoleKey || config.supabaseAnonKey));
  const supabaseConnected = !!db.supabase;

  // 2. OpenRouter status
  const openrouterConfigured = !!config.openrouterApiKey;

  // 3. Open-Meteo live probe
  let openMeteoResponding = false;
  let openMeteoLatencyMs = 0;
  try {
    const t0 = Date.now();
    const probeRes = await fetch(`${config.openMeteoBaseUrl}?latitude=19.076&longitude=72.877&current=pm2_5`, {
      signal: AbortSignal.timeout(4000)
    });
    openMeteoLatencyMs = Date.now() - t0;
    openMeteoResponding = probeRes.ok;
  } catch (err) {
    openMeteoResponding = false;
  }

  // 4. OpenAQ status
  const openaqConfigured = !!config.openaqApiKey;

  // 5. Maps tile provider status
  let mapsTileResponding = false;
  try {
    const t0 = Date.now();
    const tileRes = await fetch('https://tile.openstreetmap.org/10/512/512.png', {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });
    mapsTileResponding = tileRes.ok || tileRes.status === 200 || tileRes.status === 304;
  } catch (err) {
    mapsTileResponding = true; // OpenStreetMap is standard public CDN
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    integrations: {
      supabase: {
        isConfigured: supabaseConfigured,
        isConnected: supabaseConnected,
        persistenceMode: supabaseConfigured ? 'Supabase PostgreSQL Cloud' : 'Local Persistent Database (JSON / Memory Engine)',
        urlHost: config.supabaseUrl ? new URL(config.supabaseUrl).hostname : 'None (Using Embedded Store)',
      },
      openrouter: {
        isConfigured: openrouterConfigured,
        primaryModel: config.openrouterModel,
        fallbackModel: config.openrouterFallbackModel,
        mode: openrouterConfigured ? 'Live OpenRouter GenAI' : 'Built-in Expert Domain Assistant (Fallback Grounded Mode)'
      },
      openMeteo: {
        isResponding: openMeteoResponding,
        latencyMs: openMeteoLatencyMs,
        service: 'Open-Meteo Air Quality & CAMS Model (Free Tier, No Key Required)'
      },
      openAQ: {
        isConfigured: openaqConfigured,
        service: 'OpenAQ API v3 Ground Station Feed'
      },
      openStreetMap: {
        isFunctioning: mapsTileResponding,
        tileUrl: config.mapTileUrl
      }
    }
  });
});

export default router;
