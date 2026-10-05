import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { createServer } from 'http';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { ensureUploadDir, uploadDir } from './config/storage';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { auditMiddleware } from './middleware/auditMiddleware';
import { initializeWebSocket } from './websocket/liveUpdates';
import { startAppointmentReminders } from './jobs/appointmentReminder';
import { startClaimFollowUp } from './jobs/claimFollowUp';
import { startDailyDigest } from './jobs/dailyDigest';

import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import dentalChartRoutes from './routes/dentalChart';
import appointmentRoutes from './routes/appointments';
import treatmentRoutes from './routes/treatments';
import billingRoutes from './routes/billing';
import imagingRoutes from './routes/imaging';
import aiRoutes from './routes/ai';
import reportRoutes from './routes/reports';
import settingsRoutes from './routes/settings';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? env.CORS_ORIGINS.split(',').map((s) => s.trim())
    : ['http://localhost:3000', 'http://localhost:4000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);
app.use(auditMiddleware);

// Static files for uploads
ensureUploadDir();
app.use('/uploads', express.static(uploadDir));

// API Documentation
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Oradent API',
      version: '1.0.0',
      description: 'Dental Practice Management System API',
      contact: { name: 'Oradent Support', email: 'support@oradent.com' },
    },
    servers: [{ url: `/api`, description: 'API Server' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
          },
        },
        Patient: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            dateOfBirth: { type: 'string', format: 'date' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'] },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            patientId: { type: 'string', format: 'uuid' },
            providerId: { type: 'string', format: 'uuid' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            type: { type: 'string', enum: ['EXAM', 'CLEANING', 'FILLING', 'CROWN', 'ROOT_CANAL', 'EXTRACTION', 'IMPLANT', 'COSMETIC', 'EMERGENCY', 'CONSULTATION', 'FOLLOW_UP', 'OTHER'] },
            status: { type: 'string', enum: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_CHAIR', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
          },
        },
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            invoiceNumber: { type: 'string' },
            patientId: { type: 'string', format: 'uuid' },
            total: { type: 'number' },
            status: { type: 'string', enum: ['DRAFT', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID', 'WRITE_OFF'] },
          },
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication & authorization' },
      { name: 'Patients', description: 'Patient management' },
      { name: 'Appointments', description: 'Scheduling & appointments' },
      { name: 'Treatments', description: 'Treatment plans & clinical notes' },
      { name: 'Billing', description: 'Invoicing, payments & insurance claims' },
      { name: 'Imaging', description: 'Dental imaging & X-rays' },
      { name: 'AI', description: 'AI-powered analysis & suggestions' },
      { name: 'Reports', description: 'Analytics & reporting' },
      { name: 'Settings', description: 'Practice configuration' },
    ],
  },
  apis: [],
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Oradent API Docs',
}));

// Health check — liveness probe
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Readiness check — verifies database and Redis connectivity
app.get('/api/health/ready', async (_req, res) => {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
    healthy = false;
  }

  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
    healthy = false;
  }

  const status = healthy ? 'ready' : 'not_ready';
  res.status(healthy ? 200 : 503).json({ status, checks, timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/dental-chart', dentalChartRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/imaging', imagingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Error handler
app.use(errorHandler);

// WebSocket
initializeWebSocket(httpServer);

// Start server
httpServer.listen(env.PORT, () => {
  logger.info(`Oradent server running on port ${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);

  // Start background jobs
  startAppointmentReminders();
  startClaimFollowUp();
  startDailyDigest();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close();
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

export default app;
