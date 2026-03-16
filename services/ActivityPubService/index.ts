import { prisma } from '@/libs/prisma'
import { AP_PUBLIC_AUDIENCE, ActivityPubFollower } from '@/types/common/ActivityPubTypes'
import { getSiteUrl, getActorUrl, getOutboxUrl, getFollowersUrl } from './config'
import ActorService from './ActorService'
import HttpSignatureService from './HttpSignatureService'
import InboxService from './InboxService'
import DeliveryService from './DeliveryService'

// ── Re-exported interfaces ─────────────────────────────────────────────

export interface WebFingerData {
  subject: string
  aliases: string[]
  links: Array<{ rel: string; type: string; href: string }>
}

export interface OutboxCollection {
  '@context': string
  id: string
  type: 'OrderedCollection'
  totalItems: number
  first: string
  last: string
}

export interface OutboxCollectionPage {
  '@context': string
  id: string
  type: 'OrderedCollectionPage'
  partOf: string
  totalItems: number
  orderedItems: Record<string, unknown>[]
  prev?: string
  next?: string
}

export interface NodeInfoData {
  version: string
  software: { name: string; version: string; homepage: string }
  protocols: string[]
  usage: { users: { total: number; activeMonth: number; activeHalfyear: number }; localPosts: number }
  openRegistrations: boolean
  metadata: { nodeName: string; nodeDescription: string }
}

// ── Facade ─────────────────────────────────────────────────────────────

const OUTBOX_PAGE_SIZE = 20

export default class ActivityPubService {
  // ── Actor ──────────────────────────────────────────────────────────

  /** Returns the canonical actor URL for the blog account. */
  static getActorUrl = getActorUrl

  /** Returns the JSON-LD actor object for the blog account. */
  static getActorJson = ActorService.getActorJson.bind(ActorService)

  /** Fetches a remote ActivityPub actor by URL, with Redis caching. */
  static fetchRemoteActor = ActorService.fetchRemoteActor.bind(ActorService)

  // ── HTTP Signature ─────────────────────────────────────────────────

  /** Verifies an incoming HTTP Signature. Returns true if valid. */
  static verifyHttpSignature = HttpSignatureService.verifyHttpSignature.bind(HttpSignatureService)

  // ── Inbox ──────────────────────────────────────────────────────────

  /** Routes an incoming activity to the correct handler. */
  static handleInboxActivity = InboxService.handleInboxActivity.bind(InboxService)

  // ── Delivery ───────────────────────────────────────────────────────

  /**
   * Creates and broadcasts a Create(Article) activity for a newly published post.
   * Call this whenever a post's status transitions to PUBLISHED.
   */
  static notifyFollowersOfPost = DeliveryService.notifyFollowersOfPost.bind(DeliveryService)

  /**
   * Creates and broadcasts an Update(Article) activity for an edited published post.
   * Call this whenever a PUBLISHED post's content is updated.
   */
  static notifyFollowersOfPostUpdate = DeliveryService.notifyFollowersOfPostUpdate.bind(DeliveryService)

  /**
   * Creates and broadcasts a Delete activity for a removed or unpublished post.
   * Call this whenever a PUBLISHED post is deleted or its status leaves PUBLISHED.
   */
  static notifyFollowersOfPostDelete = DeliveryService.notifyFollowersOfPostDelete.bind(DeliveryService)

  // ── Follower queries ───────────────────────────────────────────────

