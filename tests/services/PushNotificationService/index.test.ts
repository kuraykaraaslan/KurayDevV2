jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}))

jest.mock('@/libs/prisma', () => ({
  prisma: {
    pushSubscription: {
      upsert:    jest.fn(),
      deleteMany: jest.fn(),
      findMany:  jest.fn(),
      delete:    jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/libs/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

import webpush from 'web-push'
import { prisma } from '@/libs/prisma'
import PushNotificationService from '@/services/PushNotificationService'

const webpushMock = webpush as jest.Mocked<typeof webpush>
const prismaMock = prisma as jest.Mocked<typeof prisma>

const SUBSCRIPTION = {
  id: 'sub-1',
  userId: 'user-1',
  endpoint: 'https://push.example.com/sub1',
  p256dh: 'p256dh-key',
  auth: 'auth-key',
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'vapid-pub'
  process.env.VAPID_PRIVATE_KEY = 'vapid-priv'
})

describe('PushNotificationService', () => {
  // ── subscribe ─────────────────────────────────────────────────────────────
  describe('subscribe', () => {
    it('upserts push subscription by endpoint', async () => {
      ;(prismaMock.pushSubscription.upsert as jest.Mock).mockResolvedValueOnce(SUBSCRIPTION)
      await PushNotificationService.subscribe('user-1', {
        endpoint: 'https://push.example.com/sub1',
        keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
      })
      expect(prismaMock.pushSubscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { endpoint: 'https://push.example.com/sub1' } })
      )
    })
  })

  // ── unsubscribe ───────────────────────────────────────────────────────────
  describe('unsubscribe', () => {
    it('deletes all subscriptions for the user', async () => {
      ;(prismaMock.pushSubscription.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 1 })
      await PushNotificationService.unsubscribe('user-1')
      expect(prismaMock.pushSubscription.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } })
    })
  })

  // ── unsubscribeByEndpoint ─────────────────────────────────────────────────
  describe('unsubscribeByEndpoint', () => {
    it('deletes subscription matching the endpoint', async () => {
      ;(prismaMock.pushSubscription.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 1 })
      await PushNotificationService.unsubscribeByEndpoint('https://push.example.com/sub1')
      expect(prismaMock.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { endpoint: 'https://push.example.com/sub1' },
      })
    })
  })

  // ── sendToUser ────────────────────────────────────────────────────────────
  describe('sendToUser', () => {
    it('sends push to all subscriptions of the user', async () => {
      ;(prismaMock.pushSubscription.findMany as jest.Mock).mockResolvedValueOnce([SUBSCRIPTION])
      ;(webpushMock.sendNotification as jest.Mock).mockResolvedValueOnce({})

      await PushNotificationService.sendToUser('user-1', {
        title: 'New post',
        body: 'Check it out',
      })
      expect(webpushMock.sendNotification).toHaveBeenCalledTimes(1)
    })

    it('removes expired subscription (statusCode 410)', async () => {
      ;(prismaMock.pushSubscription.findMany as jest.Mock).mockResolvedValueOnce([SUBSCRIPTION])
      const expiredError = Object.assign(new Error('Gone'), { statusCode: 410 })
      ;(webpushMock.sendNotification as jest.Mock).mockRejectedValueOnce(expiredError)
      ;(prismaMock.pushSubscription.delete as jest.Mock).mockResolvedValueOnce(SUBSCRIPTION)

      await PushNotificationService.sendToUser('user-1', { title: 'T', body: 'B' })
      expect(prismaMock.pushSubscription.delete).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
      })
    })

    it('removes expired subscription (statusCode 404)', async () => {
      ;(prismaMock.pushSubscription.findMany as jest.Mock).mockResolvedValueOnce([SUBSCRIPTION])
      const notFoundError = Object.assign(new Error('Not Found'), { statusCode: 404 })
      ;(webpushMock.sendNotification as jest.Mock).mockRejectedValueOnce(notFoundError)
      ;(prismaMock.pushSubscription.delete as jest.Mock).mockResolvedValueOnce(SUBSCRIPTION)

      await PushNotificationService.sendToUser('user-1', { title: 'T', body: 'B' })
      expect(prismaMock.pushSubscription.delete).toHaveBeenCalled()
    })

    it('does nothing when user has no subscriptions', async () => {
      ;(prismaMock.pushSubscription.findMany as jest.Mock).mockResolvedValueOnce([])
      await PushNotificationService.sendToUser('user-no-subs', { title: 'T', body: 'B' })
      expect(webpushMock.sendNotification).not.toHaveBeenCalled()
    })
  })

  // ── sendToAdmins ──────────────────────────────────────────────────────────
  describe('sendToAdmins', () => {
    it('finds admin users and sends to their subscriptions', async () => {
      ;(prismaMock.user.findMany as jest.Mock).mockResolvedValueOnce([{ userId: 'admin-1' }])
      ;(prismaMock.pushSubscription.findMany as jest.Mock).mockResolvedValueOnce([SUBSCRIPTION])
      ;(webpushMock.sendNotification as jest.Mock).mockResolvedValueOnce({})

      await PushNotificationService.sendToAdmins({ title: 'Admin alert', body: 'Urgent' })
      expect(webpushMock.sendNotification).toHaveBeenCalledTimes(1)
    })
  })

  // ── sendToAll ─────────────────────────────────────────────────────────────
  describe('sendToAll', () => {
    it('sends to all subscribers', async () => {
      const sub2 = { ...SUBSCRIPTION, id: 'sub-2', endpoint: 'https://push.example.com/sub2' }
      ;(prismaMock.pushSubscription.findMany as jest.Mock).mockResolvedValueOnce([SUBSCRIPTION, sub2])
      ;(webpushMock.sendNotification as jest.Mock).mockResolvedValue({})

      await PushNotificationService.sendToAll({ title: 'Broadcast', body: 'Hello everyone' })
      expect(webpushMock.sendNotification).toHaveBeenCalledTimes(2)
    })

    it('sends nothing when no subscriptions exist', async () => {
      ;(prismaMock.pushSubscription.findMany as jest.Mock).mockResolvedValueOnce([])
      await PushNotificationService.sendToAll({ title: 'T', body: 'B' })
      expect(webpushMock.sendNotification).not.toHaveBeenCalled()
    })
  })
})
