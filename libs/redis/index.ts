import { Redis } from 'ioredis'

const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
const REDIS_PORT = process.env.REDIS_PORT || '6379'
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || ''

export const redisConnection = {
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required by BullMQ
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 5000)
    return delay
  },
}

const redisInstance = new Redis(redisConnection)

redisInstance.on('error', (err) => {
  console.error(`[Redis] Connection error: ${err.message}`)
})


redisInstance.on('reconnecting', () => {
  console.warn('[Redis] Reconnecting...')
})

export default redisInstance
