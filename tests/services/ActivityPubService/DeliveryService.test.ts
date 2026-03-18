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
