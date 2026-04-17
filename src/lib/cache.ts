/**
 * Redis-backed cache system for the backend with in-memory fallback.
 */

import { fallbackDreams, fallbackInterpreters } from './fallbackData';
import { safeRedisGet, safeRedisSet, hasRedisConfig } from './redis';
import { logger } from './logger';

interface CacheEntry {
    data: any;
    expiresAt: number;
}

interface CacheStore {
    [key: string]: CacheEntry;
}

declare global {
    var backendMemoryCache: CacheStore | undefined;
}

const memoryCache: CacheStore = global.backendMemoryCache || {};

if (process.env.NODE_ENV !== 'production') {
    global.backendMemoryCache = memoryCache;
}

export async function setCache(key: string, data: any, ttlSeconds: number = 3600): Promise<void> {
    // 1. Always set memory cache
    const expiresAt = Date.now() + ttlSeconds * 1000;
    memoryCache[key] = { data, expiresAt };

    // 2. Set Redis cache if configured
    if (hasRedisConfig) {
        safeRedisSet(key, data, ttlSeconds);
    }
}

export async function getCache(key: string): Promise<any | null> {
    // 1. Try Redis First
    if (hasRedisConfig) {
        const redisData = await safeRedisGet<any>(key);
        if (redisData) return redisData;
    }

    // 2. Fallback to Memory
    const entry = memoryCache[key];
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        delete memoryCache[key];
        return null;
    }
    return entry.data;
}

export async function clearCache(key?: string): Promise<void> {
    // Note: To clear redis, it would need a safeRedisDel, skipping for now
    if (key) {
        delete memoryCache[key];
    } else {
        Object.keys(memoryCache).forEach((k) => delete memoryCache[k]);
    }
}

/**
 * Returns cache if available. If not, returns the hardcoded fallback data.
 * This guarantees the frontend NEVER receives a complete blank state.
 */
export async function getCachedOrFallback(key: string, type: 'dreams' | 'interpreters'): Promise<any> {
    const cached = await getCache(key);
    if (cached) return { ...cached, isFromCache: true };

    logger.warn(`Empty cache for ${key}. Serving STATIC FALLBACK DATA to prevent blank UI.`, { event: 'CACHE_FALLBACK' });
    
    if (type === 'dreams') {
        return {
            dreams: fallbackDreams,
            count: fallbackDreams.length,
            currentPage: 1,
            totalPages: 1,
            hasMore: false,
            isFromFallback: true
        };
    } else if (type === 'interpreters') {
        return {
            interpreters: fallbackInterpreters,
            count: fallbackInterpreters.length,
            total: fallbackInterpreters.length,
            isFromFallback: true
        };
    }

    return null;
}
