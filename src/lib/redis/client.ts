import 'server-only';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { createClient as createRedisClient, type RedisClientType } from 'redis';
import { StationStatus } from '@/types';
import { getStatusCacheTTL } from '@/lib/ai/confidence';
import { getSiteSettings } from '@/lib/services/config';

// ─── Client instances (lazy-loaded) ─────────────────────────────────────────
let upstashRedis: Redis | null = null;
let localRedis: RedisClientType | null = null;
let reportRateLimiter: Ratelimit | null = null;

export type RedisMode = 'upstash' | 'local' | 'none';

/**
 * Detect which Redis mode is configured based on environment variables.
 */
export async function getRedisMode(): Promise<RedisMode> {
  const settings = await getSiteSettings();
  if (process.env.REDIS_URL) {
    return 'local';
  }
  if (settings.redis_url && settings.redis_token) {
    return 'upstash';
  }
  return 'none';
}

/**
 * Get the active Redis client — Upstash or local Redis.
 * Returns null if neither is configured.
 */
export async function getRedis(): Promise<Redis | RedisClientType | null> {
  const mode = await getRedisMode();

  if (mode === 'upstash') {
    if (upstashRedis) return upstashRedis;
    const settings = await getSiteSettings();
    upstashRedis = new Redis({
      url: settings.redis_url!,
      token: settings.redis_token!,
    });
    return upstashRedis;
  }

  if (mode === 'local') {
    if (localRedis) return localRedis;
    return await getLocalRedis();
  }

  console.warn('[Redis] No Redis configured — set via Admin Panel or environment variables.');
  return null;
}

/**
 * Get or create the local Redis client (async, must be awaited).
 */
export async function getLocalRedis(): Promise<RedisClientType | null> {
  if (localRedis) return localRedis;

  if (!process.env.REDIS_URL) {
    return null;
  }

  try {
    localRedis = createRedisClient({ url: process.env.REDIS_URL });
    await localRedis.connect();
    console.log('[Redis] Connected to local Redis');
    return localRedis;
  } catch (err) {
    // Never log the Redis URL — it may contain credentials
    console.error('[Redis] Failed to connect to local Redis: connection error');
    return null;
  }
}

/**
 * Get Upstash Redis client (sync, for rate limiting).
 */
async function getUpstashRedis(): Promise<Redis | null> {
  if (upstashRedis) return upstashRedis;
  const settings = await getSiteSettings();
  if (!settings.redis_url || !settings.redis_token) {
    return null;
  }
  upstashRedis = new Redis({
    url: settings.redis_url,
    token: settings.redis_token,
  });
  return upstashRedis;
}

export async function getReportRateLimiter(): Promise<Ratelimit | null> {
  if (reportRateLimiter) return reportRateLimiter;
  const redisClient = await getUpstashRedis(); // Rate limiter only works with Upstash
  if (!redisClient) {
    console.warn('[Redis] getReportRateLimiter: No Upstash Redis configured. Rate limiting is DISABLED.');
    return null;
  }
  reportRateLimiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(3, '1 m'),
    analytics: true,
    prefix: 'ratelimit:report',
  });
  return reportRateLimiter;
}

// ─── Legacy TTL constants (for geo-queries) ─────────────────────────
export const GEO_CACHE_TTL = 60;

/**
 * Get cache key for station status (with optional fuel type)
 * Key format: station:{id}:status:{fuel_type}
 */
export function getStationCacheKey(stationId: string, fuelType: string = 'default'): string {
  return `station:${stationId}:status:${fuelType}`;
}

/**
 * Get cache TTL in seconds based on station status
 */
export function getSmartCacheTTL(status: StationStatus): number {
  return getStatusCacheTTL(status);
}

/**
 * Cache station status with status-aware TTL
 * 🟢/🟡 available/low → 2 min (120s)
 * 🟠 queue           → 5 min (300s)
 * 🔴 empty           → 10 min (600s)
 */
export async function cacheStationStatus(
  stationId: string,
  status: StationStatus,
  confidence: number,
  fuelType: string = 'default'
) {
  const redisClient = await getLocalRedis();
  const upstashClient = await getRedis() as Redis | null;
  const client = (redisClient as RedisClientType | null) ?? upstashClient;

  if (!client) return;

  const ttl = getSmartCacheTTL(status);
  const key = getStationCacheKey(stationId, fuelType);
  const payload = JSON.stringify({
    status,
    confidence,
    cached_at: new Date().toISOString(),
  });

  if ('set' in client && typeof client.set === 'function') {
    // Upstash client
    await (client as Redis).set(key, payload, { ex: ttl });
  } else {
    // Local Redis client (node-redis)
    await (client as RedisClientType).set(key, payload, { EX: ttl });
  }
}

/**
 * Get cached station status — returns null on cache miss
 */
