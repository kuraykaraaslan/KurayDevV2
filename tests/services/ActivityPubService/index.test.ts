import { prisma } from '@/libs/prisma'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    activityPubFollower: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
      $transaction: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/services/ActivityPubService/ActorService', () => ({
  __esModule: true,
  default: {
    getActorJson: jest.fn(),
    fetchRemoteActor: jest.fn(),
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
    notifyFollowersOfPost: jest.fn(),
    notifyFollowersOfPostUpdate: jest.fn(),
    notifyFollowersOfPostDelete: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('ActivityPubService (facade)', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://kuray.dev'
    process.env.ACTIVITYPUB_PRIVATE_KEY = 'private-key'
    process.env.ACTIVITYPUB_PUBLIC_KEY = 'public-key-pem'
    delete process.env.ACTIVITYPUB_ACTOR_USERNAME
  })

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.ACTIVITYPUB_PRIVATE_KEY
    delete process.env.ACTIVITYPUB_PUBLIC_KEY
  })

  describe('getFollowers', () => {
    it('returns accepted followers from prisma', async () => {
      const followers = [
        { id: '1', actorUrl: 'https://remote.social/users/alice', inbox: 'https://remote.social/inbox', sharedInbox: null, accepted: true, createdAt: new Date() },
      ]
      ;(mockPrisma.activityPubFollower.findMany as jest.Mock).mockResolvedValue(followers)

      const ActivityPubService = (await import('@/services/ActivityPubService/index')).default
      const result = await ActivityPubService.getFollowers()

      expect(mockPrisma.activityPubFollower.findMany).toHaveBeenCalledWith({
        where: { accepted: true },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(followers)
    })
  })

  describe('getFollowerCount', () => {
    it('returns count of accepted followers', async () => {
      ;(mockPrisma.activityPubFollower.count as jest.Mock).mockResolvedValue(42)

      const ActivityPubService = (await import('@/services/ActivityPubService/index')).default
      const result = await ActivityPubService.getFollowerCount()

      expect(mockPrisma.activityPubFollower.count).toHaveBeenCalledWith({ where: { accepted: true } })
      expect(result).toBe(42)
    })
  })

  describe('getWebFingerData', () => {
    it('returns WebFinger JRD for acct: resource', async () => {
      const ActivityPubService = (await import('@/services/ActivityPubService/index')).default
      const result = ActivityPubService.getWebFingerData('acct:kuray@kuray.dev')

      expect(result.subject).toBe('acct:kuray@kuray.dev')
      expect(result.aliases).toContain('https://kuray.dev/api/activitypub/actor')
      expect(result.links).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ rel: 'self', type: 'application/activity+json' }),
        ])
      )
    })

    it('returns WebFinger JRD for actorUrl resource', async () => {
      const ActivityPubService = (await import('@/services/ActivityPubService/index')).default
      const result = ActivityPubService.getWebFingerData('https://kuray.dev/api/activitypub/actor')

      expect(result.subject).toBe('acct:kuray@kuray.dev')
    })

    it('throws 404 error for unknown resource', async () => {
      const ActivityPubService = (await import('@/services/ActivityPubService/index')).default

      expect(() => ActivityPubService.getWebFingerData('acct:unknown@other.com')).toThrow('Resource not found')
      try {
        ActivityPubService.getWebFingerData('acct:unknown@other.com')
      } catch (err: any) {
        expect(err.statusCode).toBe(404)
      }
    })
  })

  describe('getOutboxCollection', () => {
    it('returns OrderedCollection with totalItems and first/last links', async () => {
      ;(mockPrisma.post.count as jest.Mock).mockResolvedValue(25)

      const ActivityPubService = (await import('@/services/ActivityPubService/index')).default
      const result = await ActivityPubService.getOutboxCollection()

      expect(result.type).toBe('OrderedCollection')
      expect(result.totalItems).toBe(25)
      expect(result.first).toContain('page=true')
      expect(result.last).toContain('page=true')
      expect(result.id).toBe('https://kuray.dev/api/activitypub/outbox')
    })

    it('returns correct last page index', async () => {
      ;(mockPrisma.post.count as jest.Mock).mockResolvedValue(40)

      const ActivityPubService = (await import('@/services/ActivityPubService/index')).default
      const result = await ActivityPubService.getOutboxCollection()

      // 40 posts, page size 20, so 2 pages, last page = 1
      expect(result.last).toContain('p=1')
    })
  })

  describe('getOutboxPage', () => {
    const mockPosts = [
      {
        title: 'Test Post',
        content: '<p>Content</p>',
        description: 'Description',
        slug: 'test-post',
        publishedAt: new Date('2024-01-01'),
        category: { slug: 'tech' },
      },
    ]

    it('returns OrderedCollectionPage with orderedItems', async () => {
      ;(mockPrisma.$transaction as jest.Mock).mockResolvedValue([mockPosts, 1])

      const ActivityPubService = (await import('@/services/ActivityPubService/index')).default
      const result = await ActivityPubService.getOutboxPage(0)

      expect(result.type).toBe('OrderedCollectionPage')
      expect(result.orderedItems).toHaveLength(1)
      expect(result.orderedItems[0]).toMatchObject({
        type: 'Create',
        actor: 'https://kuray.dev/api/activitypub/actor',
      })
    })

    it('includes prev link when pageNum > 0', async () => {
      ;(mockPrisma.$transaction as jest.Mock).mockResolvedValue([mockPosts, 50])

      const ActivityPubService = (await import('@/services/ActivityPubService/index')).default
      const result = await ActivityPubService.getOutboxPage(2)

      expect(result.prev).toContain('p=1')
    })

    it('includes next link when more pages exist', async () => {
      ;(mockPrisma.$transaction as jest.Mock).mockResolvedValue([mockPosts, 50])

      const ActivityPubService = (await import('@/services/ActivityPubService/index')).default
      const result = await ActivityPubService.getOutboxPage(0)

      expect(result.next).toContain('p=1')
    })

    it('does not include prev on first page', async () => {
      ;(mockPrisma.$transaction as jest.Mock).mockResolvedValue([mockPosts, 1])

      const ActivityPubService = (await import('@/services/ActivityPubService/index')).default
      const result = await ActivityPubService.getOutboxPage(0)

      expect(result.prev).toBeUndefined()
    })

    it('uses blog as default category slug when no category', async () => {
      const postsWithoutCat = [{ ...mockPosts[0], category: null }]
      ;(mockPrisma.$transaction as jest.Mock).mockResolvedValue([postsWithoutCat, 1])

      const ActivityPubService = (await import('@/services/ActivityPubService/index')).default
      const result = await ActivityPubService.getOutboxPage(0)

      expect((result.orderedItems[0] as any).object.url).toContain('/blog/')
    })
  })

  describe('getNodeInfoData', () => {
    it('returns NodeInfo 2.1 document', async () => {
      ;(mockPrisma.post.count as jest.Mock).mockResolvedValue(10)

      const ActivityPubService = (await import('@/services/ActivityPubService/index')).default
      const result = await ActivityPubService.getNodeInfoData()

      expect(result.version).toBe('2.1')
      expect(result.protocols).toEqual(['activitypub'])
      expect(result.openRegistrations).toBe(false)
      expect(result.usage.localPosts).toBe(10)
      expect(result.software.name).toBe('kuray-dev-blog')
    })

    it('returns default metadata when env vars not set', async () => {
      ;(mockPrisma.post.count as jest.Mock).mockResolvedValue(0)
      delete process.env.ACTIVITYPUB_ACTOR_DISPLAY_NAME
      delete process.env.ACTIVITYPUB_ACTOR_SUMMARY

      const ActivityPubService = (await import('@/services/ActivityPubService/index')).default
      const result = await ActivityPubService.getNodeInfoData()

      expect(result.metadata.nodeName).toBe('Kuray')
      expect(result.metadata.nodeDescription).toBe('Personal blog')
    })
  })
})
