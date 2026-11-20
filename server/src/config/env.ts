import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';
const rawJwtSecret = process.env.JWT_SECRET;

// In production, reject missing or default fallback secrets
if (isProd && (!rawJwtSecret || rawJwtSecret === 'saans-super-secret-jwt-key-2026-mumbai' || rawJwtSecret.length < 32)) {
  throw new Error('FATAL SECURITY CONFIGURATION: In production (NODE_ENV=production), JWT_SECRET must be explicitly set to a unique, cryptographically secure secret (minimum 32 characters) in environment variables.');
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: rawJwtSecret || 'saans-super-secret-jwt-key-2026-mumbai',
  
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
