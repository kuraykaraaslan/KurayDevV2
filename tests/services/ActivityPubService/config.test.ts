import ActivityPubMessages from '@/messages/ActivityPubMessages'

// Import after env vars are set in each test
let getSiteUrl: () => string
let getPrivateKey: () => string
let getPublicKeyPem: () => string
let getActorUrl: () => string
let getKeyId: () => string
let getInboxUrl: () => string
let getOutboxUrl: () => string
let getFollowersUrl: () => string
let getFollowingUrl: () => string

describe('ActivityPubService/config', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://kuray.dev'
    process.env.ACTIVITYPUB_PRIVATE_KEY = 'private-key-value'
    process.env.ACTIVITYPUB_PUBLIC_KEY = 'public-key-value'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.ACTIVITYPUB_PRIVATE_KEY
    delete process.env.ACTIVITYPUB_PUBLIC_KEY
  })

  describe('getSiteUrl', () => {
    it('returns the site URL with trailing slash stripped', async () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://kuray.dev/'
      const { getSiteUrl } = await import('@/services/ActivityPubService/config')
      expect(getSiteUrl()).toBe('https://kuray.dev')
    })

    it('returns the site URL without modification when no trailing slash', async () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://kuray.dev'
      const { getSiteUrl } = await import('@/services/ActivityPubService/config')
      expect(getSiteUrl()).toBe('https://kuray.dev')
    })

    it('throws when NEXT_PUBLIC_SITE_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_SITE_URL
      const { getSiteUrl } = await import('@/services/ActivityPubService/config')
      expect(() => getSiteUrl()).toThrow(ActivityPubMessages.SITE_URL_MISSING)
    })
  })

  describe('getPrivateKey', () => {
    it('returns the private key with \\n replaced by newlines', async () => {
      process.env.ACTIVITYPUB_PRIVATE_KEY = 'line1\\nline2\\nline3'
      const { getPrivateKey } = await import('@/services/ActivityPubService/config')
      expect(getPrivateKey()).toBe('line1\nline2\nline3')
    })

    it('returns the private key as-is when no escaped newlines', async () => {
      process.env.ACTIVITYPUB_PRIVATE_KEY = 'plain-private-key'
      const { getPrivateKey } = await import('@/services/ActivityPubService/config')
      expect(getPrivateKey()).toBe('plain-private-key')
    })

    it('throws when ACTIVITYPUB_PRIVATE_KEY is not set', async () => {
      delete process.env.ACTIVITYPUB_PRIVATE_KEY
      const { getPrivateKey } = await import('@/services/ActivityPubService/config')
      expect(() => getPrivateKey()).toThrow(ActivityPubMessages.PRIVATE_KEY_MISSING)
    })
  })

  describe('getPublicKeyPem', () => {
    it('returns the public key with \\n replaced by newlines', async () => {
      process.env.ACTIVITYPUB_PUBLIC_KEY = 'publine1\\npubline2'
      const { getPublicKeyPem } = await import('@/services/ActivityPubService/config')
      expect(getPublicKeyPem()).toBe('publine1\npubline2')
    })

    it('throws when ACTIVITYPUB_PUBLIC_KEY is not set', async () => {
      delete process.env.ACTIVITYPUB_PUBLIC_KEY
      const { getPublicKeyPem } = await import('@/services/ActivityPubService/config')
      expect(() => getPublicKeyPem()).toThrow(ActivityPubMessages.PUBLIC_KEY_MISSING)
    })
  })

  describe('derived URL helpers', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://kuray.dev'
    })

    it('getActorUrl returns /api/activitypub/actor path', async () => {
      const { getActorUrl } = await import('@/services/ActivityPubService/config')
      expect(getActorUrl()).toBe('https://kuray.dev/api/activitypub/actor')
    })

    it('getKeyId returns actor URL with #main-key fragment', async () => {
      const { getKeyId } = await import('@/services/ActivityPubService/config')
      expect(getKeyId()).toBe('https://kuray.dev/api/activitypub/actor#main-key')
    })

    it('getInboxUrl returns /api/activitypub/inbox path', async () => {
      const { getInboxUrl } = await import('@/services/ActivityPubService/config')
      expect(getInboxUrl()).toBe('https://kuray.dev/api/activitypub/inbox')
    })

    it('getOutboxUrl returns /api/activitypub/outbox path', async () => {
      const { getOutboxUrl } = await import('@/services/ActivityPubService/config')
      expect(getOutboxUrl()).toBe('https://kuray.dev/api/activitypub/outbox')
    })

    it('getFollowersUrl returns /api/activitypub/followers path', async () => {
      const { getFollowersUrl } = await import('@/services/ActivityPubService/config')
      expect(getFollowersUrl()).toBe('https://kuray.dev/api/activitypub/followers')
    })

    it('getFollowingUrl returns /api/activitypub/following path', async () => {
      const { getFollowingUrl } = await import('@/services/ActivityPubService/config')
      expect(getFollowingUrl()).toBe('https://kuray.dev/api/activitypub/following')
    })
  })
})
