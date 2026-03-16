import CampaignService from '@/services/CampaignService'
import { prisma } from '@/libs/prisma'
import CampaignMessages from '@/messages/CampaignMessages'
import Logger from '@/libs/logger'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    campaign: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    subscription: {
      upsert: jest.fn(),
    },
    user: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/services/SubscriptionService', () => ({
  __esModule: true,
  default: {
    getSubscribersByTopic: jest.fn(),
    getAllSubscriptions: jest.fn(),
  },
}))

jest.mock('@/services/NotificationService/MailService', () => ({
  __esModule: true,
  default: {
    sendCampaignEmail: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@/libs/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

import SubscriptionService from '@/services/SubscriptionService'
import MailService from '@/services/NotificationService/MailService'

const prismaMock = prisma as any
const subsMock = SubscriptionService as jest.Mocked<typeof SubscriptionService>
const mailMock = MailService as jest.Mocked<typeof MailService>
const loggerMock = Logger as jest.Mocked<typeof Logger>

const mockCampaign = {
  campaignId: 'camp-1',
  title: 'Test Campaign',
  subject: 'Hello',
  content: '<p>Content</p>',
  status: 'DRAFT',
  topic: null,
  sentAt: null,
  sentCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

describe('CampaignService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    prismaMock.campaign.updateMany.mockResolvedValue({ count: 1 })
    prismaMock.subscription.upsert.mockImplementation(async ({ where }: { where: { email: string } }) => ({
      email: where.email,
      unsubscribeToken: `token-${where.email}`,
    }))
  })

  // ── getAllCampaigns ────────────────────────────────────────────────────
  describe('getAllCampaigns', () => {
    it('returns campaigns and total', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([[mockCampaign], 1])
      const result = await CampaignService.getAllCampaigns({})
      expect(result.campaigns).toHaveLength(1)
      expect(result.total).toBe(1)
    })
  })

  // ── getCampaignById ───────────────────────────────────────────────────
  describe('getCampaignById', () => {
    it('returns campaign when found', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce(mockCampaign)
      const result = await CampaignService.getCampaignById('camp-1')
      expect(result?.campaignId).toBe('camp-1')
    })

    it('queries only active (non-deleted) campaigns', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce(null)

      await CampaignService.getCampaignById('camp-1')

      expect(prismaMock.campaign.findFirst).toHaveBeenCalledWith({
        where: { campaignId: 'camp-1', deletedAt: null },
      })
    })

    it('returns null when not found', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce(null)
      const result = await CampaignService.getCampaignById('nonexistent')
      expect(result).toBeNull()
    })
  })

  // ── createCampaign ────────────────────────────────────────────────────
  describe('createCampaign', () => {
    it('creates and returns campaign', async () => {
      prismaMock.campaign.create.mockResolvedValueOnce(mockCampaign)
      const result = await CampaignService.createCampaign({
        title: 'Test', subject: 'Hello', content: '<p>x</p>',
      })
      expect(result.title).toBe('Test Campaign')
    })

    it('throws SUBJECT_REQUIRED when subject is blank', async () => {
      await expect(
        CampaignService.createCampaign({ title: 'T', subject: '   ', content: 'C' })
      ).rejects.toThrow(CampaignMessages.SUBJECT_REQUIRED)
    })
  })

  // ── updateCampaign ────────────────────────────────────────────────────
  describe('updateCampaign', () => {
    it('throws CAMPAIGN_NOT_FOUND when campaign does not exist', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce(null)
      await expect(
        CampaignService.updateCampaign({ campaignId: 'x', title: 'T', subject: 'S', content: 'C' })
      ).rejects.toThrow(CampaignMessages.CAMPAIGN_NOT_FOUND)
    })

    it('throws CAMPAIGN_NOT_DRAFT when status is not DRAFT', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce({ ...mockCampaign, status: 'SENT' })
      await expect(
        CampaignService.updateCampaign({ campaignId: 'camp-1', title: 'T', subject: 'S', content: 'C' })
      ).rejects.toThrow(CampaignMessages.CAMPAIGN_NOT_DRAFT)
    })

    it('updates and returns campaign', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce(mockCampaign)
      prismaMock.campaign.update.mockResolvedValueOnce({ ...mockCampaign, title: 'Updated' })
      const result = await CampaignService.updateCampaign({
        campaignId: 'camp-1', title: 'Updated', subject: 'S', content: 'C',
      })
      expect(result.title).toBe('Updated')
    })
  })

  // ── deleteCampaign ────────────────────────────────────────────────────
  describe('deleteCampaign', () => {
    it('throws CAMPAIGN_NOT_FOUND when not found', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce(null)
      await expect(CampaignService.deleteCampaign('x')).rejects.toThrow(CampaignMessages.CAMPAIGN_NOT_FOUND)
    })

    it('throws CAMPAIGN_NOT_DRAFT when not in DRAFT status', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce({ ...mockCampaign, status: 'SENDING' })
      await expect(CampaignService.deleteCampaign('camp-1')).rejects.toThrow(CampaignMessages.CAMPAIGN_NOT_DRAFT)
    })

    it('blocks delete for SENT campaigns', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce({ ...mockCampaign, status: 'SENT' })

      await expect(CampaignService.deleteCampaign('camp-1')).rejects.toThrow(
        CampaignMessages.CAMPAIGN_NOT_DRAFT
      )
    })

    it('soft-deletes by setting deletedAt', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce(mockCampaign)
      prismaMock.campaign.update.mockResolvedValueOnce({})
      await CampaignService.deleteCampaign('camp-1')
      expect(prismaMock.campaign.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) })
      )
    })
  })

  // ── sendCampaign ──────────────────────────────────────────────────────
  describe('sendCampaign', () => {
    it('throws CAMPAIGN_NOT_FOUND when not found', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce(null)
      await expect(CampaignService.sendCampaign('x')).rejects.toThrow(CampaignMessages.CAMPAIGN_NOT_FOUND)
    })

    it('throws CAMPAIGN_NOT_DRAFT when not DRAFT', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce({ ...mockCampaign, status: 'SENT' })
      await expect(CampaignService.sendCampaign('camp-1')).rejects.toThrow(CampaignMessages.CAMPAIGN_NOT_DRAFT)
    })

    it('throws SUBJECT_REQUIRED when campaign subject is blank', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce({ ...mockCampaign, subject: '   ' })
      await expect(CampaignService.sendCampaign('camp-1')).rejects.toThrow(CampaignMessages.SUBJECT_REQUIRED)
      expect(prismaMock.campaign.updateMany).not.toHaveBeenCalled()
    })

    it('rejects second send attempt when reentrancy lock is already held', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce(mockCampaign)
      prismaMock.campaign.updateMany.mockResolvedValueOnce({ count: 0 })

      await expect(CampaignService.sendCampaign('camp-1')).rejects.toThrow(CampaignMessages.CAMPAIGN_NOT_DRAFT)
      expect(mailMock.sendCampaignEmail).not.toHaveBeenCalled()
      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining('sendCampaign lock not acquired')
      )
    })

    it('marks SENT with sentCount=0 when no subscribers', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce({ ...mockCampaign, topic: null })
      prismaMock.campaign.update.mockResolvedValue({})
      prismaMock.user.findMany.mockResolvedValueOnce([])
      subsMock.getAllSubscriptions.mockResolvedValueOnce({ subscriptions: [], total: 0 })

      const result = await CampaignService.sendCampaign('camp-1')
      expect(result.sentCount).toBe(0)
      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Send summary camp-1: total=0 sent=0 failed=0')
      )
    })

    it('filters unsubscribed/banned/inactive and duplicate recipients', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce({ ...mockCampaign, topic: null })
      prismaMock.campaign.update.mockResolvedValue({})
      prismaMock.user.findMany.mockResolvedValueOnce([
        { email: 'active@ex.com', userPreferences: { newsletter: true } },
        { email: 'unsub@ex.com', userPreferences: { newsletter: false } },
        { email: 'ACTIVE@EX.COM', userPreferences: { newsletter: true } },
      ])
      subsMock.getAllSubscriptions.mockResolvedValueOnce({
        subscriptions: [
          { email: 'active@ex.com', unsubscribeToken: 'anon-dup', createdAt: new Date(), deletedAt: null },
          { email: 'anon@ex.com', unsubscribeToken: 'anon-token', createdAt: new Date(), deletedAt: null },
          { email: 'ANON@EX.COM', unsubscribeToken: 'anon-token-dup', createdAt: new Date(), deletedAt: null },
        ],
        total: 3,
      })

      const result = await CampaignService.sendCampaign('camp-1')

      expect(result.sentCount).toBe(2)
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userStatus: 'ACTIVE' }) })
      )
      expect(mailMock.sendCampaignEmail).toHaveBeenCalledTimes(2)
      expect(mailMock.sendCampaignEmail).toHaveBeenCalledWith(
        'active@ex.com',
        'Hello',
        '<p>Content</p>',
        expect.any(String)
      )
      expect(mailMock.sendCampaignEmail).toHaveBeenCalledWith(
        'anon@ex.com',
        'Hello',
        '<p>Content</p>',
        'anon-token'
      )
      expect(mailMock.sendCampaignEmail).not.toHaveBeenCalledWith(
        'unsub@ex.com',
        expect.any(String),
        expect.any(String),
        expect.any(String)
      )
    })

    it('sends emails to topic subscribers and marks SENT', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce({ ...mockCampaign, topic: 'BLOG_DIGEST' })
      prismaMock.campaign.update.mockResolvedValue({})
      subsMock.getSubscribersByTopic.mockResolvedValueOnce([
        { email: 'a@ex.com', unsubscribeToken: 'tok-a' },
        { email: 'b@ex.com', unsubscribeToken: 'tok-b' },
      ])

      const result = await CampaignService.sendCampaign('camp-1')
      expect(mailMock.sendCampaignEmail).toHaveBeenCalledTimes(2)
      expect(result.sentCount).toBe(2)
    })

    it('keeps partial success on queue failures and preserves status timeline fields', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce({ ...mockCampaign, topic: 'BLOG_DIGEST' })
      prismaMock.campaign.update.mockResolvedValue({})
      subsMock.getSubscribersByTopic.mockResolvedValueOnce([
        { email: 'a@ex.com', unsubscribeToken: 'tok-a' },
        { email: 'b@ex.com', unsubscribeToken: 'tok-b' },
        { email: 'c@ex.com', unsubscribeToken: 'tok-c' },
      ])
      mailMock.sendCampaignEmail
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('queue down'))
        .mockResolvedValueOnce(undefined)

      const result = await CampaignService.sendCampaign('camp-1')

      expect(result.sentCount).toBe(2)
      expect(prismaMock.campaign.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ campaignId: 'camp-1', status: 'DRAFT' }),
          data: { status: 'SENDING' },
        })
      )
      expect(prismaMock.campaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { campaignId: 'camp-1' },
          data: expect.objectContaining({
            status: 'SENT',
            sentCount: 2,
            sentAt: expect.any(Date),
          }),
        })
      )
      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Send summary camp-1: total=3 sent=2 failed=1')
      )
    })
  })
})
