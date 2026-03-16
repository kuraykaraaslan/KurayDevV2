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
