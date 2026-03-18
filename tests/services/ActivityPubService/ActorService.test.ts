import redis from '@/libs/redis'
import ActivityPubMessages from '@/messages/ActivityPubMessages'

describe('ActorService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://kuray.dev'
    process.env.ACTIVITYPUB_PRIVATE_KEY = 'private-key'
    process.env.ACTIVITYPUB_PUBLIC_KEY = 'public-key-pem'
    delete process.env.ACTIVITYPUB_ACTOR_USERNAME
    delete process.env.ACTIVITYPUB_ACTOR_DISPLAY_NAME
    delete process.env.ACTIVITYPUB_ACTOR_SUMMARY
    delete process.env.ACTIVITYPUB_ACTOR_AVATAR
  })

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.ACTIVITYPUB_PRIVATE_KEY
    delete process.env.ACTIVITYPUB_PUBLIC_KEY
  })

  describe('getActorJson', () => {
    it('returns actor object with correct id and type', async () => {
      const ActorService = (await import('@/services/ActivityPubService/ActorService')).default
      const actor = ActorService.getActorJson()
      expect(actor.id).toBe('https://kuray.dev/api/activitypub/actor')
      expect(actor.type).toBe('Person')
    })

    it('returns default preferredUsername when env var not set', async () => {
      const ActorService = (await import('@/services/ActivityPubService/ActorService')).default
      const actor = ActorService.getActorJson()
      expect(actor.preferredUsername).toBe('kuray')
    })

    it('uses env vars for username and displayName', async () => {
      process.env.ACTIVITYPUB_ACTOR_USERNAME = 'testuser'
      process.env.ACTIVITYPUB_ACTOR_DISPLAY_NAME = 'Test User'
      const ActorService = (await import('@/services/ActivityPubService/ActorService')).default
      const actor = ActorService.getActorJson()
      expect(actor.preferredUsername).toBe('testuser')
      expect(actor.name).toBe('Test User')
    })

    it('uses env var for summary', async () => {
      process.env.ACTIVITYPUB_ACTOR_SUMMARY = 'My custom summary'
      const ActorService = (await import('@/services/ActivityPubService/ActorService')).default
      const actor = ActorService.getActorJson()
      expect(actor.summary).toBe('My custom summary')
    })

    it('has inbox, outbox, followers, and following fields', async () => {
      const ActorService = (await import('@/services/ActivityPubService/ActorService')).default
      const actor = ActorService.getActorJson()
      expect(actor.inbox).toBe('https://kuray.dev/api/activitypub/inbox')
      expect(actor.outbox).toBe('https://kuray.dev/api/activitypub/outbox')
      expect(actor.followers).toBe('https://kuray.dev/api/activitypub/followers')
      expect(actor.following).toBe('https://kuray.dev/api/activitypub/following')
    })

    it('has publicKey with correct id and owner', async () => {
      const ActorService = (await import('@/services/ActivityPubService/ActorService')).default
      const actor = ActorService.getActorJson()
      expect(actor.publicKey.id).toBe('https://kuray.dev/api/activitypub/actor#main-key')
      expect(actor.publicKey.owner).toBe('https://kuray.dev/api/activitypub/actor')
      expect(actor.publicKey.publicKeyPem).toBe('public-key-pem')
    })

    it('uses env var for avatar URL', async () => {
      process.env.ACTIVITYPUB_ACTOR_AVATAR = 'https://example.com/avatar.png'
      const ActorService = (await import('@/services/ActivityPubService/ActorService')).default
      const actor = ActorService.getActorJson()
      expect(actor.icon.url).toBe('https://example.com/avatar.png')
    })

    it('falls back to default avatar URL based on siteUrl', async () => {
      const ActorService = (await import('@/services/ActivityPubService/ActorService')).default
      const actor = ActorService.getActorJson()
      expect(actor.icon.url).toBe('https://kuray.dev/assets/avatar.jpg')
    })
  })

  describe('fetchRemoteActor', () => {
    const mockActor = {
      id: 'https://remote.social/users/alice',
      type: 'Person',
      preferredUsername: 'alice',
      inbox: 'https://remote.social/users/alice/inbox',
      outbox: 'https://remote.social/users/alice/outbox',
      followers: 'https://remote.social/users/alice/followers',
      following: 'https://remote.social/users/alice/following',
      publicKey: { id: 'https://remote.social/users/alice#main-key', owner: 'https://remote.social/users/alice', publicKeyPem: 'pem' },
    }

    it('returns cached data when Redis has it', async () => {
      const mockRedis = redis as jest.Mocked<typeof redis>
      mockRedis.get = jest.fn().mockResolvedValue(JSON.stringify(mockActor))

      const ActorService = (await import('@/services/ActivityPubService/ActorService')).default
      const result = await ActorService.fetchRemoteActor('https://remote.social/users/alice')

      expect(mockRedis.get).toHaveBeenCalledWith('activitypub:actor:https://remote.social/users/alice')
      expect(result).toEqual(mockActor)
    })

    it('fetches from URL when not cached and stores in Redis', async () => {
      const mockRedis = redis as jest.Mocked<typeof redis>
      mockRedis.get = jest.fn().mockResolvedValue(null)
      mockRedis.setex = jest.fn().mockResolvedValue('OK')

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockActor),
      } as any)

      const ActorService = (await import('@/services/ActivityPubService/ActorService')).default
      const result = await ActorService.fetchRemoteActor('https://remote.social/users/alice')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://remote.social/users/alice',
        expect.objectContaining({ headers: expect.objectContaining({ Accept: expect.stringContaining('application/activity+json') }) })
      )
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'activitypub:actor:https://remote.social/users/alice',
        86400,
        JSON.stringify(mockActor)
      )
      expect(result).toEqual(mockActor)
    })

    it('throws when response is not ok', async () => {
      const mockRedis = redis as jest.Mocked<typeof redis>
      mockRedis.get = jest.fn().mockResolvedValue(null)

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as any)

      const ActorService = (await import('@/services/ActivityPubService/ActorService')).default

      await expect(
        ActorService.fetchRemoteActor('https://remote.social/users/missing')
      ).rejects.toThrow(ActivityPubMessages.ACTOR_FETCH_FAILED)
    })
  })
})
