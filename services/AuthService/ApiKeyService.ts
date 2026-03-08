import crypto from 'crypto'
import { prisma } from '@/libs/prisma'
import { SafeUser, SafeUserSchema } from '@/types/user/UserTypes'
import AuthMessages from '@/messages/AuthMessages'
import { ApiKeyQuotaStatus, ApiKeyResponse } from '@/dtos/ApiKeyDTO'
import redisInstance from '@/libs/redis'
import {
  API_KEY_REDIS_TTL_SECONDS,
  API_KEY_CACHE_KEY,
  API_KEY_DAILY_USAGE_KEY,
  API_KEY_MONTHLY_USAGE_KEY,
  API_KEY_DAILY_USAGE_TTL_SECONDS,
  API_KEY_MONTHLY_USAGE_TTL_SECONDS,
} from './constants'

export default class ApiKeyService {
  /**
   * Generates a cryptographically random API key.
   * Format: `kdev_<32 hex characters>`
   */
  static generateRawKey(): string {
    return `kdev_${crypto.randomBytes(16).toString('hex')}`
  }

  /**
   * Returns the SHA-256 hash of a raw key (stored in DB).
   * @param rawKey - The plain-text API key.
   */
  static hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex')
  }

  /**
   * Creates a new API key for a user.
   * The raw key is returned **once** and never persisted in plain text.
   * @param userId - Owner's user ID.
   * @param name   - Human-readable label for the key.
   * @param expiresAt - Optional expiry date; omit for a non-expiring key.
   * @param dailyLimit - Optional max requests per calendar day.
   * @param monthlyLimit - Optional max requests per calendar month.
   */
  static async create(
    userId: string,
    name: string,
    expiresAt?: Date,
    dailyLimit?: number,
    monthlyLimit?: number
  ): Promise<{ apiKey: ApiKeyResponse; rawKey: string }> {
    const rawKey = ApiKeyService.generateRawKey()
    const keyHash = ApiKeyService.hashKey(rawKey)
    const prefix = rawKey.substring(0, 12) // "kdev_" + first 7 hex chars

    const created = await prisma.apiKey.create({
      data: {
        userId,
        name,
        prefix,
        keyHash,
        expiresAt: expiresAt ?? undefined,
        dailyLimit: dailyLimit ?? undefined,
        monthlyLimit: monthlyLimit ?? undefined,
      },
      select: {
        apiKeyId: true,
        name: true,
        prefix: true,
        dailyLimit: true,
        monthlyLimit: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    })

    return { apiKey: created as ApiKeyResponse, rawKey }
  }

  /**
   * Lists all API keys belonging to a user.
   * The key hash is never included.
   * @param userId - Owner's user ID.
   */
  static async list(userId: string): Promise<ApiKeyResponse[]> {
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        apiKeyId: true,
        name: true,
        prefix: true,
        dailyLimit: true,
        monthlyLimit: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return keys as ApiKeyResponse[]
  }

  /**
   * Revokes (deletes) an API key owned by a specific user.
   * @param apiKeyId - The key's ID.
   * @param userId   - Must match the key's owner to prevent privilege escalation.
   */
  static async revoke(apiKeyId: string, userId: string): Promise<void> {
    const apiKey = await prisma.apiKey.findFirst({
      where: { apiKeyId, userId },
    })

    if (!apiKey) {
      throw new Error(AuthMessages.API_KEY_NOT_FOUND)
    }

    await prisma.apiKey.delete({ where: { apiKeyId } })

    // Invalidate Redis cache for this key
    await redisInstance.del(API_KEY_CACHE_KEY(apiKey.keyHash))
  }

  /**
   * Authenticates a request via a plain-text API key, then increments
   * and enforces per-key daily/monthly usage quotas.
   * Updates `lastUsedAt` on success.
   * @param rawKey - The full raw API key value from the request header.
   * @returns The `SafeUser` that owns the key.
   * @throws {Error} `API_KEY_DAILY_LIMIT_EXCEEDED` or `API_KEY_MONTHLY_LIMIT_EXCEEDED` when quota is breached.
   */
  static async authenticateByApiKey(rawKey: string): Promise<SafeUser> {
    const keyHash = ApiKeyService.hashKey(rawKey)
    const redisKey = API_KEY_CACHE_KEY(keyHash)

    // 1️⃣ Try Redis cache first
    const cached = await redisInstance.get(redisKey)
    if (cached) {
      const cachedData = JSON.parse(cached) as CachedApiKeyData
      await ApiKeyService.checkAndIncrementUsage(
        cachedData.apiKeyId,
        cachedData.dailyLimit,
        cachedData.monthlyLimit,
        cachedData.keyName,
      )
      return cachedData.safeUser
    }

    // 2️⃣ Fall back to DB
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    })

    if (!apiKey) {
      throw new Error(AuthMessages.API_KEY_INVALID)
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new Error(AuthMessages.API_KEY_EXPIRED)
    }

    const safeUser = SafeUserSchema.parse(apiKey.user)

    // 3️⃣ Cache the resolved key + quota config — TTL is capped by key expiry if set
    const ttl = apiKey.expiresAt
      ? Math.min(
          API_KEY_REDIS_TTL_SECONDS,
          Math.floor((apiKey.expiresAt.getTime() - Date.now()) / 1000)
        )
      : API_KEY_REDIS_TTL_SECONDS

    if (ttl > 0) {
      const cachePayload: CachedApiKeyData = {
        safeUser,
        apiKeyId: apiKey.apiKeyId,
        keyName: apiKey.name,
        dailyLimit: apiKey.dailyLimit,
        monthlyLimit: apiKey.monthlyLimit,
      }
      await redisInstance.setex(redisKey, ttl, JSON.stringify(cachePayload))
    }

    // 4️⃣ Enforce quota (after caching — increments usage counters)
    await ApiKeyService.checkAndIncrementUsage(
      apiKey.apiKeyId,
      apiKey.dailyLimit,
      apiKey.monthlyLimit,
      apiKey.name,
    )

    // 5️⃣ Fire-and-forget last-used update (non-critical path)
    prisma.apiKey
      .update({
        where: { apiKeyId: apiKey.apiKeyId },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {
        // Intentionally swallowed — failure to update lastUsedAt must not block the request
      })

    return safeUser
  }

  /**
   * Increments the daily and monthly usage counters for an API key in Redis
   * and throws if either configured limit is exceeded.
   * Also fires an admin notification email the first time a limit is hit.
   * @param apiKeyId    - The key's database ID (used as the Redis namespace).
   * @param dailyLimit  - Configured daily cap; `null` means unlimited.
   * @param monthlyLimit - Configured monthly cap; `null` means unlimited.
   * @param keyName     - Human-readable label — used only in the admin notification.
   */
  static async checkAndIncrementUsage(
    apiKeyId: string,
    dailyLimit: number | null,
    monthlyLimit: number | null,
    keyName: string,
  ): Promise<ApiKeyQuotaStatus> {
    const now = new Date()
    const dateKey = now.toISOString().slice(0, 10)         // 'YYYY-MM-DD'
    const monthKey = now.toISOString().slice(0, 7)         // 'YYYY-MM'

    const dailyRedisKey   = API_KEY_DAILY_USAGE_KEY(apiKeyId, dateKey)
    const monthlyRedisKey = API_KEY_MONTHLY_USAGE_KEY(apiKeyId, monthKey)

    // Atomically increment both counters; set TTL on first write
    const [rawDaily, rawMonthly] = await Promise.all([
      redisInstance.incr(dailyRedisKey),
      redisInstance.incr(monthlyRedisKey),
    ])

    // Set TTL only on first increment (value transitions from 0 → 1)
    if (rawDaily === 1) {
      await redisInstance.expire(dailyRedisKey, API_KEY_DAILY_USAGE_TTL_SECONDS)
    }
    if (rawMonthly === 1) {
      await redisInstance.expire(monthlyRedisKey, API_KEY_MONTHLY_USAGE_TTL_SECONDS)
    }

    const dailyExceeded   = dailyLimit   !== null && rawDaily   > dailyLimit
    const monthlyExceeded = monthlyLimit !== null && rawMonthly > monthlyLimit

    // Fire admin notification the first time a limit is breached (counter == limit + 1)
    if (dailyLimit !== null && rawDaily === dailyLimit + 1) {
      ApiKeyService.notifyAdminQuotaExceeded(apiKeyId, keyName, 'daily', rawDaily, dailyLimit).catch(
        () => undefined // fire-and-forget — never block the request
      )
    }
    if (monthlyLimit !== null && rawMonthly === monthlyLimit + 1) {
      ApiKeyService.notifyAdminQuotaExceeded(apiKeyId, keyName, 'monthly', rawMonthly, monthlyLimit).catch(
        () => undefined
      )
    }

    if (dailyExceeded) {
      throw new Error(AuthMessages.API_KEY_DAILY_LIMIT_EXCEEDED)
    }
    if (monthlyExceeded) {
      throw new Error(AuthMessages.API_KEY_MONTHLY_LIMIT_EXCEEDED)
    }

    return {
      dailyCount: rawDaily,
      monthlyCount: rawMonthly,
      dailyLimit,
      monthlyLimit,
      dailyExceeded: false,
      monthlyExceeded: false,
    }
  }

  /**
   * Sends a one-off email to the configured admin address when an API key
   * first exceeds its daily or monthly quota.
   * This method is always called fire-and-forget — errors are swallowed by the caller.
   */
  private static async notifyAdminQuotaExceeded(
    apiKeyId: string,
    keyName: string,
    period: 'daily' | 'monthly',
    count: number,
    limit: number,
  ): Promise<void> {
    // Lazy import to avoid circular dependency with MailService
    const { default: MailService } = await import('@/services/NotificationService/MailService')
    if (!MailService.INFORM_MAIL) return

    const subject = `[API Quota] Key "${keyName}" has exceeded its ${period} limit`
    const html = `
      <p>API key <strong>${keyName}</strong> (ID: <code>${apiKeyId}</code>) has exceeded its <strong>${period}</strong> usage quota.</p>
      <ul>
        <li>Limit: ${limit.toLocaleString()} requests</li>
        <li>Current count: ${count.toLocaleString()} requests</li>
      </ul>
      <p>Subsequent requests will receive HTTP 429 until the ${period === 'daily' ? 'next calendar day' : 'next calendar month'} begins.</p>
    `
    await MailService.sendMail(MailService.INFORM_MAIL, subject, html)
  }
}

// ── Internal cache structure ─────────────────────────────────────────────────
interface CachedApiKeyData {
  safeUser: SafeUser
  apiKeyId: string
  keyName: string
  dailyLimit: number | null
  monthlyLimit: number | null
}
