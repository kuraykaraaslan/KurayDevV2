//SubscriptionService

import { Subscription } from '@/types/common/SubscriptionTypes'
import { SubscriptionTopic } from '@/types/common/SubscriptionTypes'
import { prisma } from '@/libs/prisma'
import { UserPreferencesDefault } from '@/types/user/UserTypes'
//import PostService from "./PostService";
//import MailService from "./NotificationService/MailService";

const TOPIC_PREFERENCE_KEY: Record<SubscriptionTopic, string> = {
  BLOG_DIGEST: 'blogDigest',
  ANNOUNCEMENTS: 'announcements',
  EVENTS: 'events',
}

export default class SubscriptionService {
  static async getAllSubscriptions(data: {
    page?: number
    pageSize?: number
    includeDeleted?: boolean
    search?: string
    sortKey?: string
    sortDir?: 'asc' | 'desc'
  }): Promise<{ subscriptions: Subscription[]; total: number }> {
    const where = {
      deletedAt: data.includeDeleted ? undefined : null,
      ...(data.search && {
        email: {
          contains: data.search,
          mode: 'insensitive' as const,
        },
      }),
    }

    const ALLOWED_SORT_KEYS: Record<string, string> = { email: 'email', createdAt: 'createdAt' }
    const resolvedSortKey = (data.sortKey && ALLOWED_SORT_KEYS[data.sortKey]) ?? 'createdAt'
    const resolvedSortDir: 'asc' | 'desc' = data.sortDir === 'asc' ? 'asc' : 'desc'

    const [subscriptions, total] = await prisma.$transaction([
      prisma.subscription.findMany({
        where,
        skip: data.page && data.pageSize ? data.page * data.pageSize : undefined,
        take: data.pageSize ? data.pageSize : undefined,
        orderBy: { [resolvedSortKey]: resolvedSortDir },
      }),
      prisma.subscription.count({ where }),
    ])

    return { subscriptions, total }
  }

  static async getSubscriptionByEmail(email: string): Promise<Subscription | null> {
    return await prisma.subscription.findFirst({
      where: { email },
    })
  }

  /**
   * Subscribe an email.
   * - Registered user → sets userPreferences.newsletter = true (no Subscription row).
   * - Anonymous email → upserts a Subscription row.
   */
  static async createSubscription(email: string): Promise<{ isRegisteredUser: boolean }> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { userId: true, userPreferences: true },
    })

    if (user) {
      const existing = (user.userPreferences ?? {}) as Record<string, unknown>
      const topics = (existing.newsletterTopics as Record<string, unknown> | undefined) ?? {
        blogDigest: true,
        announcements: true,
        events: true,
      }
      await prisma.user.update({
        where: { userId: user.userId },
        data: {
          userPreferences: {
            ...UserPreferencesDefault,
            ...existing,
            newsletter: true,
            newsletterTopics: topics,
          },
        },
      })
      return { isRegisteredUser: true }
    }

    // Anonymous subscriber
    const existingSub = await this.getSubscriptionByEmail(email)
    if (existingSub) {
      if (existingSub.deletedAt) {
        await prisma.subscription.update({
          where: { email },
          data: { deletedAt: null },
        })
      }
      return { isRegisteredUser: false }
    }

    await prisma.subscription.create({ data: { email } })
    return { isRegisteredUser: false }
  }

  static async getSubscriptionByToken(token: string): Promise<Subscription | null> {
    return await prisma.subscription.findFirst({
      where: { unsubscribeToken: token },
    })
  }

  /**
   * Unsubscribe an email.
   * - Registered user → sets userPreferences.newsletter = false (no Subscription row touched).
   * - Anonymous email → soft-deletes the Subscription row.
   */
  static async deleteSubscription(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { userId: true, userPreferences: true },
    })

    if (user) {
      const existing = (user.userPreferences ?? {}) as Record<string, unknown>
      await prisma.user.update({
        where: { userId: user.userId },
        data: {
          userPreferences: {
            ...UserPreferencesDefault,
            ...existing,
            newsletter: false,
          },
        },
      })
      return
    }

    // Anonymous subscriber
    const existingSub = await this.getSubscriptionByEmail(email)
    if (!existingSub) return
    await prisma.subscription.update({
      where: { email },
      data: { deletedAt: new Date() },
    })
  }

  /**
   * Returns all emails (registered users + anonymous subscribers) opted into a topic.
   *
   * Registered users: userPreferences.newsletter === true AND topic not explicitly false.
   * Anonymous subscribers: active Subscription rows — opt-out not tracked (all included).
   */
  static async getSubscribersByTopic(
    topic: SubscriptionTopic
  ): Promise<{ email: string; unsubscribeToken: string | null }[]> {
    const topicKey = TOPIC_PREFERENCE_KEY[topic]

    // 1. Registered users subscribed to newsletter
    const registeredUsers = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { email: true, userPreferences: true },
    })

    const registeredEmails = registeredUsers
      .filter((u) => {
        const prefs = (u.userPreferences ?? {}) as Record<string, unknown>
        if (prefs.newsletter === false) return false
        const topics = prefs.newsletterTopics as Record<string, unknown> | undefined
        if (topics && topics[topicKey] === false) return false
        return true
      })
      .map((u) => ({ email: u.email, unsubscribeToken: null as string | null }))

    // 2. Anonymous subscribers (not a registered user)
    const registeredEmailSet = new Set(registeredUsers.map((u) => u.email))
    const { subscriptions } = await this.getAllSubscriptions({ includeDeleted: false })
    const anonymousEmails = subscriptions
      .filter((s) => !registeredEmailSet.has(s.email))
      .map((s) => ({ email: s.email, unsubscribeToken: s.unsubscribeToken }))

    return [...registeredEmails, ...anonymousEmails]
  }
}


