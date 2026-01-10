import { Redis as IORedis } from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

/* =======================
   REDIS CLIENT INTERFACE
   ======================= */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: any[]): Promise<any>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;

  ping(): Promise<string>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;

  scan(
    cursor: string,
    pattern: string,
    count?: number
  ): Promise<[string, string[]]>;

  mget(...keys: string[]): Promise<(string | null)[]>;
  setex(key: string, seconds: number, value: string): Promise<any>;
  exists(key: string): Promise<number>;
  hset(key: string, field: string | Record<string, any>, value?: any): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
}

let client!: RedisClient;
let initialized = false;

/* =======================
   FACTORY
   ======================= */
export function getRedis(): RedisClient {
  if (initialized) return client;
  initialized = true;

  const isProduction = process.env.NODE_ENV === "production";
  const useUpstash = isProduction || process.env.USE_UPSTASH === "true";

  /* =======================
     UPSTASH (SERVERLESS)
     ======================= */
  if (useUpstash) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error("❌ Upstash Redis env vars missing");
    }

    const upstash = new UpstashRedis({ url, token });

    client = {
      async get(key) {
        const res = await upstash.get<string>(key);
        return typeof res === "string" ? res : null;
      },

      set(key, value, ...args) {
        if (
          args.length === 2 &&
          typeof args[0] === "string" &&
          typeof args[1] === "number"
        ) {
          return upstash.set(key, value, {
            [args[0].toLowerCase()]: args[1],
          });
        }
        return upstash.set(key, value, args[0]);
      },

      del: (...keys) => upstash.del(...keys),
      keys: (pattern) => upstash.keys(pattern),

      ping: () => upstash.ping(),
      incr: (key) => upstash.incr(key),
      expire: (key, seconds) => upstash.expire(key, seconds),
      ttl: (key) => upstash.ttl(key),

      scan: (cursor, pattern, count = 10) => upstash.scan(cursor, { match: pattern, count }),
      mget: (...keys) => upstash.mget(...keys),
      setex: (key, seconds, value) => upstash.set(key, value, { ex: seconds }),
      exists: (key) => upstash.exists(key),

      hset: (key, field, value) => {
        if (typeof field === 'object') {
          return upstash.hset(key, field);
        }
        return upstash.hset(key, { [field]: value });
      },
      hget: (key, field) => upstash.hget(key, field),
      
      hgetall: async (key) => {
        const res = await upstash.hgetall(key);
        // Ensure all values are strings
        if (!res) return {};
        const result: Record<string, string> = {};
        for (const [k, v] of Object.entries(res)) {
          result[k] = typeof v === "string" ? v : v === undefined || v === null ? "" : String(v);
        }
        return result;
      },
    };

    console.log("✅ Redis: Upstash");
    return client;
  }

  /* =======================
     LOCAL IOREDIS
     ======================= */
  const redis = new IORedis({
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  });

  client = {
    get: (key) => redis.get(key),
    set: (key, value, ...args) => redis.set(key, value, ...args),
    del: (...keys) => redis.del(...keys),
    keys: (pattern) => redis.keys(pattern),

    ping: () => redis.ping(),
    incr: (key) => redis.incr(key),
    expire: (key, seconds) => redis.expire(key, seconds),
    ttl: (key) => redis.ttl(key),

    scan: (cursor, pattern, count = 10) =>
      redis.scan(cursor, "MATCH", pattern, "COUNT", count),

    mget: (...keys) => redis.mget(...keys),
    setex: (key, seconds, value) => redis.setex(key, seconds, value),
    exists: (key) => redis.exists(key),

    hset: (key, field, value) => {
      if (typeof field === 'object') {
        return redis.hset(key, field);
      }
      return redis.hset(key, field, value);
    },
    hget: (key, field) => redis.hget(key, field),
    hgetall: (key) => redis.hgetall(key),
  };

  console.log("✅ Redis: local");
  return client;
}

/* =======================
   SINGLETON EXPORT
   ======================= */
const redisInstance = getRedis();
export default redisInstance;

/* =======================
   BULLMQ CONNECTION
   ======================= */
let bullMQConnection: IORedis | null = null;

export function getBullMQConnection(): IORedis {
  if (bullMQConnection) return bullMQConnection;

  const isProduction = process.env.NODE_ENV === "production";
  const useUpstash = isProduction || process.env.USE_UPSTASH === "true";

  if (useUpstash) {
    // Upstash için TCP connection gerekiyor (REST API BullMQ ile çalışmaz)
    // Eğer Upstash TCP endpoint varsa burada kullanın
    const upstashRedisUrl = process.env.UPSTASH_REDIS_URL; // redis://...

    if (upstashRedisUrl) {
      bullMQConnection = new IORedis(upstashRedisUrl, {
        maxRetriesPerRequest: null,
      });
      console.log("✅ BullMQ Connection: Upstash TCP");
    } else {
      // Fallback to local Redis if no TCP URL
      console.warn("⚠️ No UPSTASH_REDIS_URL found, falling back to local Redis for BullMQ");
      bullMQConnection = new IORedis({
        host: process.env.REDIS_HOST ?? "127.0.0.1",
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
      });
      console.log("✅ BullMQ Connection: local (fallback)");
    }
  } else {
    // Local development
    bullMQConnection = new IORedis({
      host: process.env.REDIS_HOST ?? "127.0.0.1",
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    });
    console.log("✅ BullMQ Connection: local");
  }

  return bullMQConnection;
}
