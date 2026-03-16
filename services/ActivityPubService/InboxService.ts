import { prisma } from '@/libs/prisma'
import redisInstance from '@/libs/redis'
import Logger from '@/libs/logger'
import ActivityPubMessages from '@/messages/ActivityPubMessages'
import { AP_CONTEXT, APActor, APFollowActivity, APAcceptActivity } from '@/types/common/ActivityPubTypes'
import { getActorUrl } from './config'
import ActorService from './ActorService'
import DeliveryService from './DeliveryService'

export default class InboxService {
  /** Handles an incoming Follow activity. Stores the follower and sends Accept. */
  private static async handleFollow(activity: APFollowActivity): Promise<void> {
    const actorUrl = typeof activity.actor === 'string'
      ? activity.actor
      : (activity.actor as { id: string }).id

    let remoteActor: APActor
    try {
      remoteActor = await ActorService.fetchRemoteActor(actorUrl)
    } catch (err) {
      Logger.error(`[ActivityPub] Failed to fetch actor during Follow: ${actorUrl} — ${String(err)}`)
      throw new Error(ActivityPubMessages.ACTOR_FETCH_FAILED)
    }

    const inbox = remoteActor.inbox
    const sharedInbox = remoteActor.endpoints?.sharedInbox ?? null

    await prisma.activityPubFollower.upsert({
      where: { actorUrl },
      create: { actorUrl, inbox, sharedInbox, accepted: true },
      update: { inbox, sharedInbox, accepted: true },
    })

    const accept: APAcceptActivity = {
      '@context': AP_CONTEXT,
      id: `${getActorUrl()}#accept-${Date.now()}`,
      type: 'Accept',
      actor: getActorUrl(),
      object: activity,
    }

    try {
      await DeliveryService.deliverActivity(accept as unknown as Record<string, unknown>, inbox)
      Logger.info(`[ActivityPub] Accepted Follow from ${actorUrl}`)
    } catch (err) {
      Logger.error(`[ActivityPub] Failed to deliver Accept to ${actorUrl}: ${String(err)}`)
      // Non-fatal — follower is stored; remote server will retry
    }
  }

  /** Handles an incoming Undo activity (Undo Follow = unfollow). */
  private static async handleUndo(activity: Record<string, unknown>): Promise<void> {
    const innerObject = activity.object
    if (!innerObject || typeof innerObject !== 'object') return

    const obj = innerObject as Record<string, unknown>
    if (obj.type !== 'Follow') return

    const actorUrl = typeof activity.actor === 'string'
      ? activity.actor
      : (activity.actor as { id: string }).id ?? ''

    if (!actorUrl) return

    await prisma.activityPubFollower.deleteMany({ where: { actorUrl } })
    Logger.info(`[ActivityPub] Removed follower via Undo Follow: ${actorUrl}`)
  }

  /** Routes an incoming activity to the correct handler. */
  static async handleInboxActivity(activity: Record<string, unknown>): Promise<void> {
    const type = activity.type as string

    switch (type) {
      case 'Follow':
        await this.handleFollow(activity as unknown as APFollowActivity)
        break
      case 'Undo':
        await this.handleUndo(activity)
        break
      case 'Delete': {
        const actorUrl = typeof activity.actor === 'string' ? activity.actor : ''
        if (actorUrl) {
          await prisma.activityPubFollower.deleteMany({ where: { actorUrl } })
          await redisInstance.del(`activitypub:actor:${actorUrl}`)
        }
        break
      }
      default:
        Logger.info(`[ActivityPub] Received unhandled activity type: ${type}`)
    }
  }
}
