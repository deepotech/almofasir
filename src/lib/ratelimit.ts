import { Ratelimit } from '@upstash/ratelimit';
import { redis, hasRedisConfig } from './redis';
import { logger } from './logger';

// Create a new ratelimiter that allows 10 requests per 1 minute
const rateLimiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: '@upstash/ratelimit:almofasser',
});

/**
 * Rate limits an arbitrary identifier (usually IP string).
 * If Redis isn't configured, always allows request (acting as fallback).
 */
export async function verifyRateLimit(identifier: string): Promise<{ success: boolean }> {
    if (!hasRedisConfig) return { success: true };

    try {
        const { success } = await rateLimiter.limit(identifier);
        
        if (!success) {
            logger.warn('Rate limit exceeded', { event: 'RATE_LIMIT_EXCEEDED', identifier });
        }
        
        return { success };
    } catch (error) {
        // Fail-open: if Redis throws, don't break the application, let traffic flow
        logger.error('Rate limiter failed, bypassing limit', { event: 'RATELIMIT_ERROR', identifier }, error);
        return { success: true };
    }
}
