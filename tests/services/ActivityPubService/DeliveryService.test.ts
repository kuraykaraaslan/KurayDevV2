jest.mock('@/libs/prisma', () => ({
  prisma: {
    activityPubFollower: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

jest.mock('@/services/ActivityPubService/HttpSignatureService', () => ({
  __esModule: true,
  default: {
    buildSignedHeaders: jest.fn().mockReturnValue({
      Date: new Date().toUTCString(),
      Signature: 'sig',
      Host: 'localhost',
      Digest: 'SHA-256=ZmFrZQ==',
      'Content-Type': 'application/activity+json',
    }),
  },
}))

import DeliveryService from '@/services/ActivityPubService/DeliveryService'
import { prisma } from '@/libs/prisma'

const prismaMock = prisma as any

describe('DeliveryService', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(''),
    }) as any
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  describe('broadcastToFollowers', () => {
    it('deduplicates shared inbox targets to prevent duplicate flush', async () => {
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox/alice', sharedInbox: 'https://server-a/inbox/shared' },
        { inbox: 'https://server-a/inbox/bob', sharedInbox: 'https://server-a/inbox/shared' },
        { inbox: 'https://server-b/inbox/carol', sharedInbox: null },
      ])

      await DeliveryService.broadcastToFollowers({ type: 'Create' })

      expect(global.fetch).toHaveBeenCalledTimes(2)

      const calledUrls = (global.fetch as jest.Mock).mock.calls.map((c) => c[0])
      expect(calledUrls).toEqual(
        expect.arrayContaining(['https://server-a/inbox/shared', 'https://server-b/inbox/carol'])
      )
    })

    it('continues broadcasting when one inbox delivery fails', async () => {
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox/alice', sharedInbox: null },
        { inbox: 'https://server-b/inbox/bob', sharedInbox: null },
      ])

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 500, text: jest.fn().mockResolvedValue('fail') })
        .mockResolvedValueOnce({ ok: true, text: jest.fn().mockResolvedValue('') })

      await expect(DeliveryService.broadcastToFollowers({ type: 'Create' })).resolves.toBeUndefined()
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })
})

// ── Phase 22: DeliveryService ActivityPub extensions ─────────────────────


