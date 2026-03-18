// Mock all dependencies before imports
jest.mock('@/libs/prisma', () => ({
  prisma: {
    activityPubFollower: {
      findMany: jest.fn(),
      count:    jest.fn(),
    },
    post: {
      count:    jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/services/ActivityPubService/ActorService', () => ({
  __esModule: true,
  default: {
    getActorJson:      jest.fn(),
    fetchRemoteActor:  jest.fn(),
  },
}))

jest.mock('@/services/ActivityPubService/HttpSignatureService', () => ({
  __esModule: true,
  default: {
    verifyHttpSignature: jest.fn(),
  },
}))

jest.mock('@/services/ActivityPubService/InboxService', () => ({
  __esModule: true,
  default: {
    handleInboxActivity: jest.fn(),
  },
}))

jest.mock('@/services/ActivityPubService/DeliveryService', () => ({
  __esModule: true,
  default: {
    notifyFollowersOfPost:       jest.fn(),
    notifyFollowersOfPostUpdate: jest.fn(),
    notifyFollowersOfPostDelete: jest.fn(),
  },
}))

jest.mock('@/services/ActivityPubService/config', () => ({
  getSiteUrl:      jest.fn().mockReturnValue('https://example.com'),
  getActorUrl:     jest.fn().mockReturnValue('https://example.com/api/activitypub/actor'),
  getOutboxUrl:    jest.fn().mockReturnValue('https://example.com/api/activitypub/outbox'),
  getFollowersUrl: jest.fn().mockReturnValue('https://example.com/api/activitypub/followers'),
  getFollowingUrl: jest.fn().mockReturnValue('https://example.com/api/activitypub/following'),
  getInboxUrl:     jest.fn().mockReturnValue('https://example.com/api/activitypub/inbox'),
}))

import ActivityPubService from '@/services/ActivityPubService'
import { prisma } from '@/libs/prisma'

const prismaMock = prisma as jest.Mocked<typeof prisma>

const FOLLOWER = {
  id: 'f1',
  actorUrl: 'https://mastodon.social/users/alice',
  accepted: true,
  inboxUrl: 'https://mastodon.social/users/alice/inbox',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('ActivityPubService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
    process.env.ACTIVITYPUB_ACTOR_USERNAME = 'testuser'
  })

  // ── getFollowers ──────────────────────────────────────────────────────────
  describe('getFollowers', () => {
    it('returns all accepted followers', async () => {
      ;(prismaMock.activityPubFollower.findMany as jest.Mock).mockResolvedValueOnce([FOLLOWER])
      const followers = await ActivityPubService.getFollowers()
      expect(followers).toHaveLength(1)
      expect(followers[0].actorUrl).toBe('https://mastodon.social/users/alice')
    })

    it('returns empty array when no followers', async () => {
      ;(prismaMock.activityPubFollower.findMany as jest.Mock).mockResolvedValueOnce([])
      const followers = await ActivityPubService.getFollowers()
      expect(followers).toEqual([])
    })
  })

  // ── getFollowerCount ──────────────────────────────────────────────────────
  describe('getFollowerCount', () => {
    it('returns the total number of accepted followers', async () => {
      ;(prismaMock.activityPubFollower.count as jest.Mock).mockResolvedValueOnce(42)
      const count = await ActivityPubService.getFollowerCount()
      expect(count).toBe(42)
    })
  })

  // ── getWebFingerData ──────────────────────────────────────────────────────
  describe('getWebFingerData', () => {
    it('returns WebFinger JRD for matching acct: resource', () => {
      const data = ActivityPubService.getWebFingerData('acct:testuser@example.com')
      expect(data.subject).toBe('acct:testuser@example.com')
      expect(data.links).toHaveLength(2)
      expect(data.links[0].rel).toBe('self')
    })

    it('returns WebFinger JRD for matching actor URL resource', () => {
      const actorUrl = 'https://example.com/api/activitypub/actor'
      const data = ActivityPubService.getWebFingerData(actorUrl)
      expect(data.aliases).toContain(actorUrl)
    })

    it('throws 404 error for unknown resource', () => {
      expect(() => ActivityPubService.getWebFingerData('acct:unknown@other.com')).toThrow()
    })

    it('thrown error has statusCode 404', () => {
      try {
        ActivityPubService.getWebFingerData('acct:nobody@other.com')
      } catch (err: any) {
        expect(err.statusCode).toBe(404)
      }
    })
  })

  // ── getOutboxCollection ───────────────────────────────────────────────────
  describe('getOutboxCollection', () => {
    it('returns OrderedCollection with correct totalItems and URL structure', async () => {
      ;(prismaMock.post.count as jest.Mock).mockResolvedValueOnce(25)
      const col = await ActivityPubService.getOutboxCollection()
      expect(col.type).toBe('OrderedCollection')
      expect(col.totalItems).toBe(25)
      expect(col.first).toContain('page=true')
      expect(col.last).toContain('page=true')
    })

    it('sets last page to 0 when no posts', async () => {
      ;(prismaMock.post.count as jest.Mock).mockResolvedValueOnce(0)
      const col = await ActivityPubService.getOutboxCollection()
      expect(col.totalItems).toBe(0)
      expect(col.last).toContain('p=0')
    })
  })

  // ── getOutboxPage ─────────────────────────────────────────────────────────
  describe('getOutboxPage', () => {
    const POST = {
      title: 'Hello World',
      content: '<p>Test</p>',
      description: 'A test post',
      slug: 'hello-world',
      publishedAt: new Date('2026-01-01'),
      category: { slug: 'tech' },
    }

    it('returns OrderedCollectionPage with mapped Create(Article) activities', async () => {
      ;(prismaMock.$transaction as jest.Mock).mockResolvedValueOnce([[POST], 1])
      const page = await ActivityPubService.getOutboxPage(0)
      expect(page.type).toBe('OrderedCollectionPage')
      expect(page.orderedItems).toHaveLength(1)
      expect((page.orderedItems[0] as any).type).toBe('Create')
    })

    it('includes prev link when page > 0', async () => {
      ;(prismaMock.$transaction as jest.Mock).mockResolvedValueOnce([[POST, POST], 40])
      const page = await ActivityPubService.getOutboxPage(1)
      expect(page.prev).toBeDefined()
    })

    it('includes next link when not on last page', async () => {
      ;(prismaMock.$transaction as jest.Mock).mockResolvedValueOnce([[POST, POST], 40])
      const page = await ActivityPubService.getOutboxPage(0)
      expect(page.next).toBeDefined()
    })

    it('falls back to "blog" category slug when no category', async () => {
      const postNoCategory = { ...POST, category: null }
      ;(prismaMock.$transaction as jest.Mock).mockResolvedValueOnce([[postNoCategory], 1])
      const page = await ActivityPubService.getOutboxPage(0)
      expect((page.orderedItems[0] as any).object.url).toContain('/blog/')
    })
  })

  // ── getNodeInfoData ───────────────────────────────────────────────────────
  describe('getNodeInfoData', () => {
    it('returns NodeInfo 2.1 document with correct structure', async () => {
      ;(prismaMock.post.count as jest.Mock).mockResolvedValueOnce(10)
      const info = await ActivityPubService.getNodeInfoData()
      expect(info.version).toBe('2.1')
      expect(info.protocols).toContain('activitypub')
      expect(info.usage.localPosts).toBe(10)
      expect(info.openRegistrations).toBe(false)
    })
  })
})
