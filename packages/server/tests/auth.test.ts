import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Mock env before importing auth module
vi.mock('../src/config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
    JWT_EXPIRY: '1h',
    JWT_REFRESH_EXPIRY: '7d',
  },
}));

// Mock redis
vi.mock('../src/config/redis', () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  },
}));

import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  authorize,
  type AuthPayload,
} from '../src/middleware/auth';

const TEST_SECRET = 'test-secret-that-is-at-least-32-characters-long';

const mockPayload: Omit<AuthPayload, 'type'> = {
  providerId: 'provider-123',
  practiceId: 'practice-456',
  role: 'DENTIST',
  email: 'dr.smith@example.com',
};

describe('generateToken', () => {
  it('creates a valid JWT access token', () => {
    const token = generateToken(mockPayload);
    expect(token).toBeTruthy();

    const decoded = jwt.verify(token, TEST_SECRET) as AuthPayload;
    expect(decoded.providerId).toBe(mockPayload.providerId);
    expect(decoded.practiceId).toBe(mockPayload.practiceId);
    expect(decoded.role).toBe(mockPayload.role);
    expect(decoded.email).toBe(mockPayload.email);
    expect(decoded.type).toBe('access');
  });
});

describe('generateRefreshToken', () => {
  it('creates a valid JWT refresh token', () => {
    const token = generateRefreshToken(mockPayload);
    const decoded = jwt.verify(token, TEST_SECRET) as AuthPayload;
    expect(decoded.type).toBe('refresh');
    expect(decoded.providerId).toBe(mockPayload.providerId);
  });
});

describe('verifyRefreshToken', () => {
  it('accepts valid refresh tokens', () => {
    const token = generateRefreshToken(mockPayload);
    const result = verifyRefreshToken(token);
    expect(result.providerId).toBe(mockPayload.providerId);
    expect(result.type).toBe('refresh');
  });

  it('rejects access tokens used as refresh tokens', () => {
    const token = generateToken(mockPayload);
    expect(() => verifyRefreshToken(token)).toThrow('Not a refresh token');
  });

  it('rejects invalid tokens', () => {
    expect(() => verifyRefreshToken('invalid-token')).toThrow();
  });
});

describe('authorize', () => {
  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as any;

  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows authorized roles', () => {
    const middleware = authorize('DENTIST', 'OWNER');
    const mockReq = { auth: { ...mockPayload, role: 'DENTIST' } } as any;

    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('rejects unauthorized roles', () => {
    const middleware = authorize('OWNER');
    const mockReq = { auth: { ...mockPayload, role: 'FRONT_DESK' } } as any;

    middleware(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated requests', () => {
    const middleware = authorize('DENTIST');
    const mockReq = { auth: undefined } as any;

    middleware(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('allows any role when no roles specified', () => {
    const middleware = authorize();
    const mockReq = { auth: { ...mockPayload, role: 'ASSISTANT' } } as any;

    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});
