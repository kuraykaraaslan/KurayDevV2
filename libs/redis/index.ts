import { Redis } from 'ioredis'

const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
const REDIS_PORT = process.env.REDIS_PORT || '6379'
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || ''

export const redisConnection = {
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required by BullMQ
  connectTimeout: 10000, // 10 second connection timeout
  commandTimeout: 30000, // 30 second command timeout (increased for dev HMR)
  enableOfflineQueue: true, // Queue commands when disconnected
  lazyConnect: true, // Don't connect until first command
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 5000)
    return delay
  },
}

const redisClientSingleton = () => {
  const instance = new Redis(redisConnection)

  instance.on('error', (err) => {
    console.error(`[Redis] Connection error: ${err.message}`)
  })

  instance.on('reconnecting', () => {
    console.warn('[Redis] Reconnecting...')
  })

  return instance
}

declare global {
  // eslint-disable-next-line no-var
  var redisGlobal: undefined | ReturnType<typeof redisClientSingleton>
}

const redisInstance = globalThis.redisGlobal ?? redisClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.redisGlobal = redisInstance
}

export default redisInstance
