import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Application-level errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        res.status(409).json({
          error: 'A record with this value already exists',
          field: (err.meta?.target as string[])?.join(', '),
        });
        return;
      case 'P2025':
        res.status(404).json({ error: 'Record not found' });
        return;
      case 'P2003':
        res.status(400).json({ error: 'Invalid reference — related record not found' });
        return;
      default:
        logger.error({ code: err.code, meta: err.meta }, 'Prisma error');
        res.status(500).json({ error: 'Database error' });
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ error: 'Invalid data format' });
    return;
  }

  // Syntax errors (malformed JSON body)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON in request body' });
    return;
  }

  logger.error(err, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
}
