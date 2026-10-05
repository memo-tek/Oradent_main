import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ProviderRole } from '@prisma/client';
import { redis } from '../config/redis';

export interface AuthPayload {
  providerId: string;
  practiceId: string;
  role: ProviderRole;
  email: string;
  type?: 'access' | 'refresh';
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

    // Reject refresh tokens used as access tokens
    if (payload.type === 'refresh') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    // Check if token has been blacklisted (logout)
    const isBlacklisted = await redis.get(`bl:${token.slice(-16)}`);
    if (isBlacklisted) {
      res.status(401).json({ error: 'Token has been revoked' });
      return;
    }

    req.auth = payload;
    next();
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function authorize(...roles: ProviderRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (roles.length > 0 && !roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function generateToken(payload: Omit<AuthPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRY as string & { __brand?: never },
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: Omit<AuthPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as string & { __brand?: never },
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): AuthPayload {
  const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  if (payload.type !== 'refresh') {
    throw new Error('Not a refresh token');
  }
  return payload;
}

/** Blacklist a token on logout. TTL matches remaining token lifetime. */
export async function blacklistToken(token: string): Promise<void> {
  try {
    const payload = jwt.decode(token) as (AuthPayload & { exp?: number }) | null;
    if (payload?.exp) {
      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await redis.set(`bl:${token.slice(-16)}`, '1', 'EX', ttl);
      }
    }
  } catch {
    // Token already invalid
  }
}