describe('DeliveryService — Phase 22 ActivityPub extensions', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(''),
    }) as any
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  // ── deliverActivity: unreachable host ─────────────────────────────────
  describe('deliverActivity — unreachable host', () => {
    it('throws when fetch rejects (network error / unreachable host)', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('ECONNREFUSED'))

      await expect(
        DeliveryService.deliverActivity({ type: 'Create' }, 'https://unreachable.example/inbox')
      ).rejects.toThrow('ECONNREFUSED')
    })

    it('throws with delivery error message when remote returns non-ok status', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: jest.fn().mockResolvedValue('Service Unavailable'),
      })

      await expect(
        DeliveryService.deliverActivity({ type: 'Create' }, 'https://remote.example/inbox')
      ).rejects.toThrow('Delivery to https://remote.example/inbox failed: 503')
    })

    it('throws with delivery error message when remote returns 404', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue('Not Found'),
      })

      await expect(
        DeliveryService.deliverActivity({ type: 'Create' }, 'https://remote.example/inbox')
      ).rejects.toThrow('Delivery to https://remote.example/inbox failed: 404')
    })

    it('still throws with status when res.text() itself rejects (error body unreadable)', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: jest.fn().mockRejectedValue(new Error('stream closed')),
      })

      await expect(
        DeliveryService.deliverActivity({ type: 'Create' }, 'https://remote.example/inbox')
      ).rejects.toThrow('Delivery to https://remote.example/inbox failed: 502')
    })
  })

  // ── deliverActivity: successful delivery ─────────────────────────────
  describe('deliverActivity — successful delivery', () => {
    it('resolves without error on 200 OK response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      })

      await expect(
        DeliveryService.deliverActivity({ type: 'Create', id: 'https://site/post#create' }, 'https://remote.example/inbox')
      ).resolves.not.toThrow()

      expect(global.fetch).toHaveBeenCalledWith(
        'https://remote.example/inbox',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('sends the activity body as JSON in the request', async () => {
      const activity = { type: 'Create', id: 'https://site/post#create', actor: 'https://site/actor' }

      await DeliveryService.deliverActivity(activity, 'https://remote.example/inbox')

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      expect(fetchCall[1].body).toBe(JSON.stringify(activity))
    })
  })

  // ── broadcastToFollowers: no followers ───────────────────────────────
  describe('broadcastToFollowers — empty follower list', () => {
    it('does not call fetch when there are no accepted followers', async () => {
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([])

      await DeliveryService.broadcastToFollowers({ type: 'Create' })

      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  // ── broadcastToFollowers: all deliveries fail ─────────────────────────
  describe('broadcastToFollowers — all deliveries fail', () => {
    it('resolves without throwing even when every inbox delivery fails', async () => {
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
        { inbox: 'https://server-b/inbox', sharedInbox: null },
      ])

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('error'),
      })

      await expect(
        DeliveryService.broadcastToFollowers({ type: 'Create' })
      ).resolves.not.toThrow()

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })
})

// ── notifyFollowersOfPost / notifyFollowersOfPostUpdate / notifyFollowersOfPostDelete ──

describe('DeliveryService — notify follower methods', () => {
  const originalFetch = global.fetch

  // Set a deterministic NEXT_PUBLIC_SITE_URL so URL assertions are stable.
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
  })

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(''),
    }) as any
  })

  afterAll(() => {
    global.fetch = originalFetch
    delete process.env.NEXT_PUBLIC_SITE_URL
  })

  // ── Fixtures ──────────────────────────────────────────────────────────────

  const SAMPLE_POST = {
    postId: 'post-001',
    title: 'Hello World',
    content: '<p>My first post</p>',
    description: 'A brief intro',
    slug: 'hello-world',
    keywords: ['typescript', 'testing'],
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    category: { slug: 'dev' },
  }

  // ── notifyFollowersOfPost ──────────────────────────────────────────────────

  describe('notifyFollowersOfPost', () => {
    it('does nothing when there are no accepted followers', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(0)

      await DeliveryService.notifyFollowersOfPost(SAMPLE_POST)

      expect(global.fetch).not.toHaveBeenCalled()
      // findMany is called by broadcastToFollowers — it should never be reached.
      expect(prismaMock.activityPubFollower.findMany).not.toHaveBeenCalled()
    })

    it('broadcasts a Create activity when followers exist', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(2)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
        { inbox: 'https://server-b/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPost(SAMPLE_POST)

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('sends a Create activity with type="Create" and embedded Article object', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPost(SAMPLE_POST)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      expect(body.type).toBe('Create')
      expect(body.object.type).toBe('Article')
      expect(body.object.name).toBe('Hello World')
    })

    it('uses the category slug in the post URL', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPost(SAMPLE_POST)

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.object.url).toContain('/en/blog/dev/hello-world')
    })

    it('falls back to "blog" category slug when category is null', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPost({ ...SAMPLE_POST, category: null })

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.object.url).toContain('/en/blog/blog/hello-world')
    })

    it('maps keywords to Hashtag tags in the article', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPost(SAMPLE_POST)

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      const tags: any[] = body.object.tag
      expect(tags).toHaveLength(2)
      expect(tags[0].type).toBe('Hashtag')
      expect(tags[0].name).toBe('#typescript')
      expect(tags[1].name).toBe('#testing')
    })

    it('falls back to current date when publishedAt is null', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      // Should not throw even without publishedAt.
      await expect(
        DeliveryService.notifyFollowersOfPost({ ...SAMPLE_POST, publishedAt: null })
      ).resolves.not.toThrow()
    })

    it('uses description as summary when provided', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPost(SAMPLE_POST)

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.object.summary).toBe('A brief intro')
    })

    it('does not include summary field when description is null', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPost({ ...SAMPLE_POST, description: null })

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      // summary should be undefined when description is null.
      expect(body.object.summary).toBeUndefined()
    })
  })

  // ── notifyFollowersOfPostUpdate ────────────────────────────────────────────

  describe('notifyFollowersOfPostUpdate', () => {
    it('does nothing when there are no accepted followers', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(0)

      await DeliveryService.notifyFollowersOfPostUpdate(SAMPLE_POST)

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('broadcasts an Update activity when followers exist', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPostUpdate(SAMPLE_POST)

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('sends an Update activity with type="Update" and embedded Article object', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPostUpdate(SAMPLE_POST)

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.type).toBe('Update')
      expect(body.object.type).toBe('Article')
      expect(body.object.name).toBe('Hello World')
    })

    it('includes the correct post URL with category slug', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPostUpdate(SAMPLE_POST)

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.object.url).toContain('/en/blog/dev/hello-world')
    })

    it('falls back to "blog" category slug when category is null', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPostUpdate({ ...SAMPLE_POST, category: null })

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.object.url).toContain('/en/blog/blog/hello-world')
    })

    it('maps keywords to Hashtag tags in the article', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPostUpdate(SAMPLE_POST)

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.object.tag).toHaveLength(2)
      expect(body.object.tag[0].type).toBe('Hashtag')
    })

    it('falls back to current date when publishedAt is null', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await expect(
        DeliveryService.notifyFollowersOfPostUpdate({ ...SAMPLE_POST, publishedAt: null })
      ).resolves.not.toThrow()
    })

    it('id of the Update activity contains "#update-" to distinguish revisions', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPostUpdate(SAMPLE_POST)

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.id).toContain('#update-')
    })
  })

  // ── notifyFollowersOfPostDelete ────────────────────────────────────────────

  describe('notifyFollowersOfPostDelete', () => {
    it('does nothing when there are no accepted followers', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(0)

      await DeliveryService.notifyFollowersOfPostDelete({ slug: 'hello-world', category: { slug: 'dev' } })

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('broadcasts a Delete activity when followers exist', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPostDelete({ slug: 'hello-world', category: { slug: 'dev' } })

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('sends a Delete activity with type="Delete" and a Tombstone object', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPostDelete({ slug: 'hello-world', category: { slug: 'dev' } })

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.type).toBe('Delete')
      expect(body.object.type).toBe('Tombstone')
    })

    it('tombstone id matches the post URL constructed from slug and category', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPostDelete({ slug: 'hello-world', category: { slug: 'dev' } })

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.object.id).toContain('/en/blog/dev/hello-world')
    })

    it('falls back to "blog" category slug when category is null', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPostDelete({ slug: 'hello-world', category: null })

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.object.id).toContain('/en/blog/blog/hello-world')
    })

    it('id of the Delete activity contains "#delete-" to distinguish it', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(1)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPostDelete({ slug: 'hello-world', category: { slug: 'dev' } })

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.id).toContain('#delete-')
    })

    it('fans out to multiple followers via broadcastToFollowers', async () => {
      prismaMock.activityPubFollower.count.mockResolvedValueOnce(3)
      prismaMock.activityPubFollower.findMany.mockResolvedValueOnce([
        { inbox: 'https://server-a/inbox', sharedInbox: null },
        { inbox: 'https://server-b/inbox', sharedInbox: null },
        { inbox: 'https://server-c/inbox', sharedInbox: null },
      ])

      await DeliveryService.notifyFollowersOfPostDelete({ slug: 'hello-world', category: { slug: 'dev' } })

      expect(global.fetch).toHaveBeenCalledTimes(3)
    })
  })
})
