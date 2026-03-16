import { prisma } from '@/libs/prisma'
import Logger from '@/libs/logger'
import { AP_CONTEXT, AP_PUBLIC_AUDIENCE, APArticle, APCreateActivity, APUpdateActivity } from '@/types/common/ActivityPubTypes'
import { getSiteUrl, getActorUrl, getFollowersUrl } from './config'
import HttpSignatureService from './HttpSignatureService'

export default class DeliveryService {
  /** Delivers a single ActivityPub activity to a remote inbox URL. */
  static async deliverActivity(activity: Record<string, unknown>, inboxUrl: string): Promise<void> {
    const body = JSON.stringify(activity)
    const signedHeaders = HttpSignatureService.buildSignedHeaders(inboxUrl, body)

    const res = await fetch(inboxUrl, { method: 'POST', body, headers: signedHeaders })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Delivery to ${inboxUrl} failed: ${res.status} ${text}`)
    }
  }

  /** Fans out an activity to all accepted followers, deduplicating by sharedInbox. */
  static async broadcastToFollowers(activity: Record<string, unknown>): Promise<void> {
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

    const siteUrl = getSiteUrl()
    const actorUrl = getActorUrl()
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
      cc: [getFollowersUrl()],
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
      cc: [getFollowersUrl()],
      object: article,
    }

    Logger.info(`[ActivityPub] Broadcasting new post to ${followerCount} follower(s): "${post.title}"`)
    await this.broadcastToFollowers(createActivity as unknown as Record<string, unknown>)
  }

  /**
   * Creates and broadcasts an Update(Article) activity for an edited published post.
   * Call this whenever a PUBLISHED post's content is updated.
   */
  static async notifyFollowersOfPostUpdate(post: {
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

    const siteUrl = getSiteUrl()
    const actorUrl = getActorUrl()
    const categorySlug = post.category?.slug ?? 'blog'
    const postUrl = `${siteUrl}/en/blog/${categorySlug}/${post.slug}`
    const published = (post.publishedAt ?? new Date()).toISOString()
    const updatedAt = new Date().toISOString()

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
      cc: [getFollowersUrl()],
      tag: post.keywords.map((kw) => ({
        type: 'Hashtag' as const,
        href: `${siteUrl}/tag/${encodeURIComponent(kw.toLowerCase())}`,
        name: `#${kw}`,
      })),
    }

    const updateActivity: APUpdateActivity = {
      '@context': AP_CONTEXT,
      id: `${postUrl}#update-${Date.now()}`,
      type: 'Update',
      actor: actorUrl,
      published: updatedAt,
      to: [AP_PUBLIC_AUDIENCE],
      cc: [getFollowersUrl()],
      object: article,
    }

    Logger.info(`[ActivityPub] Broadcasting Update to ${followerCount} follower(s): "${post.title}"`)
    await this.broadcastToFollowers(updateActivity as unknown as Record<string, unknown>)
  }

  /**
   * Creates and broadcasts a Delete activity for a removed or unpublished post.
   * Call this whenever a PUBLISHED post is deleted or its status leaves PUBLISHED.
   */
  static async notifyFollowersOfPostDelete(post: {
    slug: string
    category?: { slug: string } | null
  }): Promise<void> {
    const followerCount = await prisma.activityPubFollower.count({ where: { accepted: true } })
    if (followerCount === 0) return

    const siteUrl = getSiteUrl()
    const actorUrl = getActorUrl()
    const categorySlug = post.category?.slug ?? 'blog'
    const postUrl = `${siteUrl}/en/blog/${categorySlug}/${post.slug}`

    const deleteActivity = {
      '@context': AP_CONTEXT,
      id: `${postUrl}#delete-${Date.now()}`,
      type: 'Delete',
      actor: actorUrl,
      to: [AP_PUBLIC_AUDIENCE],
      cc: [getFollowersUrl()],
      object: {
        id: postUrl,
        type: 'Tombstone',
      },
    }

    Logger.info(`[ActivityPub] Broadcasting Delete to ${followerCount} follower(s): "${postUrl}"`)
    await this.broadcastToFollowers(deleteActivity as unknown as Record<string, unknown>)
  }
}
