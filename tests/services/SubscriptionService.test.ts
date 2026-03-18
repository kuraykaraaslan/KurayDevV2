import SubscriptionService from '@/services/SubscriptionService'
import { prisma } from '@/libs/prisma'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    subscription: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

const prismaMock = prisma as any

const mockSub = {
  subscriptionId: 'sub-1',
  email: 'anon@example.com',
  unsubscribeToken: 'token-abc',
  createdAt: new Date(),
  deletedAt: null,
}

describe('SubscriptionService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── getAllSubscriptions ────────────────────────────────────────────────
  describe('getAllSubscriptions', () => {
    it('returns subscriptions and total from transaction', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[mockSub], 1])
      const result = await SubscriptionService.getAllSubscriptions({})
      expect(result.subscriptions).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('applies email search filter', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[], 0])
      await SubscriptionService.getAllSubscriptions({ search: 'anon' })
      const [[findManyCall]] = prismaMock.$transaction.mock.calls
      expect(findManyCall).toBeDefined()
    })
  })

  // ── getSubscriptionByEmail ────────────────────────────────────────────
  describe('getSubscriptionByEmail', () => {
    it('returns subscription when found', async () => {
      prismaMock.subscription.findFirst.mockResolvedValueOnce(mockSub)
      const result = await SubscriptionService.getSubscriptionByEmail('anon@example.com')
      expect(result?.email).toBe('anon@example.com')
    })

    it('returns null when not found', async () => {
      prismaMock.subscription.findFirst.mockResolvedValueOnce(null)
      const result = await SubscriptionService.getSubscriptionByEmail('none@ex.com')
      expect(result).toBeNull()
    })
  })

  // ── createSubscription ────────────────────────────────────────────────
  describe('createSubscription', () => {
    it('updates userPreferences for a registered user', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ userId: 'u-1', userPreferences: null })
      prismaMock.user.update.mockResolvedValueOnce({})

      const result = await SubscriptionService.createSubscription('user@example.com')
      expect(result.isRegisteredUser).toBe(true)
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u-1' },
          data: expect.objectContaining({ userPreferences: expect.objectContaining({ newsletter: true }) }),
        })
      )
    })

    it('creates anonymous subscription when user not registered', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null)
      prismaMock.subscription.findFirst.mockResolvedValueOnce(null)
      prismaMock.subscription.create.mockResolvedValueOnce(mockSub)

      const result = await SubscriptionService.createSubscription('anon@example.com')
      expect(result.isRegisteredUser).toBe(false)
      expect(prismaMock.subscription.create).toHaveBeenCalled()
    })

    it('reactivates soft-deleted subscription', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null)
      prismaMock.subscription.findFirst.mockResolvedValueOnce({ ...mockSub, deletedAt: new Date() })
      prismaMock.subscription.update.mockResolvedValueOnce({})

      await SubscriptionService.createSubscription('anon@example.com')
      expect(prismaMock.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { deletedAt: null } })
      )
    })

    it('does nothing if anonymous subscription already active', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null)
      prismaMock.subscription.findFirst.mockResolvedValueOnce(mockSub) // no deletedAt
      const result = await SubscriptionService.createSubscription('anon@example.com')
      expect(result.isRegisteredUser).toBe(false)
      expect(prismaMock.subscription.create).not.toHaveBeenCalled()
    })
  })

  // ── getSubscriptionByToken ────────────────────────────────────────────
  describe('getSubscriptionByToken', () => {
    it('returns subscription matching token', async () => {
      prismaMock.subscription.findFirst.mockResolvedValueOnce(mockSub)
      const result = await SubscriptionService.getSubscriptionByToken('token-abc')
      expect(result?.unsubscribeToken).toBe('token-abc')
    })
  })

  // ── deleteSubscription ────────────────────────────────────────────────
  describe('deleteSubscription', () => {
    it('sets newsletter=false for registered user', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ userId: 'u-1', userPreferences: {} })
      prismaMock.user.update.mockResolvedValueOnce({})

      const result = await SubscriptionService.deleteSubscription('user@example.com')
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userPreferences: expect.objectContaining({ newsletter: false }) }),
        })
      )
      expect(result?.email).toBe('user@example.com')
    })

    it('returns null when anonymous subscriber not found', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null)
      prismaMock.subscription.findFirst.mockResolvedValueOnce(null)
      const result = await SubscriptionService.deleteSubscription('anon@example.com')
      expect(result).toBeNull()
    })

    it('soft-deletes anonymous subscription', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null)
      prismaMock.subscription.findFirst.mockResolvedValueOnce(mockSub)
      prismaMock.subscription.update.mockResolvedValueOnce({ ...mockSub, deletedAt: new Date() })

      await SubscriptionService.deleteSubscription('anon@example.com')
      expect(prismaMock.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      )
    })
  })
})

// ── Phase 23 additions ────────────────────────────────────────────────────────

