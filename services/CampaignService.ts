import { prisma } from '@/libs/prisma'
import { Campaign } from '@/types/common/CampaignTypes'
import { SubscriptionTopic } from '@/types/common/SubscriptionTypes'
import CampaignMessages from '@/messages/CampaignMessages'
import Logger from '@/libs/logger'
import SubscriptionService from './SubscriptionService'
import MailService from './NotificationService/MailService'

type CampaignRecipient = {
  email: string
  unsubscribeToken: string | null
}

export default class CampaignService {
  private static normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  private static dedupeRecipients(recipients: CampaignRecipient[]): CampaignRecipient[] {
    const uniqueRecipients = new Map<string, CampaignRecipient>()

    for (const recipient of recipients) {
      const normalizedEmail = this.normalizeEmail(recipient.email)
      if (!normalizedEmail) continue

      const existing = uniqueRecipients.get(normalizedEmail)
      if (!existing) {
        uniqueRecipients.set(normalizedEmail, {
          email: normalizedEmail,
          unsubscribeToken: recipient.unsubscribeToken?.trim() || null,
        })
        continue
      }

      if (!existing.unsubscribeToken && recipient.unsubscribeToken?.trim()) {
        uniqueRecipients.set(normalizedEmail, {
          email: normalizedEmail,
          unsubscribeToken: recipient.unsubscribeToken.trim(),
        })
      }
    }

    return [...uniqueRecipients.values()]
  }

  private static async attachUnsubscribeTokens(
    recipients: CampaignRecipient[]
  ): Promise<{ email: string; unsubscribeToken: string }[]> {
    return await Promise.all(
      recipients.map(async (recipient) => {
        if (recipient.unsubscribeToken?.trim()) {
          return {
            email: recipient.email,
            unsubscribeToken: recipient.unsubscribeToken.trim(),
          }
        }

        const subscription = await prisma.subscription.upsert({
          where: { email: recipient.email },
          update: {},
          create: { email: recipient.email },
          select: { unsubscribeToken: true },
        })

        return {
          email: recipient.email,
          unsubscribeToken: subscription.unsubscribeToken,
        }
      })
    )
  }

