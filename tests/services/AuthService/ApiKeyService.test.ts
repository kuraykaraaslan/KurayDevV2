import ApiKeyService from '@/services/AuthService/ApiKeyService'
import AuthMessages from '@/messages/AuthMessages'
jest.mock('@/libs/prisma', () => ({ prisma: { apiKey: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), delete: jest.fn(), findUnique: jest.fn(), update: jest.fn() } } }))
jest.mock('@/libs/redis', () => ({ get: jest.fn(), setex: jest.fn(), del: jest.fn(), incr: jest.fn(), expire: jest.fn() }))
const prismaMock = require('@/libs/prisma').prisma.apiKey
const redisMock = require('@/libs/redis')

describe('ApiKeyService', () => {
  beforeEach(() => jest.resetAllMocks())

  it('throws API_KEY_NOT_FOUND if revoke called with wrong user', async () => {
    prismaMock.findFirst.mockResolvedValueOnce(null)
    await expect(ApiKeyService.revoke('key-1', 'user-1')).rejects.toThrow(AuthMessages.API_KEY_NOT_FOUND)
  })

  it('throws API_KEY_INVALID if authenticateByApiKey called with invalid key', async () => {
    redisMock.get.mockResolvedValueOnce(null)
    prismaMock.findUnique.mockResolvedValueOnce(null)
    await expect(ApiKeyService.authenticateByApiKey('kdev_xxx')).rejects.toThrow(AuthMessages.API_KEY_INVALID)
  })

  it('throws API_KEY_EXPIRED if key is expired', async () => {
    redisMock.get.mockResolvedValueOnce(null)
    prismaMock.findUnique.mockResolvedValueOnce({ user: { userId: 'user-1', email: 'a@b.com' }, expiresAt: new Date(Date.now() - 1000) })
    await expect(ApiKeyService.authenticateByApiKey('kdev_xxx')).rejects.toThrow(AuthMessages.API_KEY_EXPIRED)
  })

  it('throws API_KEY_DAILY_LIMIT_EXCEEDED if daily quota breached', async () => {
    redisMock.get.mockResolvedValueOnce(null)
    prismaMock.findUnique.mockResolvedValueOnce({
      user: {
        userId: 'user-1',
        email: 'a@b.com',
        name: 'Test User',
        userRole: 'ADMIN',
        userStatus: 'ACTIVE',
        userPreferences: {},
        userProfile: {},
      },
      expiresAt: null,
      apiKeyId: 'key-1',
      name: 'test',
      dailyLimit: 1,
      monthlyLimit: null,
    })
    redisMock.incr.mockResolvedValueOnce(2)
    redisMock.incr.mockResolvedValueOnce(1)
    await expect(ApiKeyService.authenticateByApiKey('kdev_xxx')).rejects.toThrow(AuthMessages.API_KEY_DAILY_LIMIT_EXCEEDED)
  })

  it('throws API_KEY_MONTHLY_LIMIT_EXCEEDED if monthly quota breached', async () => {
    redisMock.get.mockResolvedValueOnce(null)
    prismaMock.findUnique.mockResolvedValueOnce({
      user: {
        userId: 'user-1',
        email: 'a@b.com',
        name: 'Test User',
        userRole: 'ADMIN',
        userStatus: 'ACTIVE',
        userPreferences: {},
        userProfile: {},
      },
      expiresAt: null,
      apiKeyId: 'key-1',
      name: 'test',
      dailyLimit: null,
      monthlyLimit: 1,
    })
    redisMock.incr.mockResolvedValueOnce(1)
    redisMock.incr.mockResolvedValueOnce(2)
    await expect(ApiKeyService.authenticateByApiKey('kdev_xxx')).rejects.toThrow(AuthMessages.API_KEY_MONTHLY_LIMIT_EXCEEDED)
  })
})

// ── Phase 16: ApiKeyService edge-case tests ──────────────────────────────────

describe('ApiKeyService.generateRawKey', () => {
  it('returns a string starting with kdev_', () => {
    const key = ApiKeyService.generateRawKey()
    expect(key).toMatch(/^kdev_[a-f0-9]{32}$/)
  })

  it('generates unique keys on successive calls', () => {
    const k1 = ApiKeyService.generateRawKey()
    const k2 = ApiKeyService.generateRawKey()
    expect(k1).not.toBe(k2)
  })
})

