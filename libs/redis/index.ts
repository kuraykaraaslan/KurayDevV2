// libs/queue.ts
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';


const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || '6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

const redisInstance = new Redis({
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null, // ✅ This is required by BullMQ

});

export default redisInstance;