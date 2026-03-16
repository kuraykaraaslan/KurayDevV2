import redisInstance from '@/libs/redis'
import ActivityPubMessages from '@/messages/ActivityPubMessages'
import { AP_CONTEXT, APActor } from '@/types/common/ActivityPubTypes'
import {
  getSiteUrl,
  getActorUrl,
  getKeyId,
  getInboxUrl,
  getOutboxUrl,
  getFollowersUrl,
  getFollowingUrl,
  getPublicKeyPem,
} from './config'

const ACTOR_CACHE_TTL = 60 * 60 * 24 // 24 hours

export default class ActorService {
  /** Returns the JSON-LD actor object for the blog account. */
  static getActorJson() {
    const siteUrl = getSiteUrl()
    const actorUrl = getActorUrl()
    const username = process.env.ACTIVITYPUB_ACTOR_USERNAME ?? 'kuray'
    const displayName = process.env.ACTIVITYPUB_ACTOR_DISPLAY_NAME ?? 'Kuray'
    const summary = process.env.ACTIVITYPUB_ACTOR_SUMMARY ?? 'Personal blog — posts federated via ActivityPub.'
    const avatarUrl = process.env.ACTIVITYPUB_ACTOR_AVATAR ?? `${siteUrl}/assets/avatar.jpg`

    return {
      '@context': AP_CONTEXT,
      id: actorUrl,
      type: 'Person',
      preferredUsername: username,
      name: displayName,
      summary,
      url: siteUrl,
      inbox: getInboxUrl(),
      outbox: getOutboxUrl(),
      followers: getFollowersUrl(),
      following: getFollowingUrl(),
      icon: { type: 'Image', mediaType: 'image/jpeg', url: avatarUrl },
      endpoints: { sharedInbox: getInboxUrl() },
      publicKey: {
        id: getKeyId(),
        owner: actorUrl,
        publicKeyPem: getPublicKeyPem(),
      },
    }
  }

  /** Fetches a remote ActivityPub actor by URL, with Redis caching. */
  static async fetchRemoteActor(actorUrl: string): Promise<APActor> {
    const cacheKey = `activitypub:actor:${actorUrl}`

    const cached = await redisInstance.get(cacheKey)
    if (cached) return JSON.parse(cached) as APActor

    const res = await fetch(actorUrl, {
      headers: { Accept: 'application/activity+json, application/ld+json' },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      throw new Error(`${ActivityPubMessages.ACTOR_FETCH_FAILED}: ${res.status} ${actorUrl}`)
    }

    const actor = (await res.json()) as APActor
    await redisInstance.setex(cacheKey, ACTOR_CACHE_TTL, JSON.stringify(actor))
    return actor
  }
}