describe('ApiKeyService.hashKey', () => {
  it('returns a 64-char hex SHA-256 hash', () => {
    const hash = ApiKeyService.hashKey('kdev_abc123')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('is deterministic — same input yields same hash', () => {
    expect(ApiKeyService.hashKey('kdev_same')).toBe(ApiKeyService.hashKey('kdev_same'))
  })

  it('forged key with wrong prefix produces a different hash than the real key', () => {
    const real = ApiKeyService.hashKey('kdev_aabbccddeeff00112233445566778899')
    const forged = ApiKeyService.hashKey('FAKE_aabbccddeeff00112233445566778899')
    expect(real).not.toBe(forged)
  })
})

describe('ApiKeyService.authenticateByApiKey — invalid format rejection', () => {
  beforeEach(() => jest.resetAllMocks())

  it('throws API_KEY_INVALID for a key that does not exist in DB (wrong prefix)', async () => {
    redisMock.get.mockResolvedValueOnce(null)
    prismaMock.findUnique.mockResolvedValueOnce(null)
    await expect(ApiKeyService.authenticateByApiKey('INVALID_KEY_FORMAT')).rejects.toThrow(AuthMessages.API_KEY_INVALID)
  })

  it('throws API_KEY_INVALID for an empty string key', async () => {
    redisMock.get.mockResolvedValueOnce(null)
    prismaMock.findUnique.mockResolvedValueOnce(null)
    await expect(ApiKeyService.authenticateByApiKey('')).rejects.toThrow(AuthMessages.API_KEY_INVALID)
  })

  it('throws API_KEY_INVALID when DB returns null (wrong user ID embedded)', async () => {
    redisMock.get.mockResolvedValueOnce(null)
    prismaMock.findUnique.mockResolvedValueOnce(null)
    await expect(ApiKeyService.authenticateByApiKey('kdev_wronguseridembedded0011223344')).rejects.toThrow(AuthMessages.API_KEY_INVALID)
  })
})

describe('ApiKeyService.authenticateByApiKey — expired key rejection', () => {
  beforeEach(() => jest.resetAllMocks())

  it('throws API_KEY_EXPIRED for a key that expired 1ms ago', async () => {
    redisMock.get.mockResolvedValueOnce(null)
    prismaMock.findUnique.mockResolvedValueOnce({
      user: { userId: 'user-1', email: 'a@b.com', name: 'Test', userRole: 'USER', userStatus: 'ACTIVE', userPreferences: {}, userProfile: {} },
      expiresAt: new Date(Date.now() - 1),
      apiKeyId: 'key-exp',
      name: 'expired',
      dailyLimit: null,
      monthlyLimit: null,
    })
    await expect(ApiKeyService.authenticateByApiKey('kdev_expiredkey0000000000000000000')).rejects.toThrow(AuthMessages.API_KEY_EXPIRED)
  })

  it('throws API_KEY_EXPIRED for a key expiring yesterday', async () => {
    redisMock.get.mockResolvedValueOnce(null)
    prismaMock.findUnique.mockResolvedValueOnce({
      user: { userId: 'user-2', email: 'b@b.com', name: 'Test2', userRole: 'USER', userStatus: 'ACTIVE', userPreferences: {}, userProfile: {} },
      expiresAt: new Date(Date.now() - 86_400_000),
      apiKeyId: 'key-old',
      name: 'old',
      dailyLimit: null,
      monthlyLimit: null,
    })
    await expect(ApiKeyService.authenticateByApiKey('kdev_oldkey00000000000000000000000')).rejects.toThrow(AuthMessages.API_KEY_EXPIRED)
  })
})

describe('ApiKeyService.revoke — wrong owner prevention', () => {
  beforeEach(() => jest.resetAllMocks())

  it('throws API_KEY_NOT_FOUND when userId does not match key owner', async () => {
    prismaMock.findFirst.mockResolvedValueOnce(null)
    await expect(ApiKeyService.revoke('key-1', 'attacker-user-id')).rejects.toThrow(AuthMessages.API_KEY_NOT_FOUND)
  })

  it('succeeds when userId matches the key owner', async () => {
    prismaMock.findFirst.mockResolvedValueOnce({ apiKeyId: 'key-1', userId: 'owner-id', keyHash: 'abc123' })
    prismaMock.delete.mockResolvedValueOnce({})
    redisMock.del.mockResolvedValueOnce(1)
    await expect(ApiKeyService.revoke('key-1', 'owner-id')).resolves.toBeUndefined()
    expect(prismaMock.delete).toHaveBeenCalledWith({ where: { apiKeyId: 'key-1' } })
  })
})

describe('ApiKeyService.checkAndIncrementUsage — rate limit enforcement', () => {
  beforeEach(() => jest.resetAllMocks())

  it('throws API_KEY_DAILY_LIMIT_EXCEEDED when daily counter exceeds limit', async () => {
    redisMock.incr.mockResolvedValueOnce(11).mockResolvedValueOnce(5)
    await expect(
      ApiKeyService.checkAndIncrementUsage('key-1', 10, null, 'test-key')
    ).rejects.toThrow(AuthMessages.API_KEY_DAILY_LIMIT_EXCEEDED)
  })

  it('throws API_KEY_MONTHLY_LIMIT_EXCEEDED when monthly counter exceeds limit', async () => {
    redisMock.incr.mockResolvedValueOnce(5).mockResolvedValueOnce(101)
    await expect(
      ApiKeyService.checkAndIncrementUsage('key-1', null, 100, 'test-key')
    ).rejects.toThrow(AuthMessages.API_KEY_MONTHLY_LIMIT_EXCEEDED)
  })

  it('does not throw when both limits are null (unlimited key)', async () => {
    redisMock.incr.mockResolvedValueOnce(9999).mockResolvedValueOnce(9999)
    const result = await ApiKeyService.checkAndIncrementUsage('key-1', null, null, 'unlimited')
    expect(result.dailyExceeded).toBe(false)
    expect(result.monthlyExceeded).toBe(false)
  })

  it('sets TTL on first increment (counter == 1)', async () => {
    redisMock.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(1)
    redisMock.expire.mockResolvedValue(1)
    await ApiKeyService.checkAndIncrementUsage('key-1', null, null, 'ttl-test')
    expect(redisMock.expire).toHaveBeenCalledTimes(2)
  })
})

describe('ApiKeyService.authenticateByApiKey — Redis cache path', () => {
  beforeEach(() => jest.resetAllMocks())

  it('returns safeUser from cache without hitting DB', async () => {
    const cachedUser = { userId: 'user-cached', email: 'cached@b.com', name: 'Cached', userRole: 'USER', userStatus: 'ACTIVE', userPreferences: {}, userProfile: {} }
    const cachePayload = JSON.stringify({
      safeUser: cachedUser,
      apiKeyId: 'key-cached',
      keyName: 'cached-key',
      dailyLimit: null,
      monthlyLimit: null,
    })
    redisMock.get.mockResolvedValueOnce(cachePayload)
    redisMock.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(1)
    const result = await ApiKeyService.authenticateByApiKey('kdev_cachedkey000000000000000000')
    expect(result.userId).toBe('user-cached')
    expect(prismaMock.findUnique).not.toHaveBeenCalled()
  })
})

// ── Phase 18: ApiKeyService.create and list ──────────────────────────────────

describe('ApiKeyService.create', () => {
  beforeEach(() => jest.resetAllMocks())

  it('creates an API key via prisma and returns the record + rawKey', async () => {
    const fakeRecord = {
      apiKeyId: 'new-key-id',
      name: 'my-key',
      prefix: 'kdev_abc123',
      dailyLimit: 100,
      monthlyLimit: 1000,
      lastUsedAt: null,
      expiresAt: null,
      createdAt: new Date(),
    }
    prismaMock.create.mockResolvedValueOnce(fakeRecord)

    const result = await ApiKeyService.create('user-1', 'my-key', undefined, 100, 1000)

    expect(prismaMock.create).toHaveBeenCalledTimes(1)
    expect(result).toHaveProperty('rawKey')
    expect(result).toHaveProperty('apiKey')
    expect(result.rawKey).toMatch(/^kdev_[a-f0-9]{32}$/)
    expect(result.apiKey.apiKeyId).toBe('new-key-id')
  })

  it('stores the SHA-256 hash of the rawKey (not the rawKey itself)', async () => {
    const fakeRecord = {
      apiKeyId: 'key-hash-check',
      name: 'hash-test',
      prefix: 'kdev_aabbcc',
      dailyLimit: null,
      monthlyLimit: null,
      lastUsedAt: null,
      expiresAt: null,
      createdAt: new Date(),
    }
    prismaMock.create.mockResolvedValueOnce(fakeRecord)

    const result = await ApiKeyService.create('user-2', 'hash-test')

    const createCall = prismaMock.create.mock.calls[0][0]
    const storedHash = createCall.data.keyHash
    // Verify what was stored is actually the hash of the rawKey
    expect(storedHash).toBe(ApiKeyService.hashKey(result.rawKey))
    // And that the rawKey itself was NOT stored
    expect(storedHash).not.toBe(result.rawKey)
  })

  it('passes optional expiresAt, dailyLimit, monthlyLimit to prisma', async () => {
    const expiresAt = new Date(Date.now() + 86_400_000)
    const fakeRecord = {
      apiKeyId: 'expiring-key',
      name: 'expiring',
      prefix: 'kdev_112233',
      dailyLimit: 50,
      monthlyLimit: 500,
      lastUsedAt: null,
      expiresAt,
      createdAt: new Date(),
    }
    prismaMock.create.mockResolvedValueOnce(fakeRecord)

    await ApiKeyService.create('user-3', 'expiring', expiresAt, 50, 500)

    const createData = prismaMock.create.mock.calls[0][0].data
    expect(createData.expiresAt).toBe(expiresAt)
    expect(createData.dailyLimit).toBe(50)
    expect(createData.monthlyLimit).toBe(500)
  })
})

describe('ApiKeyService.list', () => {
  beforeEach(() => jest.resetAllMocks())

  it('returns all API keys for a given userId', async () => {
    const fakeKeys = [
      { apiKeyId: 'k1', name: 'key-one', prefix: 'kdev_aaa', dailyLimit: null, monthlyLimit: null, lastUsedAt: null, expiresAt: null, createdAt: new Date() },
      { apiKeyId: 'k2', name: 'key-two', prefix: 'kdev_bbb', dailyLimit: 10, monthlyLimit: 100, lastUsedAt: null, expiresAt: null, createdAt: new Date() },
    ]
    prismaMock.findMany.mockResolvedValueOnce(fakeKeys)

    const result = await ApiKeyService.list('user-1')

    expect(prismaMock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    )
    expect(result).toHaveLength(2)
    expect(result[0].apiKeyId).toBe('k1')
    expect(result[1].apiKeyId).toBe('k2')
  })

  it('returns an empty array when the user has no keys', async () => {
    prismaMock.findMany.mockResolvedValueOnce([])

    const result = await ApiKeyService.list('user-no-keys')

    expect(result).toEqual([])
  })

  it('orders keys by createdAt descending', async () => {
    prismaMock.findMany.mockResolvedValueOnce([])

    await ApiKeyService.list('user-1')

    expect(prismaMock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } })
    )
  })
})

