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
