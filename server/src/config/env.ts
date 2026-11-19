import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env if present
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'saans-super-secret-jwt-key-2026-mumbai',
  
  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  
  // AI (OpenRouter)
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  openrouterModel: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
  openrouterFallbackModel: process.env.OPENROUTER_FALLBACK_MODEL || 'google/gemma-4-31b-it:free',
  
  // Air Quality
  openaqApiKey: process.env.OPENAQ_API_KEY || '',
  openMeteoBaseUrl: 'https://air-quality-api.open-meteo.com/v1/air-quality',
  openaqBaseUrl: 'https://api.openaq.org/v3',
  
  // Maps
  mapTileUrl: process.env.MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
};
