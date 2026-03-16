import CampaignService from '@/services/CampaignService'
import { prisma } from '@/libs/prisma'
import CampaignMessages from '@/messages/CampaignMessages'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    campaign: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
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

import SubscriptionService from '@/services/SubscriptionService'
import MailService from '@/services/NotificationService/MailService'

const prismaMock = prisma as any
const subsMock = SubscriptionService as jest.Mocked<typeof SubscriptionService>
const mailMock = MailService as jest.Mocked<typeof MailService>

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
  beforeEach(() => jest.resetAllMocks())

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

    it('marks SENT with sentCount=0 when no subscribers', async () => {
      prismaMock.campaign.findFirst.mockResolvedValueOnce({ ...mockCampaign, topic: null })
      prismaMock.campaign.update.mockResolvedValue({})
      prismaMock.user.findMany.mockResolvedValueOnce([])
      subsMock.getAllSubscriptions.mockResolvedValueOnce({ subscriptions: [], total: 0 })

      const result = await CampaignService.sendCampaign('camp-1')
      expect(result.sentCount).toBe(0)
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
  })
})
