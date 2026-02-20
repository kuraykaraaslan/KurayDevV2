//SubscriptionService

import { Subscription } from '@/types/common/SubscriptionTypes'
import { prisma } from '@/libs/prisma'
//import PostService from "./PostService";
//import MailService from "./NotificationService/MailService";

export default class SubscriptionService {
  static async getAllSubscriptions(data: {
    page?: number
    pageSize?: number
    includeDeleted?: boolean
    search?: string
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

    const [subscriptions, total] = await prisma.$transaction([
      prisma.subscription.findMany({
        where,
        skip: data.page && data.pageSize ? data.page * data.pageSize : undefined,
        take: data.pageSize ? data.pageSize : undefined,
        orderBy: {
          createdAt: 'desc',
        },
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
}
