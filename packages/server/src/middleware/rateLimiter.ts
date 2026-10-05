import rateLimit from 'express-rate-limit';
import { Request } from 'express';

function keyGenerator(req: Request): string {
  // Use authenticated user ID if available, otherwise fall back to IP
  if (req.auth?.providerId) {
    return `user:${req.auth.providerId}`;
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request rate limit exceeded. Please wait before trying again.' },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload rate limit exceeded' },
});
