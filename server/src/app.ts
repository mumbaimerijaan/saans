import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';

// Import Route Handlers
import authRoutes from './routes/auth.js';
import airQualityRoutes from './routes/airQuality.js';
import requestsRoutes from './routes/requests.js';
import volunteersRoutes from './routes/volunteers.js';
import equipmentRoutes from './routes/equipment.js';
import facilitiesRoutes from './routes/facilities.js';
import reportsRoutes from './routes/reports.js';
import aiRoutes from './routes/ai.js';
import notificationsRoutes from './routes/notifications.js';
import impactRoutes from './routes/impact.js';
import adminRoutes from './routes/admin.js';
import systemRoutes from './routes/system.js';

export const app = express();

const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost:(5173|3000|5000)$/,
  /^http:\/\/127\.0\.0\.1:(5173|3000|5000)$/,
  /^https:\/\/[a-z0-9-]+\.pages\.dev$/,
  /^https:\/\/saans-dmm\.pages\.dev$/
];

// Security and Strict CORS Validation
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, tests) with no origin
    if (!origin) return callback(null, true);

    if (origin === config.frontendUrl) {
      return callback(null, true);
    }

    const isAllowed = ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));
    if (isAllowed) {
      return callback(null, true);
    }

    return callback(new Error(`CORS Policy: Access from origin '${origin}' is not permitted.`));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SAANS API Server', version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/air-quality', airQualityRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/system', systemRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.message && err.message.startsWith('CORS Policy:')) {
    res.status(403).json({ error: 'CORS Forbidden', message: err.message });
    return;
  }
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

export default app;
