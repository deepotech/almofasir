import { Redis } from '@upstash/redis';
import { logger } from './logger';

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export const hasRedisConfig = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

/**
 * Wrapper array to fetch from Redis with extreme safety.
 * Errors trigger fallbacks.
 */
export async function safeRedisGet<T>(key: string): Promise<T | null> {
    if (!hasRedisConfig) return null;
    
    try {
        const data = await redis.get<T>(key);
        return data;
    } catch (error) {
        logger.error('Failed to get from Redis', { event: 'REDIS_GET_ERROR', key }, error);
        return null; // Silent failure -> triggers fallback
    }
}

/**
 * Wrapper to set inside Redis asynchronously without awaiting it blocking the user request.
 * Allows passing TTL in seconds.
 */
export function safeRedisSet(key: string, value: any, ttlSeconds: number = 3600): void {
    if (!hasRedisConfig) return;

    // Fire and forget, don't await blocking UI
    redis.set(key, value, { ex: ttlSeconds }).catch(error => {
        logger.error('Failed to set in Redis', { event: 'REDIS_SET_ERROR', key }, error);
    });
}