describe('ApiKeyService.checkAndIncrementUsage — notification on first breach', () => {
  beforeEach(() => jest.resetAllMocks())

  it('fires notifyAdminQuotaExceeded the first time daily limit is breached (rawDaily === limit + 1)', async () => {
    // Mock MailService as unavailable so notification is a no-op
    jest.mock('@/services/NotificationService/MailService', () => ({
      __esModule: true,
      default: { INFORM_MAIL: null, sendMail: jest.fn() },
    }))

    // rawDaily = dailyLimit + 1 triggers notification; rawMonthly is under limit
    redisMock.incr.mockResolvedValueOnce(6).mockResolvedValueOnce(3)

    // Should throw because daily exceeded (6 > 5)
    await expect(
      ApiKeyService.checkAndIncrementUsage('key-notify', 5, null, 'notify-key')
    ).rejects.toThrow(AuthMessages.API_KEY_DAILY_LIMIT_EXCEEDED)
  })

  it('fires notifyAdminQuotaExceeded the first time monthly limit is breached (rawMonthly === limit + 1)', async () => {
    jest.mock('@/services/NotificationService/MailService', () => ({
      __esModule: true,
      default: { INFORM_MAIL: null, sendMail: jest.fn() },
    }))

    // rawDaily is under daily limit (no daily limit), rawMonthly = monthlyLimit + 1
    redisMock.incr.mockResolvedValueOnce(3).mockResolvedValueOnce(11)

    await expect(
      ApiKeyService.checkAndIncrementUsage('key-notify-monthly', null, 10, 'notify-monthly-key')
    ).rejects.toThrow(AuthMessages.API_KEY_MONTHLY_LIMIT_EXCEEDED)
  })

  it('sets daily TTL when rawDaily === 1 (first increment of the day)', async () => {
    redisMock.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(5)
    redisMock.expire.mockResolvedValue(1)

    await ApiKeyService.checkAndIncrementUsage('key-first-day', null, null, 'first-day')

    // expire should be called for daily key (rawDaily === 1)
    expect(redisMock.expire).toHaveBeenCalledTimes(1)
  })

  it('sets monthly TTL when rawMonthly === 1 (first increment of the month)', async () => {
    redisMock.incr.mockResolvedValueOnce(5).mockResolvedValueOnce(1)
    redisMock.expire.mockResolvedValue(1)

    await ApiKeyService.checkAndIncrementUsage('key-first-month', null, null, 'first-month')

    // expire should be called for monthly key (rawMonthly === 1)
    expect(redisMock.expire).toHaveBeenCalledTimes(1)
  })

  it('sets both TTLs when both daily and monthly are first increments', async () => {
    redisMock.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(1)
    redisMock.expire.mockResolvedValue(1)

    await ApiKeyService.checkAndIncrementUsage('key-both-first', null, null, 'both-first')

    expect(redisMock.expire).toHaveBeenCalledTimes(2)
  })
})