const TOPIC_PREFERENCE_KEY: Record<SubscriptionTopic, string> = {
  BLOG_DIGEST: 'blogDigest',
  ANNOUNCEMENTS: 'announcements',
  EVENTS: 'events',
}

export default class SubscriptionService {
  static async getAllSubscriptions(data: {
    page?: number
    pageSize?: number
    includeDeleted?: boolean
    search?: string
    sortKey?: string
    sortDir?: 'asc' | 'desc'
  }): Promise<{ subscriptions: Subscription[]; total: number }> {
    const where = {
      deletedAt: data.includeDeleted ? undefined : null,
      ...(data.search && {
        email: {
          contains: data.search,
          mode: 'insensitive' as const,
        },
      }),
    }

    const ALLOWED_SORT_KEYS: Record<string, string> = { email: 'email', createdAt: 'createdAt' }
    const resolvedSortKey = (data.sortKey && ALLOWED_SORT_KEYS[data.sortKey]) ?? 'createdAt'
    const resolvedSortDir: 'asc' | 'desc' = data.sortDir === 'asc' ? 'asc' : 'desc'

    const [subscriptions, total] = await prisma.$transaction([
      prisma.subscription.findMany({
        where,
        skip: data.page && data.pageSize ? data.page * data.pageSize : undefined,
        take: data.pageSize ? data.pageSize : undefined,
        orderBy: { [resolvedSortKey]: resolvedSortDir },
      }),
      prisma.subscription.count({ where }),
    ])

    return { subscriptions, total }
  }

  static async getSubscriptionByEmail(email: string): Promise<Subscription | null> {
    return await prisma.subscription.findFirst({
      where: {
        email: email,
      },
    })
  }

  static async createSubscription(email: string): Promise<Subscription> {
    const existingSubscription = await this.getSubscriptionByEmail(email)
    if (existingSubscription) {
      if (existingSubscription.deletedAt) {
        return await prisma.subscription.update({
          where: {
            email: email,
          },
          data: {
            deletedAt: null,
          },
        })
      }
      return existingSubscription
    }

    return await prisma.subscription.create({
      data: {
        email: email,
      },
    })
  }

  static async getSubscriptionByToken(token: string): Promise<Subscription | null> {
    return await prisma.subscription.findFirst({
      where: { unsubscribeToken: token },
    })
  }

  static async deleteSubscription(email: string): Promise<Subscription | null> {
    const existingSubscription = await this.getSubscriptionByEmail(email)
    if (!existingSubscription) {
      return null
    }

    return await prisma.subscription.update({
      where: {
        email: email,
      },
      data: {
        deletedAt: new Date(),
      },
    })
  }

  /**
   * Returns active subscribers opted into a specific topic.
   * Preferences are read from userPreferences JSON on registered users.
   * Subscribers with no matching user account are opted in by default.
   */
  static async getSubscribersByTopic(topic: SubscriptionTopic): Promise<Subscription[]> {
    const { subscriptions } = await this.getAllSubscriptions({ includeDeleted: false })
    if (subscriptions.length === 0) return []

    const emails = subscriptions.map((s) => s.email)
    const topicKey = TOPIC_PREFERENCE_KEY[topic]

    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true, userPreferences: true },
    })

    const optedOutEmails = new Set(
      users
        .filter((u) => {
          const prefs = u.userPreferences as Record<string, unknown> | null
          if (!prefs) return false
          const topics = prefs.newsletterTopics as Record<string, unknown> | undefined
          if (!topics) return false
          return topics[topicKey] === false
        })
        .map((u) => u.email)
    )

    return subscriptions.filter((s) => !optedOutEmails.has(s.email))
  }
}
