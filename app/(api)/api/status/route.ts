import { NextResponse } from 'next/server'
import redisInstance from '@/libs/redis'
import MailService from '@/services/NotificationService/MailService'
import SMSService from '@/services/NotificationService/SMSService'
import OpenAIService from '@/services/OpenAIService'
import { HealthCheckResponseSchema } from '@/dtos/StatusDTO'

export const dynamic = 'force-dynamic'

export async function GET() {
  const CACHE_KEY = 'system:status:health'
  const CACHE_TTL_SECONDS = 60 * 10 // 10 dakika

  // 🔹 Cache kontrolü
  try {
    const cached = await redisInstance.get(CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      return NextResponse.json({ ...parsed, cached: true })
    }
  } catch (err) {
    console.warn('Redis cache read failed:', err)
  }

  const results: Record<string, any> = {}
  const start = performance.now()

  // --- Redis health check ---
  try {
    const ping = await redisInstance.ping()
    results.redis = { status: ping === 'PONG' ? 'OK' : 'FAIL' }
  } catch (e: any) {
    results.redis = { status: 'FAIL', error: e.message }
  }

  // --- MailService check ---
  try {
    const verified = await MailService.transporter.verify()
    results.mail = { status: verified ? 'OK' : 'FAIL' }
  } catch (e: any) {
    results.mail = { status: 'FAIL', error: e.message }
  }

  // --- SMS queue check ---
  try {
    const queued = await SMSService.QUEUE.count()
    results.sms = { status: 'OK', queued }
  } catch (e: any) {
    results.sms = { status: 'FAIL', error: e.message }
  }

  // --- OpenAI connectivity check ---
  try {
    const response = await OpenAIService.generateText('ping')
    results.openai = { status: response ? 'OK' : 'FAIL' }
  } catch (e: any) {
    results.openai = { status: 'FAIL', error: e.message }
  }

  // --- AWS S3 availability ---
  try {
    const bucket = process.env.AWS_BUCKET_NAME
    const region = process.env.AWS_REGION
    results.aws = { status: bucket && region ? 'OK' : 'FAIL', bucket, region }
  } catch (e: any) {
    results.aws = { status: 'FAIL', error: e.message }
  }

  const end = performance.now()
  const uptimeSec = process.uptime()
  const _finalResponse = {
    
    timestamp: new Date().toISOString(),
    uptimeSec,
    responseTimeMs: Math.round(end - start),
    services: results,
    cached: false,
  }

  const parsedFinalResponse = HealthCheckResponseSchema.parse(_finalResponse)

  // 🔹 Sonucu cache’e yaz
  try {
    await redisInstance.set(CACHE_KEY, JSON.stringify(parsedFinalResponse), 'EX', CACHE_TTL_SECONDS)
  } catch (err) {
    console.warn('Redis cache write failed:', err)
  }

  return NextResponse.json(parsedFinalResponse)
}