  static async getAllCampaigns(data: {
    page?: number
    pageSize?: number
    search?: string
    sortKey?: string
    sortDir?: 'asc' | 'desc'
  }): Promise<{ campaigns: Campaign[]; total: number }> {
    const where = {
      deletedAt: null,
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
    const campaign = await prisma.campaign.findFirst({
      where: { campaignId, deletedAt: null },
    })
    return campaign as Campaign | null
  }

  static async createCampaign(data: {
    title: string
    subject: string
    content: string
    topic?: SubscriptionTopic
  }): Promise<Campaign> {
    const title = data.title?.trim()
    const subject = data.subject?.trim()
    const content = data.content?.trim()

    if (!title) throw new Error(CampaignMessages.TITLE_REQUIRED)
    if (!subject) throw new Error(CampaignMessages.SUBJECT_REQUIRED)
    if (!content) throw new Error(CampaignMessages.CONTENT_REQUIRED)

    const campaign = await prisma.campaign.create({
      data: {
        title,
        subject,
        content,
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

    const title = data.title?.trim()
    const subject = data.subject?.trim()
    const content = data.content?.trim()

    if (!title) throw new Error(CampaignMessages.TITLE_REQUIRED)
    if (!subject) throw new Error(CampaignMessages.SUBJECT_REQUIRED)
    if (!content) throw new Error(CampaignMessages.CONTENT_REQUIRED)

    const { campaignId, ...updateData } = data
    const campaign = await prisma.campaign.update({
      where: { campaignId },
      data: {
        ...updateData,
        title,
        subject,
        content,
        topic: updateData.topic ?? null,
      },
    })
    return campaign as Campaign
  }

  static async deleteCampaign(campaignId: string): Promise<void> {
    const existing = await this.getCampaignById(campaignId)
    if (!existing) throw new Error(CampaignMessages.CAMPAIGN_NOT_FOUND)
    if (existing.status !== 'DRAFT') throw new Error(CampaignMessages.CAMPAIGN_NOT_DRAFT)

    await prisma.campaign.update({ where: { campaignId }, data: { deletedAt: new Date() } })
  }

  static async sendCampaign(campaignId: string): Promise<{ sentCount: number }> {
    const campaign = await this.getCampaignById(campaignId)
    if (!campaign) throw new Error(CampaignMessages.CAMPAIGN_NOT_FOUND)
    if (campaign.status !== 'DRAFT') throw new Error(CampaignMessages.CAMPAIGN_NOT_DRAFT)
    if (!campaign.subject?.trim()) throw new Error(CampaignMessages.SUBJECT_REQUIRED)
    if (!campaign.content?.trim()) throw new Error(CampaignMessages.CONTENT_REQUIRED)

    const lockResult = await prisma.campaign.updateMany({
      where: { campaignId, deletedAt: null, status: 'DRAFT' },
      data: { status: 'SENDING' },
    })

    if (lockResult.count !== 1) {
      Logger.warn(`[CampaignService] sendCampaign lock not acquired for ${campaignId}`)
      throw new Error(CampaignMessages.CAMPAIGN_NOT_DRAFT)
    }

    try {
      let subscribers: CampaignRecipient[]
      if (campaign.topic) {
        subscribers = await SubscriptionService.getSubscribersByTopic(campaign.topic)
      } else {
        const [registeredUsers, { subscriptions: anonSubs }] = await Promise.all([
          prisma.user.findMany({
            where: { deletedAt: null, userStatus: 'ACTIVE' },
            select: { email: true, userPreferences: true },
          }),
          SubscriptionService.getAllSubscriptions({ includeDeleted: false }),
        ])
        const registeredEmailSet = new Set(
          registeredUsers.map((u) => this.normalizeEmail(u.email))
        )
        const registeredList = registeredUsers
          .filter((u) => {
            const prefs = (u.userPreferences ?? {}) as Record<string, unknown>
            return prefs.newsletter !== false
          })
          .map((u) => ({ email: u.email, unsubscribeToken: null as string | null }))
        const anonList = anonSubs
          .filter((s) => !registeredEmailSet.has(this.normalizeEmail(s.email)))
          .map((s) => ({ email: s.email, unsubscribeToken: s.unsubscribeToken }))
        subscribers = [...registeredList, ...anonList]
      }

      const uniqueSubscribers = this.dedupeRecipients(subscribers)
      const subscribersWithTokens = await this.attachUnsubscribeTokens(uniqueSubscribers)

      if (subscribersWithTokens.length === 0) {
        await prisma.campaign.update({
          where: { campaignId },
          data: { status: 'SENT', sentAt: new Date(), sentCount: 0 },
        })
        Logger.info(`[CampaignService] Send summary ${campaignId}: total=0 sent=0 failed=0`)
        return { sentCount: 0 }
      }

      const totalRecipients = subscribersWithTokens.length
      let sentCount = 0
      for (const subscriber of subscribersWithTokens) {
        try {
          await MailService.sendCampaignEmail(
            subscriber.email,
            campaign.subject,
            campaign.content,
            subscriber.unsubscribeToken
          )
          sentCount += 1
        } catch (error: any) {
          Logger.error(
            `[CampaignService] Failed to queue campaign mail for ${subscriber.email}: ${error?.message || error}`
          )
        }
      }

      await prisma.campaign.update({
        where: { campaignId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          sentCount,
        },
      })

      const failedCount = totalRecipients - sentCount
      Logger.info(
        `[CampaignService] Send summary ${campaignId}: total=${totalRecipients} sent=${sentCount} failed=${failedCount}`
      )

      return { sentCount }
    } catch (error) {
      await prisma.campaign.update({ where: { campaignId }, data: { status: 'DRAFT' } })
      throw error
    }
  }
}
