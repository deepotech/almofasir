/**
 * Simple in-memory cache system for the backend.
 * Uses global object to persist across hot reloads in development.
 */

import { fallbackDreams, fallbackInterpreters } from './fallbackData';

interface CacheEntry {
    data: any;
    expiresAt: number;
}

interface CacheStore {
    [key: string]: CacheEntry;
}

declare global {
    var backendCache: CacheStore | undefined;
}

const cache: CacheStore = global.backendCache || {};

if (process.env.NODE_ENV !== 'production') {
    global.backendCache = cache;
}

export function setCache(key: string, data: any, ttlSeconds: number = 3600): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    cache[key] = { data, expiresAt };
}

export function getCache(key: string): any | null {
    const entry = cache[key];
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        delete cache[key];
        return null;
    }
    return entry.data;
}

export function clearCache(key?: string): void {
    if (key) {
        delete cache[key];
    } else {
        Object.keys(cache).forEach((k) => delete cache[k]);
    }
}

/**
 * Returns cache if available. If not, returns the hardcoded fallback data.
 * This guarantees the frontend NEVER receives a complete blank state.
 */
export function getCachedOrFallback(key: string, type: 'dreams' | 'interpreters'): any {
    const cached = getCache(key);
    if (cached) return { ...cached, isFromCache: true };

    console.warn(`[CACHE] Empty cache for ${key}. Serving STATIC FALLBACK DATA to prevent blank UI.`);
    
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
