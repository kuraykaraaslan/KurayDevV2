jest.mock('@/libs/redis', () => ({
  __esModule: true,
  default: {
    get:   jest.fn(),
    setex: jest.fn(),
  },
}))

jest.mock('@/services/ActivityPubService/config', () => ({
  getSiteUrl:       jest.fn().mockReturnValue('https://example.com'),
  getActorUrl:      jest.fn().mockReturnValue('https://example.com/api/activitypub/actor'),
  getKeyId:         jest.fn().mockReturnValue('https://example.com/api/activitypub/actor#main-key'),
  getInboxUrl:      jest.fn().mockReturnValue('https://example.com/api/activitypub/inbox'),
  getOutboxUrl:     jest.fn().mockReturnValue('https://example.com/api/activitypub/outbox'),
  getFollowersUrl:  jest.fn().mockReturnValue('https://example.com/api/activitypub/followers'),
  getFollowingUrl:  jest.fn().mockReturnValue('https://example.com/api/activitypub/following'),
  getPublicKeyPem:  jest.fn().mockReturnValue('-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----'),
}))

jest.mock('@/messages/ActivityPubMessages', () => ({
  __esModule: true,
  default: {
    ACTOR_FETCH_FAILED: 'ACTOR_FETCH_FAILED',
    SITE_URL_MISSING: 'SITE_URL_MISSING',
    PRIVATE_KEY_MISSING: 'PRIVATE_KEY_MISSING',
    PUBLIC_KEY_MISSING: 'PUBLIC_KEY_MISSING',
  },
}))

import redis from '@/libs/redis'
import ActorService from '@/services/ActivityPubService/ActorService'

const redisMock = redis as jest.Mocked<typeof redis>

const ACTOR = {
  id: 'https://mastodon.social/users/alice',
  type: 'Person',
  inbox: 'https://mastodon.social/users/alice/inbox',
  publicKey: { publicKeyPem: 'pem' },
}

describe('ActorService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>
  })

  // ── getActorJson ──────────────────────────────────────────────────────────
  describe('getActorJson', () => {
    it('returns actor JSON with type Person and correct URLs', () => {
      const actor = ActorService.getActorJson()
      expect(actor.type).toBe('Person')
      expect(actor.id).toBe('https://example.com/api/activitypub/actor')
      expect(actor.inbox).toBe('https://example.com/api/activitypub/inbox')
      expect(actor.outbox).toBe('https://example.com/api/activitypub/outbox')
    })

    it('uses ACTIVITYPUB_ACTOR_USERNAME env var for preferredUsername', () => {
      process.env.ACTIVITYPUB_ACTOR_USERNAME = 'bloguser'
      const actor = ActorService.getActorJson()
      expect(actor.preferredUsername).toBe('bloguser')
    })

    it('falls back to "kuray" when env var is unset', () => {
      delete process.env.ACTIVITYPUB_ACTOR_USERNAME
      const actor = ActorService.getActorJson()
      expect(actor.preferredUsername).toBe('kuray')
    })

    it('includes publicKey with correct id and owner', () => {
      const actor = ActorService.getActorJson()
      expect(actor.publicKey.id).toBe('https://example.com/api/activitypub/actor#main-key')
      expect(actor.publicKey.owner).toBe('https://example.com/api/activitypub/actor')
    })

    it('includes @context field', () => {
      const actor = ActorService.getActorJson()
      expect(actor['@context']).toBeDefined()
    })
  })

  // ── fetchRemoteActor ──────────────────────────────────────────────────────
  describe('fetchRemoteActor', () => {
    it('returns cached actor without fetching when cache hit', async () => {
      redisMock.get.mockResolvedValueOnce(JSON.stringify(ACTOR))
      const result = await ActorService.fetchRemoteActor('https://mastodon.social/users/alice')
      expect(result).toEqual(ACTOR)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('fetches and caches actor when cache miss', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(ACTOR),
      })
      redisMock.setex.mockResolvedValueOnce('OK')

      const result = await ActorService.fetchRemoteActor('https://mastodon.social/users/alice')
      expect(result).toEqual(ACTOR)
      expect(redisMock.setex).toHaveBeenCalledWith(
        expect.stringContaining('activitypub:actor:'),
        expect.any(Number),
        JSON.stringify(ACTOR)
      )
    })

    it('throws ACTOR_FETCH_FAILED when remote server returns non-OK', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 })

      await expect(
        ActorService.fetchRemoteActor('https://mastodon.social/users/ghost')
      ).rejects.toThrow('ACTOR_FETCH_FAILED')
    })
  })
})
