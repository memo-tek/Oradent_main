import { redis } from '../config/redis';
import { logger } from './logger';

/**
 * Cache-aside pattern helper.
 * Attempts to get from Redis first, falls back to fetcher, then caches result.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) {
      return JSON.parse(hit) as T;
    }
  } catch (err) {
    logger.warn({ err, key }, 'Cache read failed, falling back to source');
  }

  const data = await fetcher();

  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, 'Cache write failed');
  }

  return data;
}

/** Invalidate a specific cache key */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // Non-critical
  }
}

/** Invalidate all cache keys matching a pattern */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Non-critical
  }
}
