import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
});

// Device API rate limiter (more generous for continuous polling)
export const deviceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req.headers['x-device-code'] as string) || req.ip || 'unknown';
  },
  message: {
    success: false,
    error: 'Device rate limit exceeded',
  },
});

// Attendance marking limiter (prevent spam scanning)
export const attendanceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many attendance attempts, please wait',
  },
});
