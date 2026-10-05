import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export async function createAuditEntry(
  providerId: string,
  action: string,
  resource: string,
  resourceId: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        providerId,
        action,
        resource,
        resourceId,
        details: (details || {}) as any,
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
      },
    });
  } catch (error) {
    logger.error(error, 'Failed to create audit log entry');
  }
}

export async function getAuditLogs(
  options: {
    providerId?: string;
    resource?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<unknown[]> {
  const where: Record<string, unknown> = {};
  if (options.providerId) where.providerId = options.providerId;
  if (options.resource) where.resource = options.resource;
  if (options.resourceId) where.resourceId = options.resourceId;
  if (options.startDate || options.endDate) {
    where.timestamp = {};
    if (options.startDate) (where.timestamp as Record<string, unknown>).gte = options.startDate;
    if (options.endDate) (where.timestamp as Record<string, unknown>).lte = options.endDate;
  }

  return prisma.auditLog.findMany({
    where: where as any,
    include: { provider: { select: { name: true, email: true } } },
    orderBy: { timestamp: 'desc' },
    take: options.limit || 50,
    skip: options.offset || 0,
  });
}
