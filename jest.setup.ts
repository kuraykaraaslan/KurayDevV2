// ── Required env vars for AuthService/constants.ts module-level checks ──
process.env.ENCRYPTION_SECRET_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-that-is-long-enough-256bits'
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-that-is-long-enough-256bits'
process.env.NEXT_PUBLIC_APPLICATION_HOST = 'https://localhost'
process.env.ACCESS_TOKEN_EXPIRES_IN = '1h'
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d'
process.env.SESSION_EXPIRY_MS = '604800000'
process.env.SESSION_REDIS_EXPIRY_MS = '1800000'
process.env.OTP_EXPIRY_SECONDS = '600'
process.env.OTP_LENGTH = '6'
process.env.OTP_RATE_LIMIT_SECONDS = '60'
process.env.BCRYPT_SALT_ROUNDS = '1'
process.env.TOTP_ISSUER = 'TestApp'

// i18n / SEO config — AVAILABLE_LANGUAGES & INDEXABLE_LANGUAGES are derived from
// these at module load. Jest does not load .env, so set them here (mirroring .env)
// or the i18n/hreflang/sitemap tests collapse to a single 'en' language. Respect
// any value already exported by the shell/CI.
process.env.NEXT_PUBLIC_I18N_LANGUAGES =
  process.env.NEXT_PUBLIC_I18N_LANGUAGES || 'en,tr,de,el,et,mt,nl,fr,it,es,fi'
process.env.NEXT_PUBLIC_INDEXABLE_LANGUAGES =
  process.env.NEXT_PUBLIC_INDEXABLE_LANGUAGES || 'en,tr'

// Prevent real Redis/BullMQ resources from keeping Jest alive.
jest.mock('ioredis', () => {
  class MockRedis {
    on = jest.fn()
    get = jest.fn()
    set = jest.fn()
    setex = jest.fn()
    del = jest.fn()
    scan = jest.fn().mockResolvedValue(['0', []])
    keys = jest.fn().mockResolvedValue([])
    mget = jest.fn()
    hset = jest.fn()
    hgetall = jest.fn().mockResolvedValue({})
    hdel = jest.fn()
    exists = jest.fn()
    incr = jest.fn()
    expire = jest.fn()
    rpush = jest.fn()
    sadd = jest.fn()
    smembers = jest.fn().mockResolvedValue([])
    publish = jest.fn()
    subscribe = jest.fn()
    quit = jest.fn().mockResolvedValue(undefined)
    disconnect = jest.fn()
    duplicate = jest.fn(() => new MockRedis())
  }

  return { __esModule: true, Redis: MockRedis, default: MockRedis }
})

jest.mock('bullmq', () => {
  const Queue = jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  }))

  const Worker = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  }))

  return { __esModule: true, Queue, Worker }
})

jest.mock('@/libs/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    scan: jest.fn().mockResolvedValue(['0', []]),
    keys: jest.fn().mockResolvedValue([]),
    mget: jest.fn(),
    hset: jest.fn(),
    hgetall: jest.fn().mockResolvedValue({}),
    hdel: jest.fn(),
    sadd: jest.fn(),
    smembers: jest.fn().mockResolvedValue([]),
    publish: jest.fn(),
    subscribe: jest.fn(),
    exists: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    rpush: jest.fn(),
  },
}))

// @xenova/transformers ships ESM that ts-jest can't transpile; no test needs real
// embeddings, so stub the pipeline. Fixes suites that transitively import
// LocalEmbedService / ChatbotRAGService (e.g. CronService).
jest.mock('@xenova/transformers', () => ({
  __esModule: true,
  pipeline: jest.fn(async () => async () => ({ data: new Float32Array(384) })),
  env: {},
}))

jest.mock('@/libs/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

// The federation SSRF guard (services/ActivityPubService/safeFetch) resolves
// every hostname before fetching it. Jest has no network, so resolve to a
// public address by default; suites that exercise the guard itself override
// this mock to return private/blocked addresses.
jest.mock('node:dns/promises', () => ({
  __esModule: true,
  lookup: jest.fn(async () => [{ address: '93.184.216.34', family: 4 }]),
}))
