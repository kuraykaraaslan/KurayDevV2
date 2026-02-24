import redis, { redisConnection } from '@/libs/redis'
import { Redis } from 'ioredis'
import { prisma } from '@/libs/prisma'
import { v4 as uuid } from 'uuid'
import type { Notification } from '@/types/common/NotificationTypes'
import PushNotificationService from '@/services/PushNotificationService'

/**
 * InAppNotificationService
 *
 * Stores admin in-app notifications in Redis.
 *
 * Redis keys:
 *   notifications:{userId}       → Hash  { [notificationId]: JSON<Notification> }
 *   notifications_read:{userId}  → Set   { notificationId, ... }
 *
 * Pub/Sub channel:
 *   notifications:{userId}       → publishes JSON<Notification> on every push
 */
export default class InAppNotificationService {
  private static notifKey = (userId: string) => `notifications:${userId}`
  private static readKey = (userId: string) => `notifications_read:${userId}`
  private static channel = (userId: string) => `notifications:${userId}`

  /** Create a dedicated subscriber connection (caller must manage lifecycle) */
  static createSubscriber(): Redis {
    return new Redis(redisConnection)
  }

  static MAX_PER_USER = 50
  static TTL = 7 * 24 * 60 * 60 // 7 days in seconds

  // ── Push ──────────────────────────────────────────────────────────────────

  static async push(
    userId: string,
    data: Pick<Notification, 'title' | 'message' | 'path'>
  ): Promise<Notification> {
    const notification: Notification = {
      notificationId: uuid(),
      title: data.title,
      message: data.message,
      path: data.path,
      isRead: false,
      createdAt: new Date().toISOString(),
    }

    const key = this.notifKey(userId)
    await redis.hset(key, notification.notificationId, JSON.stringify(notification))
    await redis.expire(key, this.TTL)

    // Trim to max
    const all = await this.getAll(userId)
    if (all.length > this.MAX_PER_USER) {
      const oldest = all
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, all.length - this.MAX_PER_USER)
      for (const n of oldest) {
        await redis.hdel(key, n.notificationId)
      }
    }

    // Broadcast to SSE subscribers
    await redis.publish(this.channel(userId), JSON.stringify(notification))

    // Send web push notification (fire-and-forget)
    PushNotificationService.sendToUser(userId, {
      title: data.title,
      body: data.message,
      url: data.path || '/',
    }).catch(() => {})

    return notification
  }

  /** Push to all admin users in the database */
  static async pushToAdmins(
    data: Pick<Notification, 'title' | 'message' | 'path'>
  ): Promise<void> {
    const admins = await prisma.user.findMany({
      where: { userRole: 'ADMIN' },
      select: { userId: true },
    })
    // push() already sends a web push per user, no extra sendToAdmins needed
    await Promise.all(admins.map((a) => this.push(a.userId, data)))
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  static async getAll(userId: string): Promise<Notification[]> {
    const raw = await redis.hgetall(this.notifKey(userId))
    if (!raw) return []

    const readIds = await this.getReadIds(userId)
    const notifications: Notification[] = Object.values(raw).map((json) => {
      const n: Notification = JSON.parse(json)
      return { ...n, isRead: readIds.has(n.notificationId) }
    })

    return notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  static async unreadCount(userId: string): Promise<number> {
    const all = await this.getAll(userId)
    return all.filter((n) => !n.isRead).length
  }

  // ── Mark as read ──────────────────────────────────────────────────────────

  static async markAsRead(userId: string, notificationId: string): Promise<void> {
    const key = this.readKey(userId)
    await redis.sadd(key, notificationId)
    await redis.expire(key, this.TTL)
  }

  static async markAllAsRead(userId: string): Promise<void> {
    const all = await this.getAll(userId)
    if (!all.length) return
    const key = this.readKey(userId)
    await redis.sadd(key, ...all.map((n) => n.notificationId))
    await redis.expire(key, this.TTL)
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  static async deleteOne(userId: string, notificationId: string): Promise<void> {
    await Promise.all([
      redis.hdel(this.notifKey(userId), notificationId),
      redis.srem(this.readKey(userId), notificationId),
    ])
  }

  static async clearAll(userId: string): Promise<void> {
    await Promise.all([
      redis.del(this.notifKey(userId)),
      redis.del(this.readKey(userId)),
    ])
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private static async getReadIds(userId: string): Promise<Set<string>> {
    const members = await redis.smembers(this.readKey(userId))
    return new Set(members)
  }
}
