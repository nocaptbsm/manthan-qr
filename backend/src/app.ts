import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { logger } from './config/logger';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { deviceService } from './services/device.service';

// Route imports
import authRoutes from './routes/auth.routes';
import deviceRoutes from './routes/device.routes';
import sessionRoutes from './routes/session.routes';
import attendanceRoutes from './routes/attendance.routes';
import studentRoutes from './routes/student.routes';
import reportRoutes from './routes/report.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// ============================================================================
// Security Middleware
// ============================================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Let Next.js handle CSP
}));

app.use(cors({
  origin: env.CORS_ORIGIN.split(',').map(o => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Code', 'X-Device-Secret'],
}));

// ============================================================================
// Body Parsing
// ============================================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// Rate Limiting
// ============================================================================
app.use('/api/', generalLimiter);

// ============================================================================
// Health Check
// ============================================================================
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

// ============================================================================
// API Routes
// ============================================================================
app.use('/api/auth', authRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================================
// Swagger Documentation
// ============================================================================
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ManthanQR API',
      version: '1.0.0',
      description: 'Smart Attendance Management System API',
    },
    servers: [
      { url: `http://localhost:${env.PORT}`, description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        deviceAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Device-Code',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ManthanQR API Docs',
}));

// ============================================================================
// 404 Handler
// ============================================================================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// ============================================================================
// Global Error Handler
// ============================================================================
app.use(errorHandler);

// ============================================================================
// Start Server
// ============================================================================
const server = app.listen(env.PORT, () => {
  logger.info(`🚀 ManthanQR API running on port ${env.PORT}`);
  logger.info(`📚 Swagger docs: http://localhost:${env.PORT}/api-docs`);
  logger.info(`🔧 Environment: ${env.NODE_ENV}`);
});

// ============================================================================
// Token Cleanup Job
// ============================================================================
const tokenCleanupInterval = setInterval(async () => {
  try {
    await deviceService.cleanupExpiredTokens();
  } catch (err) {
    logger.error('Token cleanup error', err);
  }
}, env.TOKEN_CLEANUP_INTERVAL_MS);

// ============================================================================
// Graceful Shutdown
// ============================================================================
const shutdown = () => {
  logger.info('Shutting down gracefully...');
  clearInterval(tokenCleanupInterval);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
