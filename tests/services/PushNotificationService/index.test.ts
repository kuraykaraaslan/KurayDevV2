import webpush from 'web-push'
import { prisma } from '@/libs/prisma'
import Logger from '@/libs/logger'

jest.mock('web-push', () => ({
  __esModule: true,
  default: {
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn(),
  },
}))

jest.mock('@/libs/prisma', () => ({
  prisma: {
    pushSubscription: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}))

const mockWebpush = webpush as jest.Mocked<typeof webpush>
const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockLogger = Logger as jest.Mocked<typeof Logger>

beforeEach(() => {
  jest.resetAllMocks()
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'pub-key'
  process.env.VAPID_PRIVATE_KEY = 'priv-key'
})

afterAll(() => {
  delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  delete process.env.VAPID_PRIVATE_KEY
})

describe('PushNotificationService', () => {
  describe('subscribe', () => {
    it('calls prisma.pushSubscription.upsert with correct data', async () => {
      ;(mockPrisma.pushSubscription.upsert as jest.Mock).mockResolvedValue({})

      const PushNotificationService = (await import('@/services/PushNotificationService/index')).default
      const subscription = { endpoint: 'https://push.example.com/sub1', keys: { p256dh: 'key1', auth: 'auth1' } }
      await PushNotificationService.subscribe('user-1', subscription)

      expect(mockPrisma.pushSubscription.upsert).toHaveBeenCalledWith({
        where: { endpoint: 'https://push.example.com/sub1' },
        update: { userId: 'user-1', p256dh: 'key1', auth: 'auth1' },
        create: { userId: 'user-1', endpoint: 'https://push.example.com/sub1', p256dh: 'key1', auth: 'auth1' },
      })
    })
  })

  describe('unsubscribe', () => {
    it('calls prisma.pushSubscription.deleteMany with userId', async () => {
      ;(mockPrisma.pushSubscription.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })

      const PushNotificationService = (await import('@/services/PushNotificationService/index')).default
      await PushNotificationService.unsubscribe('user-1')

      expect(mockPrisma.pushSubscription.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } })
    })
  })

  describe('unsubscribeByEndpoint', () => {
    it('calls prisma.pushSubscription.deleteMany with endpoint', async () => {
      ;(mockPrisma.pushSubscription.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })

      const PushNotificationService = (await import('@/services/PushNotificationService/index')).default
      await PushNotificationService.unsubscribeByEndpoint('https://push.example.com/sub1')

      expect(mockPrisma.pushSubscription.deleteMany).toHaveBeenCalledWith({ where: { endpoint: 'https://push.example.com/sub1' } })
    })
  })

  describe('sendToUser', () => {
    it('sets VAPID, fetches subscriptions and calls sendNotification for each', async () => {
      const subs = [
        { id: 'sub-1', endpoint: 'https://push.example.com/sub1', p256dh: 'key1', auth: 'auth1' },
        { id: 'sub-2', endpoint: 'https://push.example.com/sub2', p256dh: 'key2', auth: 'auth2' },
      ]
      ;(mockPrisma.pushSubscription.findMany as jest.Mock).mockResolvedValue(subs)
      ;(mockWebpush.sendNotification as jest.Mock).mockResolvedValue({})

      const PushNotificationService = (await import('@/services/PushNotificationService/index')).default
      const payload = { title: 'Test', body: 'Test body' }
      await PushNotificationService.sendToUser('user-1', payload)

      expect(mockWebpush.setVapidDetails).toHaveBeenCalledWith('mailto:info@kuray.dev', 'pub-key', 'priv-key')
      expect(mockPrisma.pushSubscription.findMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } })
      expect(mockWebpush.sendNotification).toHaveBeenCalledTimes(2)
    })
  })

  describe('sendToAdmins', () => {
    it('fetches admin users and their subscriptions, sends to each', async () => {
      const adminUsers = [{ userId: 'admin-1' }, { userId: 'admin-2' }]
      const subs = [
        { id: 'sub-1', endpoint: 'https://push.example.com/sub1', p256dh: 'key1', auth: 'auth1' },
      ]
      ;(mockPrisma.user.findMany as jest.Mock).mockResolvedValue(adminUsers)
      ;(mockPrisma.pushSubscription.findMany as jest.Mock).mockResolvedValue(subs)
      ;(mockWebpush.sendNotification as jest.Mock).mockResolvedValue({})

      const PushNotificationService = (await import('@/services/PushNotificationService/index')).default
      const payload = { title: 'Admin', body: 'Admin body' }
      await PushNotificationService.sendToAdmins(payload)

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { userRole: 'ADMIN' },
        select: { userId: true },
      })
      expect(mockPrisma.pushSubscription.findMany).toHaveBeenCalledWith({
        where: { userId: { in: ['admin-1', 'admin-2'] } },
      })
      expect(mockWebpush.sendNotification).toHaveBeenCalledTimes(1)
    })
  })

  describe('sendToAll', () => {
    it('fetches all subscriptions and sends to each', async () => {
      const subs = [
        { id: 'sub-1', endpoint: 'https://push.example.com/sub1', p256dh: 'key1', auth: 'auth1' },
        { id: 'sub-2', endpoint: 'https://push.example.com/sub2', p256dh: 'key2', auth: 'auth2' },
      ]
      ;(mockPrisma.pushSubscription.findMany as jest.Mock).mockResolvedValue(subs)
      ;(mockWebpush.sendNotification as jest.Mock).mockResolvedValue({})

      const PushNotificationService = (await import('@/services/PushNotificationService/index')).default
      const payload = { title: 'All', body: 'All body' }
      await PushNotificationService.sendToAll(payload)

      expect(mockPrisma.pushSubscription.findMany).toHaveBeenCalledWith()
      expect(mockWebpush.sendNotification).toHaveBeenCalledTimes(2)
    })
  })

  describe('sendToSubscription (via sendToUser)', () => {
    it('deletes subscription on 410 Gone error', async () => {
      const subs = [{ id: 'sub-expired', endpoint: 'https://push.example.com/expired', p256dh: 'key', auth: 'auth' }]
      ;(mockPrisma.pushSubscription.findMany as jest.Mock).mockResolvedValue(subs)
      ;(mockPrisma.pushSubscription.delete as jest.Mock).mockResolvedValue({})

      const goneError = Object.assign(new Error('Gone'), { statusCode: 410 })
      ;(mockWebpush.sendNotification as jest.Mock).mockRejectedValue(goneError)

      const PushNotificationService = (await import('@/services/PushNotificationService/index')).default
      await PushNotificationService.sendToUser('user-1', { title: 'T', body: 'B' })

      expect(mockPrisma.pushSubscription.delete).toHaveBeenCalledWith({ where: { id: 'sub-expired' } })
      expect(mockLogger.warn).toHaveBeenCalled()
    })

    it('deletes subscription on 404 Not Found error', async () => {
      const subs = [{ id: 'sub-missing', endpoint: 'https://push.example.com/missing', p256dh: 'key', auth: 'auth' }]
      ;(mockPrisma.pushSubscription.findMany as jest.Mock).mockResolvedValue(subs)
      ;(mockPrisma.pushSubscription.delete as jest.Mock).mockResolvedValue({})

      const notFoundError = Object.assign(new Error('Not Found'), { statusCode: 404 })
      ;(mockWebpush.sendNotification as jest.Mock).mockRejectedValue(notFoundError)

      const PushNotificationService = (await import('@/services/PushNotificationService/index')).default
      await PushNotificationService.sendToUser('user-1', { title: 'T', body: 'B' })

      expect(mockPrisma.pushSubscription.delete).toHaveBeenCalledWith({ where: { id: 'sub-missing' } })
    })

    it('logs error without deleting on other errors', async () => {
      const subs = [{ id: 'sub-other', endpoint: 'https://push.example.com/other', p256dh: 'key', auth: 'auth' }]
      ;(mockPrisma.pushSubscription.findMany as jest.Mock).mockResolvedValue(subs)

      const otherError = Object.assign(new Error('Server Error'), { statusCode: 500 })
      ;(mockWebpush.sendNotification as jest.Mock).mockRejectedValue(otherError)

      const PushNotificationService = (await import('@/services/PushNotificationService/index')).default
      await PushNotificationService.sendToUser('user-1', { title: 'T', body: 'B' })

      expect(mockPrisma.pushSubscription.delete).not.toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })
})
