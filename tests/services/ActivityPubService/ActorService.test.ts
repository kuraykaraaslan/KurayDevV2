import { lookup as dnsLookup } from 'node:dns/promises'
import redis from '@/libs/redis'
import ActivityPubMessages from '@/messages/ActivityPubMessages'

describe('ActorService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    // resetAllMocks() clears the dns mock installed in jest.setup.ts, which the
    // federation SSRF guard depends on — re-establish it.
    ;(dnsLookup as jest.Mock).mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
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
    const cacheKeyFor = (url: string) =>
      `activitypub:actor:${require('node:crypto').createHash('sha256').update(url).digest('hex')}`

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

      expect(mockRedis.get).toHaveBeenCalledWith(cacheKeyFor('https://remote.social/users/alice'))
      expect(result).toEqual(mockActor)
    })

    it('fetches from URL when not cached and stores in Redis', async () => {
      const mockRedis = redis as jest.Mocked<typeof redis>
      mockRedis.get = jest.fn().mockResolvedValue(null)
      mockRedis.setex = jest.fn().mockResolvedValue('OK')

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: jest.fn().mockReturnValue(null) },
        body: null,
        text: jest.fn().mockResolvedValue(JSON.stringify(mockActor)),
      } as any)

      const ActorService = (await import('@/services/ActivityPubService/ActorService')).default
      const result = await ActorService.fetchRemoteActor('https://remote.social/users/alice')

      expect(global.fetch).toHaveBeenCalledWith(
        new URL('https://remote.social/users/alice'),
        expect.objectContaining({
          headers: expect.objectContaining({ Accept: expect.stringContaining('application/activity+json') }),
          redirect: 'manual',
        })
      )
      expect(mockRedis.setex).toHaveBeenCalledWith(
        cacheKeyFor('https://remote.social/users/alice'),
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
        headers: { get: jest.fn().mockReturnValue(null) },
        body: null,
        text: jest.fn().mockResolvedValue(''),
      } as any)

      const ActorService = (await import('@/services/ActivityPubService/ActorService')).default

      await expect(
        ActorService.fetchRemoteActor('https://remote.social/users/missing')
      ).rejects.toThrow(ActivityPubMessages.ACTOR_FETCH_FAILED)
    })
  })
})
