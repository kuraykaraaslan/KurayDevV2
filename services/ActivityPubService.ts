import { createHash, createSign, createVerify } from 'node:crypto'
import { prisma } from '@/libs/prisma'
import redisInstance from '@/libs/redis'
import Logger from '@/libs/logger'
import ActivityPubMessages from '@/messages/ActivityPubMessages'
import {
  AP_CONTEXT,
  AP_PUBLIC_AUDIENCE,
  APActor,
  APArticle,
  APCreateActivity,
  APFollowActivity,
  APAcceptActivity,
  ActivityPubFollower,
} from '@/types/common/ActivityPubTypes'

// ── Exported interfaces ────────────────────────────────────────────────

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

// ── Service ────────────────────────────────────────────────────────────

export default class ActivityPubService {
  private static readonly ACTOR_CACHE_TTL = 60 * 60 * 24 // 24 hours
  private static readonly OUTBOX_PAGE_SIZE = 20

  // ── Config ─────────────────────────────────────────────────────────

  private static getSiteUrl(): string {
    const url = process.env.NEXT_PUBLIC_SITE_URL
    if (!url) throw new Error(ActivityPubMessages.SITE_URL_MISSING)
    return url.replace(/\/$/, '')
  }

  private static getPrivateKey(): string {
    const key = process.env.ACTIVITYPUB_PRIVATE_KEY
    if (!key) throw new Error(ActivityPubMessages.PRIVATE_KEY_MISSING)
    return key.replace(/\\n/g, '\n')
  }

  private static getPublicKeyPem(): string {
    const key = process.env.ACTIVITYPUB_PUBLIC_KEY
    if (!key) throw new Error(ActivityPubMessages.PUBLIC_KEY_MISSING)
    return key.replace(/\\n/g, '\n')
  }

  // ── URL builders ───────────────────────────────────────────────────

  /** Returns the canonical actor URL for the blog account. */
  static getActorUrl(): string {
    return `${this.getSiteUrl()}/api/activitypub/actor`
  }

  private static getKeyId(): string {
    return `${this.getActorUrl()}#main-key`
  }

  private static getInboxUrl(): string {
    return `${this.getSiteUrl()}/api/activitypub/inbox`
  }

  private static getOutboxUrl(): string {
    return `${this.getSiteUrl()}/api/activitypub/outbox`
  }

  private static getFollowersUrl(): string {
    return `${this.getSiteUrl()}/api/activitypub/followers`
  }

  private static getFollowingUrl(): string {
    return `${this.getSiteUrl()}/api/activitypub/following`
  }

  // ── HTTP Signature ─────────────────────────────────────────────────

  /**
   * Signs an outgoing POST request with an RSA-SHA256 HTTP Signature.
   * Returns the headers to merge into the fetch call.
   */
  private static buildSignedHeaders(targetUrl: string, bodyJson: string): Record<string, string> {
    const url = new URL(targetUrl)
    const date = new Date().toUTCString()
    const digest = `SHA-256=${createHash('sha256').update(bodyJson).digest('base64')}`
    const path = url.pathname + url.search

    const signingString = [
      `(request-target): post ${path}`,
      `host: ${url.host}`,
      `date: ${date}`,
      `digest: ${digest}`,
    ].join('\n')

    const signer = createSign('RSA-SHA256')
    signer.update(signingString)
    const signature = signer.sign(this.getPrivateKey(), 'base64')

    const signatureHeader = [
      `keyId="${this.getKeyId()}"`,
      `algorithm="rsa-sha256"`,
      `headers="(request-target) host date digest"`,
      `signature="${signature}"`,
    ].join(',')

    return {
      Host: url.host,
      Date: date,
      Digest: digest,
      Signature: signatureHeader,
      'Content-Type': 'application/activity+json',
    }
  }