export async function getCachedStationStatus(
  stationId: string,
  fuelType: string = 'default'
): Promise<{ status: StationStatus; confidence: number; cached_at: string } | null> {
  const redisClient = await getLocalRedis();
  const upstashClient = await getRedis() as Redis | null;
  const client = (redisClient as RedisClientType | null) ?? upstashClient;

  if (!client) return null;

  const key = getStationCacheKey(stationId, fuelType);
  let cached: string | null = null;

  if ('get' in client && typeof client.get === 'function') {
    // Upstash client
    cached = await (client as Redis).get<string>(key);
  } else {
    // Local Redis client (node-redis)
    cached = await (client as RedisClientType).get(key);
  }

  if (!cached) return null;

  try {
    return JSON.parse(cached) as { status: StationStatus; confidence: number; cached_at: string };
  } catch {
    return null;
  }
}

/**
 * Invalidate station cache — called when new report comes in
 */
export async function invalidateStationCache(stationId: string, fuelType?: string) {
  const redisClient = await getLocalRedis();
  const upstashClient = await getRedis() as Redis | null;
  const client = (redisClient as RedisClientType | null) ?? upstashClient;

  if (!client) return;

  if (fuelType) {
    if ('del' in client && typeof client.del === 'function') {
      // Upstash
      await (client as Redis).del(getStationCacheKey(stationId, fuelType));
    } else {
      await (client as RedisClientType).del(getStationCacheKey(stationId, fuelType));
    }
  } else {
    if ('keys' in client && typeof client.keys === 'function') {
      // Upstash
      const keys = await (client as Redis).keys(`station:${stationId}:status:*`);
      if (keys.length > 0) {
        await (client as Redis).del(...keys);
      }
    } else {
      // Local Redis - use SCAN instead of KEYS for production
      const pattern = `station:${stationId}:status:*`;
      for await (const key of (client as RedisClientType).scanIterator({ MATCH: pattern })) {
        await (client as RedisClientType).del(key);
      }
    }
  }
}

/**
 * Cache nearby stations geo-query
 */
export async function cacheNearbyStations(key: string, stations: unknown[]) {
  const redisClient = await getLocalRedis();
  const upstashClient = await getRedis() as Redis | null;
  const client = (redisClient as RedisClientType | null) ?? upstashClient;

  if (!client) return;

  if ('set' in client && typeof client.set === 'function') {
    await (client as Redis).set(key, JSON.stringify(stations), { ex: GEO_CACHE_TTL });
  } else {
    await (client as RedisClientType).set(key, JSON.stringify(stations), { EX: GEO_CACHE_TTL });
  }
}

/**
 * Get cached nearby stations
 */
export async function getCachedNearbyStations<T>(key: string): Promise<T | null> {
  const redisClient = await getLocalRedis();
  const upstashClient = await getRedis() as Redis | null;
  const client = (redisClient as RedisClientType | null) ?? upstashClient;

  if (!client) return null;

  let cached: string | null = null;
  if ('get' in client && typeof client.get === 'function') {
    cached = await (client as Redis).get<string>(key);
  } else {
    cached = await (client as RedisClientType).get(key);
  }

  if (!cached) return null;
  return JSON.parse(cached) as T;
}

/**
 * Smart Cache Router
 * 1. Check Redis cache → if HIT return immediately (no Gemini call)
 * 2. If MISS → check Supabase
 * 3. If Supabase has data → cache → return
 * 4. If no data → call Gemini → store in DB → cache → return
 *
 * Gemini is NEVER called twice for the same data within TTL.
 */
export async function smartCacheRouter<T>(
  stationId: string,
  fetcher: () => Promise<T | null>,
  options: {
    fuelType?: string;
    status?: StationStatus;
    ttl?: number;
  } = {}
): Promise<{ data: T | null; source: 'cache' | 'db' | 'ai'; cached: boolean }> {
  const { fuelType = 'default', status, ttl } = options;

  if (status) {
    const cached = await getCachedStationStatus(stationId, fuelType).catch(() => null);
    if (cached && cached.status === status) {
      return { data: cached as T, source: 'cache', cached: true };
    }
  }

  const data = await fetcher();

  if (data && status) {
    const redisClient = await getLocalRedis();
    const upstashClient = await getRedis() as Redis | null;
    const client = (redisClient as RedisClientType | null) ?? upstashClient;

    if (!client) return { data, source: data ? 'db' : 'ai', cached: false };

    const cacheTTL = ttl ?? getSmartCacheTTL(status);
    const key = getStationCacheKey(stationId, fuelType);
    const payload = JSON.stringify({
      ...(data as object),
      status,
      cached_at: new Date().toISOString(),
    });

    if ('set' in client && typeof client.set === 'function') {
      await (client as Redis).set(key, payload, { ex: cacheTTL }).catch(() => { });
    } else {
      await (client as RedisClientType).set(key, payload, { EX: cacheTTL }).catch(() => { });
    }
  }

  return { data, source: data ? 'db' : 'ai', cached: false };
}
