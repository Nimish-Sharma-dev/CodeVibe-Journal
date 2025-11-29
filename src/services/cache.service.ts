import { logger } from '../utils/logger';

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

/**
 * In-memory cache service with TTL support
 */
class CacheService {
    private cache: Map<string, CacheEntry<any>>;
    private cleanupInterval: NodeJS.Timeout | null;

    constructor() {
        this.cache = new Map();
        this.cleanupInterval = null;
        this.startCleanup();
    }

    /**
     * Get value from cache
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        logger.debug(`Cache hit: ${key}`);
        return entry.value as T;
    }

    /**
     * Set value in cache with TTL
     * @param key Cache key
     * @param value Value to cache
     * @param ttl Time to live in seconds
     */
    set<T>(key: string, value: T, ttl: number = 3600): void {
        const expiresAt = Date.now() + ttl * 1000;
        this.cache.set(key, { value, expiresAt });
        logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    }

    /**
     * Delete value from cache
     */
    delete(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            logger.debug(`Cache deleted: ${key}`);
        }
        return deleted;
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        logger.info('Cache cleared');
    }

    /**
     * Get cache size
     */
    size(): number {
        return this.cache.size;
    }

    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Cleanup expired entries
     */
    cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
        }
    }

    /**
     * Start automatic cleanup interval
     */
    private startCleanup(): void {
        // Run cleanup every hour
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60 * 60 * 1000);
    }

    /**
     * Stop automatic cleanup
     */
    stopCleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        expired: number;
    } {
        const now = Date.now();
        let expired = 0;

        for (const entry of this.cache.values()) {
            if (now > entry.expiresAt) {
                expired++;
            }
        }

        return {
            size: this.cache.size,
            expired,
        };
    }
}

// Export singleton instance
export const cacheService = new CacheService();
