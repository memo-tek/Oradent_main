import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const PHI_ROUTES = ['/api/patients', '/api/imaging', '/api/dental-chart', '/api/treatments', '/api/billing'];

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  const shouldAudit = PHI_ROUTES.some((route) => req.path.startsWith(route));

  if (!shouldAudit || req.method === 'OPTIONS') {
    next();
    return;
  }

  const originalEnd = res.end;
  const startTime = Date.now();

  res.end = function (this: Response, ...args: Parameters<Response['end']>) {
    const duration = Date.now() - startTime;
    const resourceMatch = req.path.match(/\/api\/(\w+)(?:\/([^/]+))?/);
    const resource = resourceMatch?.[1] || 'unknown';
    const resourceId = resourceMatch?.[2] || '';

    if (req.auth?.providerId) {
      prisma.auditLog
        .create({
          data: {
            providerId: req.auth.providerId,
            action: `${req.method} ${req.path}`,
            resource,
            resourceId,
            details: {
              statusCode: res.statusCode,
              duration,
              query: req.query,
            },
            ipAddress: req.ip || req.socket.remoteAddress || '',
            userAgent: req.headers['user-agent'] || '',
          },
        })
        .catch((err) => {
          logger.error(err, 'Failed to create audit log');
        });
    }

    return originalEnd.apply(this, args);
  } as Response['end'];

  next();
}
