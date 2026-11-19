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

const app = express();

// Security and Parsers
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin === config.frontendUrl ||
      origin === 'http://localhost:5173' ||
      origin === 'http://127.0.0.1:5173' ||
      origin.endsWith('.pages.dev')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
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
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

app.listen(config.port, () => {
  console.log(`=========================================`);
  console.log(`🌬️  SAANS Backend Server Active`);
  console.log(`📍 Port: http://localhost:${config.port}`);
  console.log(`🌱 Environment: ${config.nodeEnv}`);
  console.log(`=========================================`);
});