  /**
   * Verifies an incoming HTTP Signature from a remote ActivityPub server.
   * Returns true if valid, false otherwise. Logs warnings but never throws.
   */
  static async verifyHttpSignature(
    method: string,
    path: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<boolean> {
    const signatureHeader = headers['signature']
    if (!signatureHeader || typeof signatureHeader !== 'string') {
      Logger.warn('[ActivityPub] Missing Signature header')
      return false
    }

    const parts: Record<string, string> = {}
    for (const part of signatureHeader.split(',')) {
      const eq = part.indexOf('=')
      if (eq === -1) continue
      const k = part.slice(0, eq).trim()
      const v = part.slice(eq + 1).trim().replace(/^"(.*)"$/, '$1')
      parts[k] = v
    }

    const { keyId, headers: signedHeaders = 'date', signature } = parts
    if (!keyId || !signature) {
      Logger.warn('[ActivityPub] Signature header missing keyId or signature')
      return false
    }

    let publicKeyPem: string
    try {
      const actor = await this.fetchRemoteActor(keyId.split('#')[0])
      publicKeyPem = actor.publicKey?.publicKeyPem ?? ''
      if (!publicKeyPem) {
        Logger.warn(`[ActivityPub] Remote actor has no publicKey: ${keyId}`)
        return false
      }
    } catch (err) {
      Logger.warn(`[ActivityPub] Failed to fetch remote actor for signature verification: ${keyId} — ${String(err)}`)
      return false
    }

    const signingParts = signedHeaders.split(' ').map((h) => {
      if (h === '(request-target)') return `(request-target): ${method.toLowerCase()} ${path}`
      const v = headers[h.toLowerCase()]
      return `${h}: ${Array.isArray(v) ? v[0] : (v ?? '')}`
    })

    try {
      const verifier = createVerify('RSA-SHA256')
      verifier.update(signingParts.join('\n'))
      return verifier.verify(publicKeyPem, signature, 'base64')
    } catch {
      Logger.warn(`[ActivityPub] Signature verification threw for keyId: ${keyId}`)
      return false
    }
  }

  // ── Actor JSON ─────────────────────────────────────────────────────

  /** Returns the JSON-LD actor object for the blog account. */
  static getActorJson() {
    const siteUrl = this.getSiteUrl()
    const actorUrl = this.getActorUrl()
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
      inbox: this.getInboxUrl(),
      outbox: this.getOutboxUrl(),
      followers: this.getFollowersUrl(),
      following: this.getFollowingUrl(),
      icon: { type: 'Image', mediaType: 'image/jpeg', url: avatarUrl },
      endpoints: { sharedInbox: this.getInboxUrl() },
      publicKey: {
        id: this.getKeyId(),
        owner: actorUrl,
        publicKeyPem: this.getPublicKeyPem(),
      },
    }
  }

