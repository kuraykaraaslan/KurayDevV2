import crypto from 'crypto'
import { prisma } from '@/libs/prisma'
import { SafeUser, SafeUserSchema } from '@/types/user/UserTypes'
import AuthMessages from '@/messages/AuthMessages'
import { ApiKeyResponse } from '@/dtos/ApiKeyDTO'
import redisInstance from '@/libs/redis'
import { API_KEY_REDIS_TTL_SECONDS, API_KEY_CACHE_KEY } from './constants'

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
   */
  static async create(
    userId: string,
    name: string,
    expiresAt?: Date
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
      },
      select: {
        apiKeyId: true,
        name: true,
        prefix: true,
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
   * Authenticates a request via a plain-text API key.
   * Updates `lastUsedAt` on success.
   * @param rawKey - The full raw API key value from the request header.
   * @returns The `SafeUser` that owns the key.
   */
  static async authenticateByApiKey(rawKey: string): Promise<SafeUser> {
    const keyHash = ApiKeyService.hashKey(rawKey)
    const redisKey = API_KEY_CACHE_KEY(keyHash)

    // 1️⃣ Try Redis cache first
    const cached = await redisInstance.get(redisKey)
    if (cached) {
      return JSON.parse(cached) as SafeUser
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

    // 3️⃣ Cache the result — TTL is capped by key expiry if set
    const ttl = apiKey.expiresAt
      ? Math.min(
          API_KEY_REDIS_TTL_SECONDS,
          Math.floor((apiKey.expiresAt.getTime() - Date.now()) / 1000)
        )
      : API_KEY_REDIS_TTL_SECONDS

    if (ttl > 0) {
      await redisInstance.setex(redisKey, ttl, JSON.stringify(safeUser))
    }

    // 4️⃣ Fire-and-forget last-used update (non-critical path)
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
}
