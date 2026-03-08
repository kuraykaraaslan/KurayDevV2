import { prisma } from '@/libs/prisma'
import { Campaign } from '@/types/common/CampaignTypes'
import { SubscriptionTopic } from '@/types/common/SubscriptionTypes'
import CampaignMessages from '@/messages/CampaignMessages'
import SubscriptionService from './SubscriptionService'
import MailService from './NotificationService/MailService'

export default class CampaignService {
  static async getAllCampaigns(data: {
    page?: number
    pageSize?: number
    search?: string
    sortKey?: string
    sortDir?: 'asc' | 'desc'
  }): Promise<{ campaigns: Campaign[]; total: number }> {
    const where = {
      ...(data.search && {
        OR: [
          { title: { contains: data.search, mode: 'insensitive' as const } },
          { subject: { contains: data.search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const ALLOWED_SORT_KEYS: Record<string, string> = { title: 'title', subject: 'subject', status: 'status', createdAt: 'createdAt' }
    const resolvedSortKey = (data.sortKey && ALLOWED_SORT_KEYS[data.sortKey]) ?? 'createdAt'
    const resolvedSortDir: 'asc' | 'desc' = data.sortDir === 'asc' ? 'asc' : 'desc'

    const [campaigns, total] = await prisma.$transaction([
      prisma.campaign.findMany({
        where,
        skip: data.page && data.pageSize ? data.page * data.pageSize : undefined,
        take: data.pageSize ? data.pageSize : undefined,
        orderBy: { [resolvedSortKey]: resolvedSortDir },
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
    topic?: SubscriptionTopic
  }): Promise<Campaign> {
    const campaign = await prisma.campaign.create({
      data: {
        title: data.title,
        subject: data.subject,
        content: data.content,
        topic: data.topic ?? null,
      },
    })
    return campaign as Campaign
  }

  static async updateCampaign(data: {
    campaignId: string
    title: string
    subject: string
    content: string
    topic?: SubscriptionTopic
  }): Promise<Campaign> {
    const existing = await this.getCampaignById(data.campaignId)
    if (!existing) throw new Error(CampaignMessages.CAMPAIGN_NOT_FOUND)
    if (existing.status !== 'DRAFT') throw new Error(CampaignMessages.CAMPAIGN_NOT_DRAFT)

    const { campaignId, ...updateData } = data
    const campaign = await prisma.campaign.update({
      where: { campaignId },
      data: { ...updateData, topic: updateData.topic ?? null },
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

    // Get subscribers: if campaign has a topic, filter by that topic preference
    let subscribers: { email: string; unsubscribeToken: string | null }[]
    if (campaign.topic) {
      subscribers = await SubscriptionService.getSubscribersByTopic(campaign.topic)
    } else {
      // No topic — send to all: registered users with newsletter=true + all anonymous subscribers
      const [registeredUsers, { subscriptions: anonSubs }] = await Promise.all([
        prisma.user.findMany({
          where: { deletedAt: null },
          select: { email: true, userPreferences: true },
        }),
        SubscriptionService.getAllSubscriptions({ includeDeleted: false }),
      ])
      const registeredEmailSet = new Set(registeredUsers.map((u) => u.email))
      const registeredList = registeredUsers
        .filter((u) => {
          const prefs = (u.userPreferences ?? {}) as Record<string, unknown>
          return prefs.newsletter !== false
        })
        .map((u) => ({ email: u.email, unsubscribeToken: null as string | null }))
      const anonList = anonSubs
        .filter((s) => !registeredEmailSet.has(s.email))
        .map((s) => ({ email: s.email, unsubscribeToken: s.unsubscribeToken }))
      subscribers = [...registeredList, ...anonList]
    }

    if (subscribers.length === 0) {
      // No subscribers, mark as SENT immediately
      await prisma.campaign.update({
        where: { campaignId },
        data: { status: 'SENT', sentAt: new Date(), sentCount: 0 },
      })
      return { sentCount: 0 }
    }

    // Queue email for each subscriber
    for (const subscriber of subscribers) {
      await MailService.sendCampaignEmail(
        subscriber.email,
        campaign.subject,
        campaign.content,
        subscriber.unsubscribeToken ?? ''
      )
    }

    // Mark as SENT
    await prisma.campaign.update({
      where: { campaignId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentCount: subscribers.length,
      },
    })

    return { sentCount: subscribers.length }
  }
}