  // ── Remote actor cache ─────────────────────────────────────────────

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
    await redisInstance.setex(cacheKey, this.ACTOR_CACHE_TTL, JSON.stringify(actor))
    return actor
  }

  // ── Activity delivery ──────────────────────────────────────────────

  /** Delivers a single ActivityPub activity to a remote inbox URL. */
  private static async deliverActivity(
    activity: Record<string, unknown>,
    inboxUrl: string
  ): Promise<void> {
    const body = JSON.stringify(activity)
    const signedHeaders = this.buildSignedHeaders(inboxUrl, body)

    const res = await fetch(inboxUrl, { method: 'POST', body, headers: signedHeaders })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Delivery to ${inboxUrl} failed: ${res.status} ${text}`)
    }
  }

  /** Fans out an activity to all accepted followers, deduplicating by sharedInbox. */
  private static async broadcastToFollowers(activity: Record<string, unknown>): Promise<void> {
    const followers = await prisma.activityPubFollower.findMany({
      where: { accepted: true },
      select: { inbox: true, sharedInbox: true },
    })

    const inboxSet = new Set<string>()
    for (const f of followers) inboxSet.add(f.sharedInbox ?? f.inbox)

    let failureCount = 0
    for (const inboxUrl of inboxSet) {
      try {
        await this.deliverActivity(activity, inboxUrl)
      } catch (err) {
        failureCount++
        Logger.error(`[ActivityPub] Delivery failed to ${inboxUrl}: ${String(err)}`)
      }
    }

    if (failureCount > 0) {
      Logger.warn(`[ActivityPub] ${failureCount} delivery failure(s) during broadcast`)
    }
  }

  // ── Inbox handlers ─────────────────────────────────────────────────

  /** Handles an incoming Follow activity. Stores the follower and sends Accept. */
  private static async handleFollow(activity: APFollowActivity): Promise<void> {
    const actorUrl = typeof activity.actor === 'string'
      ? activity.actor
      : (activity.actor as { id: string }).id

    let remoteActor: APActor
    try {
      remoteActor = await this.fetchRemoteActor(actorUrl)
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
      id: `${this.getActorUrl()}#accept-${Date.now()}`,
      type: 'Accept',
      actor: this.getActorUrl(),
      object: activity,
    }

    try {
      await this.deliverActivity(accept as unknown as Record<string, unknown>, inbox)
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

  // ── Post notification ──────────────────────────────────────────────

  /**
   * Creates and broadcasts a Create(Article) activity for a newly published post.
   * Call this whenever a post's status transitions to PUBLISHED.
   */
  static async notifyFollowersOfPost(post: {
    postId: string
    title: string
    content: string
    description?: string | null
    slug: string
    keywords: string[]
    publishedAt?: Date | null
    category?: { slug: string } | null
  }): Promise<void> {
    const followerCount = await prisma.activityPubFollower.count({ where: { accepted: true } })
    if (followerCount === 0) return

    const siteUrl = this.getSiteUrl()
    const actorUrl = this.getActorUrl()
    const categorySlug = post.category?.slug ?? 'blog'
    const postUrl = `${siteUrl}/en/blog/${categorySlug}/${post.slug}`
    const published = (post.publishedAt ?? new Date()).toISOString()

    const article: APArticle = {
      id: `${postUrl}#article`,
      type: 'Article',
      attributedTo: actorUrl,
      name: post.title,
      content: post.content,
      summary: post.description ?? undefined,
      url: postUrl,
      published,
      to: [AP_PUBLIC_AUDIENCE],
      cc: [this.getFollowersUrl()],
      tag: post.keywords.map((kw) => ({
        type: 'Hashtag' as const,
        href: `${siteUrl}/tag/${encodeURIComponent(kw.toLowerCase())}`,
        name: `#${kw}`,
      })),
    }

    const createActivity: APCreateActivity = {
      '@context': AP_CONTEXT,
      id: `${postUrl}#create`,
      type: 'Create',
      actor: actorUrl,
      published,
      to: [AP_PUBLIC_AUDIENCE],
      cc: [this.getFollowersUrl()],
      object: article,
    }

    Logger.info(`[ActivityPub] Broadcasting new post to ${followerCount} follower(s): "${post.title}"`)
    await this.broadcastToFollowers(createActivity as unknown as Record<string, unknown>)
  }

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
    const siteUrl = this.getSiteUrl()
    const username = process.env.ACTIVITYPUB_ACTOR_USERNAME ?? 'kuray'
    const domain = new URL(siteUrl).hostname
    const expectedAcct = `acct:${username}@${domain}`
    const actorUrl = this.getActorUrl()

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
    const outboxUrl = this.getOutboxUrl()
    const total = await prisma.post.count({ where: { status: 'PUBLISHED', deletedAt: null } })

    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: outboxUrl,
      type: 'OrderedCollection',
      totalItems: total,
      first: `${outboxUrl}?page=true`,
      last: `${outboxUrl}?page=true&p=${Math.max(0, Math.ceil(total / this.OUTBOX_PAGE_SIZE) - 1)}`,
    }
  }

  /** Returns a paginated OrderedCollectionPage of Create(Article) activities. */
  static async getOutboxPage(pageNum: number): Promise<OutboxCollectionPage> {
    const siteUrl = this.getSiteUrl()
    const actorUrl = this.getActorUrl()
    const outboxUrl = this.getOutboxUrl()
    const followersUrl = this.getFollowersUrl()

    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
        where: { status: 'PUBLISHED', deletedAt: null },
        orderBy: { publishedAt: 'desc' },
        skip: pageNum * this.OUTBOX_PAGE_SIZE,
        take: this.OUTBOX_PAGE_SIZE,
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

    const totalPages = Math.ceil(total / this.OUTBOX_PAGE_SIZE)

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
        homepage: this.getSiteUrl(),
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
