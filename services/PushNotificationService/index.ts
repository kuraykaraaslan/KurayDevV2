import webpush from 'web-push'
import { prisma } from '@/libs/prisma'
import Logger from '@/libs/logger'

// Lazy-init: configure VAPID only on first use so importing this module
// doesn't crash when env vars are missing (e.g. during build or unrelated routes).
let vapidInitialised = false

function ensureVapid() {
  if (vapidInitialised) return
  webpush.setVapidDetails(
    'mailto:info@kuray.dev',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  vapidInitialised = true
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
}

/**
 * PushNotificationService
 *
 * Manages Web Push subscriptions persisted in PostgreSQL (via Prisma)
 * and delivers push notifications using the web-push library.
 */
export default class PushNotificationService {
  // ── Subscription management ───────────────────────────────────────────────

  /** Subscribe a user to web push. Upserts by endpoint. */
  static async subscribe(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
  ) {
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    })
  }

  /** Remove a subscription for a user (all subscriptions for that user). */
  static async unsubscribe(userId: string) {
    await prisma.pushSubscription.deleteMany({ where: { userId } })
  }

  /** Remove a single subscription by endpoint. */
  static async unsubscribeByEndpoint(endpoint: string) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } })
  }

  // ── Sending ───────────────────────────────────────────────────────────────

  /** Send a push notification to a specific user (all their devices). */
  static async sendToUser(userId: string, payload: PushPayload) {
    ensureVapid()
    const subs = await prisma.pushSubscription.findMany({ where: { userId } })
    await Promise.allSettled(
      subs.map((sub) => this.sendToSubscription(sub, payload))
    )
  }

  /** Send a push notification to all admin users. */
  static async sendToAdmins(payload: PushPayload) {
    ensureVapid()
    const adminUsers = await prisma.user.findMany({
      where: { userRole: 'ADMIN' },
      select: { userId: true },
    })

    const adminIds = adminUsers.map((u) => u.userId)
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: { in: adminIds } },
    })

    await Promise.allSettled(
      subs.map((sub) => this.sendToSubscription(sub, payload))
    )
  }

  /** Send a push notification to ALL subscribers (e.g. new blog post). */
  static async sendToAll(payload: PushPayload) {
    ensureVapid()
    const subs = await prisma.pushSubscription.findMany()
    await Promise.allSettled(
      subs.map((sub) => this.sendToSubscription(sub, payload))
    )
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private static async sendToSubscription(
    sub: { id: string; endpoint: string; p256dh: string; auth: string },
    payload: PushPayload
  ) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    }

    try {
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload)
      )
    } catch (error: any) {
      // 410 Gone or 404 means the subscription is invalid — clean it up
      if (error.statusCode === 410 || error.statusCode === 404) {
        Logger.warn(
          `Push subscription ${sub.id} expired (${error.statusCode}), removing.`
        )
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
      } else {
        Logger.error(`Push notification failed for ${sub.id}: ${error.message}`)
      }
    }
  }
}
