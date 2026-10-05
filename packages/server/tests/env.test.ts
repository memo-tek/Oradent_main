import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-create the schema here to test validation logic without triggering process.exit
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  ANTHROPIC_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('1h'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@oradent.com'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('50mb'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

describe('envSchema validation', () => {
  const validEnv = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    JWT_SECRET: 'a-very-secure-secret-that-is-at-least-32-characters',
  };

  it('accepts valid minimal environment', () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(4000);
      expect(result.data.NODE_ENV).toBe('development');
      expect(result.data.REDIS_URL).toBe('redis://localhost:6379');
    }
  });

  it('rejects missing DATABASE_URL', () => {
    const result = envSchema.safeParse({ JWT_SECRET: validEnv.JWT_SECRET });
    expect(result.success).toBe(false);
  });

  it('rejects invalid DATABASE_URL', () => {
    const result = envSchema.safeParse({ ...validEnv, DATABASE_URL: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects short JWT_SECRET', () => {
    const result = envSchema.safeParse({ ...validEnv, JWT_SECRET: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid NODE_ENV', () => {
    const result = envSchema.safeParse({ ...validEnv, NODE_ENV: 'staging' });
    expect(result.success).toBe(false);
  });

  it('coerces PORT from string to number', () => {
    const result = envSchema.safeParse({ ...validEnv, PORT: '8080' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(8080);
    }
  });

  it('applies defaults for optional fields', () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.SMTP_FROM).toBe('noreply@oradent.com');
      expect(result.data.UPLOAD_DIR).toBe('./uploads');
      expect(result.data.MAX_FILE_SIZE).toBe('50mb');
      expect(result.data.JWT_EXPIRY).toBe('1h');
      expect(result.data.JWT_REFRESH_EXPIRY).toBe('7d');
    }
  });
});