describe('SubscriptionService – duplicate subscription handling', () => {
  beforeEach(() => jest.clearAllMocks())

  it('does not create a new row when anonymous email is already active', async () => {
    // Active subscription (no deletedAt) already exists
    prismaMock.user.findUnique.mockResolvedValueOnce(null)
    prismaMock.subscription.findFirst.mockResolvedValueOnce(mockSub) // active, deletedAt: null

    const result = await SubscriptionService.createSubscription('anon@example.com')

    expect(result.isRegisteredUser).toBe(false)
    expect(prismaMock.subscription.create).not.toHaveBeenCalled()
    expect(prismaMock.subscription.update).not.toHaveBeenCalled()
  })

  it('reactivates rather than creating a duplicate for a previously unsubscribed email', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)
    prismaMock.subscription.findFirst.mockResolvedValueOnce({ ...mockSub, deletedAt: new Date() })
    prismaMock.subscription.update.mockResolvedValueOnce({ ...mockSub, deletedAt: null })

    const result = await SubscriptionService.createSubscription('anon@example.com')

    expect(result.isRegisteredUser).toBe(false)
    expect(prismaMock.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { deletedAt: null } })
    )
    expect(prismaMock.subscription.create).not.toHaveBeenCalled()
  })

  it('updates newsletter preference (not creates a row) for already-subscribed registered user', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      userId: 'u-1',
      userPreferences: { newsletter: true, newsletterTopics: { blogDigest: true } },
    })
    prismaMock.user.update.mockResolvedValueOnce({})

    const result = await SubscriptionService.createSubscription('user@example.com')

    expect(result.isRegisteredUser).toBe(true)
    expect(prismaMock.subscription.create).not.toHaveBeenCalled()
    // newsletter flag should remain true
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userPreferences: expect.objectContaining({ newsletter: true }),
        }),
      })
    )
  })
})

describe('SubscriptionService – getSubscriptionByToken edge cases', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns null when token does not match any subscription', async () => {
    prismaMock.subscription.findFirst.mockResolvedValueOnce(null)

    const result = await SubscriptionService.getSubscriptionByToken('nonexistent-token')
    expect(result).toBeNull()
  })

  it('returns a soft-deleted subscription when token matches (service does not filter by deletedAt)', async () => {
    const softDeleted = { ...mockSub, deletedAt: new Date() }
    prismaMock.subscription.findFirst.mockResolvedValueOnce(softDeleted)

    const result = await SubscriptionService.getSubscriptionByToken('token-abc')
    // The method returns whatever prisma returns — callers must check deletedAt if needed
    expect(result).not.toBeNull()
    expect(result?.unsubscribeToken).toBe('token-abc')
  })
})

describe('SubscriptionService – deleteSubscription idempotency', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calling deleteSubscription on already-unsubscribed anonymous email returns null', async () => {
    // Anonymous subscriber not found (already deleted or never existed)
    prismaMock.user.findUnique.mockResolvedValueOnce(null)
    prismaMock.subscription.findFirst.mockResolvedValueOnce(null)

    const result = await SubscriptionService.deleteSubscription('gone@example.com')
    expect(result).toBeNull()
    expect(prismaMock.subscription.update).not.toHaveBeenCalled()
  })

  it('calling deleteSubscription twice for a registered user sets newsletter=false both times', async () => {
    const userStub = { userId: 'u-2', userPreferences: { newsletter: false } }
    prismaMock.user.findUnique
      .mockResolvedValueOnce(userStub)
      .mockResolvedValueOnce(userStub)
    prismaMock.user.update.mockResolvedValue({})

    await SubscriptionService.deleteSubscription('user@example.com')
    await SubscriptionService.deleteSubscription('user@example.com')

    expect(prismaMock.user.update).toHaveBeenCalledTimes(2)
    expect(prismaMock.subscription.update).not.toHaveBeenCalled()
  })
})

describe('SubscriptionService – getSubscribersByTopic', () => {
  beforeEach(() => jest.clearAllMocks())

  it('excludes registered users with newsletter=false', async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([
      { email: 'opted-out@example.com', userPreferences: { newsletter: false } },
      { email: 'active@example.com', userPreferences: { newsletter: true } },
    ])
    // getAllSubscriptions uses $transaction internally
    prismaMock.$transaction.mockResolvedValueOnce([[], 0])

    const result = await SubscriptionService.getSubscribersByTopic('BLOG_DIGEST')
    const emails = result.map((r) => r.email)

    expect(emails).not.toContain('opted-out@example.com')
    expect(emails).toContain('active@example.com')
  })

  it('excludes anonymous subscriber whose email matches a registered user', async () => {
    // Registered user with the same email as an anonymous subscription
    prismaMock.user.findMany.mockResolvedValueOnce([
      { email: 'overlap@example.com', userPreferences: { newsletter: true } },
    ])
    prismaMock.$transaction.mockResolvedValueOnce([
      [{ email: 'overlap@example.com', unsubscribeToken: 'tok-1', deletedAt: null }],
      1,
    ])

    const result = await SubscriptionService.getSubscribersByTopic('BLOG_DIGEST')
    // overlap should appear only once (as registered, not twice)
    const matches = result.filter((r) => r.email === 'overlap@example.com')
    expect(matches).toHaveLength(1)
    // Registered user — no unsubscribeToken
    expect(matches[0].unsubscribeToken).toBeNull()
  })
})