  /** Returns all accepted followers. */
  static async getFollowers(): Promise<ActivityPubFollower[]> {
    return prisma.activityPubFollower.findMany({
      where: { accepted: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  /** Returns the total number of accepted followers. */
  static async getFollowerCount(): Promise<number> {
    return prisma.activityPubFollower.count({ where: { accepted: true } })
  }

  // ── WebFinger ──────────────────────────────────────────────────────

  /**
   * Returns the WebFinger JRD for the given resource string.
   * Throws with statusCode 404 if the resource does not match this actor.
   */
  static getWebFingerData(resource: string): WebFingerData {
    const siteUrl = getSiteUrl()
    const username = process.env.ACTIVITYPUB_ACTOR_USERNAME ?? 'kuray'
    const domain = new URL(siteUrl).hostname
    const expectedAcct = `acct:${username}@${domain}`
    const actorUrl = getActorUrl()

    if (resource !== expectedAcct && resource !== actorUrl) {
      throw Object.assign(new Error('Resource not found'), { statusCode: 404 })
    }

    return {
      subject: expectedAcct,
      aliases: [actorUrl],
      links: [
        { rel: 'self', type: 'application/activity+json', href: actorUrl },
        { rel: 'http://webfinger.net/rel/profile-page', type: 'text/html', href: siteUrl },
      ],
    }
  }

  // ── Outbox ─────────────────────────────────────────────────────────

  /** Returns the outbox OrderedCollection summary (no items, just totals and links). */
  static async getOutboxCollection(): Promise<OutboxCollection> {
    const outboxUrl = getOutboxUrl()
    const total = await prisma.post.count({ where: { status: 'PUBLISHED', deletedAt: null } })

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: outboxUrl,
      type: 'OrderedCollection',
      totalItems: total,
      first: `${outboxUrl}?page=true`,
      last: `${outboxUrl}?page=true&p=${Math.max(0, Math.ceil(total / OUTBOX_PAGE_SIZE) - 1)}`,
    }
  }

  /** Returns a paginated OrderedCollectionPage of Create(Article) activities. */
  static async getOutboxPage(pageNum: number): Promise<OutboxCollectionPage> {
    const siteUrl = getSiteUrl()
    const actorUrl = getActorUrl()
    const outboxUrl = getOutboxUrl()
    const followersUrl = getFollowersUrl()

    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
        where: { status: 'PUBLISHED', deletedAt: null },
        orderBy: { publishedAt: 'desc' },
        skip: pageNum * OUTBOX_PAGE_SIZE,
        take: OUTBOX_PAGE_SIZE,
        select: {
          title: true,
          content: true,
          description: true,
          slug: true,
          publishedAt: true,
          category: { select: { slug: true } },
        },
      }),
      prisma.post.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
    ])

    const totalPages = Math.ceil(total / OUTBOX_PAGE_SIZE)

    const orderedItems = posts.map((post) => {
      const catSlug = post.category?.slug ?? 'blog'
      const postUrl = `${siteUrl}/en/blog/${catSlug}/${post.slug}`
      const published = (post.publishedAt ?? new Date()).toISOString()

      return {
        id: `${postUrl}#create`,
        type: 'Create',
        actor: actorUrl,
        published,
        to: [AP_PUBLIC_AUDIENCE],
        cc: [followersUrl],
        object: {
          id: `${postUrl}#article`,
          type: 'Article',
          attributedTo: actorUrl,
          name: post.title,
          content: post.content,
          summary: post.description ?? undefined,
          url: postUrl,
          published,
          to: [AP_PUBLIC_AUDIENCE],
          cc: [followersUrl],
        },
      }
    })

    const page: OutboxCollectionPage = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${outboxUrl}?page=true&p=${pageNum}`,
      type: 'OrderedCollectionPage',
      partOf: outboxUrl,
      totalItems: total,
      orderedItems,
    }

    if (pageNum > 0) page.prev = `${outboxUrl}?page=true&p=${pageNum - 1}`
    if (pageNum < totalPages - 1) page.next = `${outboxUrl}?page=true&p=${pageNum + 1}`

    return page
  }

  // ── NodeInfo ───────────────────────────────────────────────────────

  /** Returns the NodeInfo 2.1 document data for this server. */
  static async getNodeInfoData(): Promise<NodeInfoData> {
    const localPosts = await prisma.post.count({ where: { status: 'PUBLISHED', deletedAt: null } })

    return {
      version: '2.1',
      software: {
        name: 'kuray-dev-blog',
        version: process.env.npm_package_version ?? '1.0.0',
        homepage: getSiteUrl(),
      },
      protocols: ['activitypub'],
      usage: {
        users: { total: 1, activeMonth: 1, activeHalfyear: 1 },
        localPosts,
      },
      openRegistrations: false,
      metadata: {
        nodeName: process.env.ACTIVITYPUB_ACTOR_DISPLAY_NAME ?? 'Kuray',
        nodeDescription: process.env.ACTIVITYPUB_ACTOR_SUMMARY ?? 'Personal blog',
      },
    }
  }
}
