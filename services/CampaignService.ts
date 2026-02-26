import { prisma } from '@/libs/prisma'
import { Campaign } from '@/types/common/CampaignTypes'
import CampaignMessages from '@/messages/CampaignMessages'
import SubscriptionService from './SubscriptionService'
import MailService from './NotificationService/MailService'

export default class CampaignService {
  static async getAllCampaigns(data: {
    page?: number
    pageSize?: number
    search?: string
  }): Promise<{ campaigns: Campaign[]; total: number }> {
    const where = {
      ...(data.search && {
        OR: [
          { title: { contains: data.search, mode: 'insensitive' as const } },
          { subject: { contains: data.search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [campaigns, total] = await prisma.$transaction([
      prisma.campaign.findMany({
        where,
        skip: data.page && data.pageSize ? data.page * data.pageSize : undefined,
        take: data.pageSize ? data.pageSize : undefined,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.campaign.count({ where }),
    ])

    return { campaigns: campaigns as Campaign[], total }
  }

  static async getCampaignById(campaignId: string): Promise<Campaign | null> {
    const campaign = await prisma.campaign.findUnique({
      where: { campaignId },
    })
    return campaign as Campaign | null
  }

  static async createCampaign(data: {
    title: string
    subject: string
    content: string
  }): Promise<Campaign> {
    const campaign = await prisma.campaign.create({
      data: {
        title: data.title,
        subject: data.subject,
        content: data.content,
      },
    })
    return campaign as Campaign
  }

  static async updateCampaign(data: {
    campaignId: string
    title: string
    subject: string
    content: string
  }): Promise<Campaign> {
    const existing = await this.getCampaignById(data.campaignId)
    if (!existing) throw new Error(CampaignMessages.CAMPAIGN_NOT_FOUND)
    if (existing.status !== 'DRAFT') throw new Error(CampaignMessages.CAMPAIGN_NOT_DRAFT)

    const { campaignId, ...updateData } = data
    const campaign = await prisma.campaign.update({
      where: { campaignId },
      data: updateData,
    })
    return campaign as Campaign
  }

  static async deleteCampaign(campaignId: string): Promise<void> {
    const existing = await this.getCampaignById(campaignId)
    if (!existing) throw new Error(CampaignMessages.CAMPAIGN_NOT_FOUND)
    if (existing.status !== 'DRAFT') throw new Error(CampaignMessages.CAMPAIGN_NOT_DRAFT)

    await prisma.campaign.delete({ where: { campaignId } })
  }

  static async sendCampaign(campaignId: string): Promise<{ sentCount: number }> {
    const campaign = await this.getCampaignById(campaignId)
    if (!campaign) throw new Error(CampaignMessages.CAMPAIGN_NOT_FOUND)
    if (campaign.status !== 'DRAFT') throw new Error(CampaignMessages.CAMPAIGN_NOT_DRAFT)

    // Mark as SENDING
    await prisma.campaign.update({
      where: { campaignId },
      data: { status: 'SENDING' },
    })

    // Get all active subscribers
    const { subscriptions } = await SubscriptionService.getAllSubscriptions({
      includeDeleted: false,
    })

    if (subscriptions.length === 0) {
      // No subscribers, mark as SENT immediately
      await prisma.campaign.update({
        where: { campaignId },
        data: { status: 'SENT', sentAt: new Date(), sentCount: 0 },
      })
      return { sentCount: 0 }
    }

    // Queue email for each subscriber
    for (const subscription of subscriptions) {
      await MailService.sendCampaignEmail(
        subscription.email,
        campaign.subject,
        campaign.content,
        subscription.unsubscribeToken
      )
    }

    // Mark as SENT
    await prisma.campaign.update({
      where: { campaignId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentCount: subscriptions.length,
      },
    })

    return { sentCount: subscriptions.length }
  }
}
