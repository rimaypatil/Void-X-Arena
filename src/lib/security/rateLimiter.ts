/**
 * Distributed Rate Limiter with Pluggable Storage
 * Supports Redis / Upstash REST in multi-instance production environments,
 * with a sliding-window in-memory fallback for local development and standalone testing.
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
}

export interface RateLimiterStore {
  increment(key: string, windowSeconds: number): Promise<{ count: number; resetTime: number }>;
}

/**
 * In-Memory Sliding-Window Store (Local Dev & Test Fallback)
 */
class MemoryRateLimiterStore implements RateLimiterStore {
  private hits: Map<string, { timestamps: number[]; resetTime: number }> = new Map();
  private lastCleanup = Date.now();

  async increment(key: string, windowSeconds: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    // Routine cleanup every 60 seconds
    if (now - this.lastCleanup > 60000) {
      this.cleanup(now);
    }

    let record = this.hits.get(key);
    if (!record || now >= record.resetTime) {
      record = {
        timestamps: [now],
        resetTime: now + windowMs,
      };
      this.hits.set(key, record);
      return { count: 1, resetTime: Math.ceil(record.resetTime / 1000) };
    }

    // Filter timestamps within current window
    const cutoff = now - windowMs;
    record.timestamps = record.timestamps.filter((ts) => ts > cutoff);
    record.timestamps.push(now);

    return {
      count: record.timestamps.length,
      resetTime: Math.ceil(record.resetTime / 1000),
    };
  }

  private cleanup(now: number) {
    this.lastCleanup = now;
    this.hits.forEach((record, key) => {
      if (now >= record.resetTime) {
        this.hits.delete(key);
      }
    });
  }

  reset() {
    this.hits.clear();
  }
}

/**
 * Redis / Upstash REST Store
 */
class RedisRateLimiterStore implements RateLimiterStore {
  private restUrl: string;
  private restToken: string;

  constructor(url: string, token: string) {
    this.restUrl = url.replace(/\/$/, '');
    this.restToken = token;
  }

  async increment(key: string, windowSeconds: number): Promise<{ count: number; resetTime: number }> {
    const now = Math.floor(Date.now() / 1000);
    const resetTime = now + windowSeconds;
    const redisKey = `ratelimit:${key}`;

    try {
      // INCR + EXPIRE pipeline using Upstash REST format
      const response = await fetch(`${this.restUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.restToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', redisKey],
          ['EXPIRE', redisKey, windowSeconds, 'NX'],
        ]),
      });

      if (!response.ok) {
        throw new Error(`Redis pipeline error [${response.status}]`);
      }

      const results = await response.json();
      const count = Number(results[0]?.result || 1);
      return { count, resetTime };
    } catch {
      // Fallback: allow request on cache communication failure to avoid hard outage
      return { count: 1, resetTime };
    }
  }
}

export class DistributedRateLimiter {
  private static store: RateLimiterStore = this.initializeStore();

  private static initializeStore(): RateLimiterStore {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (upstashUrl && upstashToken) {
      return new RedisRateLimiterStore(upstashUrl, upstashToken);
    }

    return new MemoryRateLimiterStore();
  }

  /**
   * Evaluates a rate limit key against an allowed threshold within a time window.
   */
  static async checkLimit(
    key: string,
    limit: number,
    windowSeconds: number = 60
  ): Promise<RateLimitResult> {
    const { count, resetTime } = await this.store.increment(key, windowSeconds);
    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);

    return {
      allowed,
      limit,
      remaining,
      resetTime,
    };
  }

  static async checkRateLimit(params: {
    key: string;
    limit: number;
    windowSeconds?: number;
  }): Promise<RateLimitResult> {
    return this.checkLimit(params.key, params.limit, params.windowSeconds || 60);
  }

  /**
   * Clears the store (used in test harnesses)
   */
  static resetStore() {
    if (this.store instanceof MemoryRateLimiterStore) {
      this.store.reset();
    }
  }
}

export const RateLimiter = DistributedRateLimiter;
