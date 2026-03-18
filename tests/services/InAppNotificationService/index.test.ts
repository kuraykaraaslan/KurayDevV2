import redis from '@/libs/redis'
import { prisma } from '@/libs/prisma'
import PushNotificationService from '@/services/PushNotificationService'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/services/PushNotificationService', () => ({
  __esModule: true,
  default: {
    sendToUser: jest.fn(),
  },
}))

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid-1'),
}))

const mockRedis = redis as jest.Mocked<typeof redis>
const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockPushNotificationService = PushNotificationService as jest.Mocked<typeof PushNotificationService>

describe('InAppNotificationService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    // Re-apply uuid mock since resetAllMocks clears mockReturnValue implementations
    ;(jest.requireMock('uuid') as { v4: jest.Mock }).v4.mockReturnValue('test-uuid-1')
    // Reset redis mock methods to default resolved values
    ;(mockRedis.hset as jest.Mock).mockResolvedValue(1)
    ;(mockRedis.expire as jest.Mock).mockResolvedValue(1)
    ;(mockRedis.publish as jest.Mock).mockResolvedValue(1)
    ;(mockRedis.hgetall as jest.Mock).mockResolvedValue({})
    ;(mockRedis.smembers as jest.Mock).mockResolvedValue([])
    ;(mockRedis.sadd as jest.Mock).mockResolvedValue(1)
    ;(mockRedis.hdel as jest.Mock).mockResolvedValue(1)
    ;(mockRedis.del as jest.Mock).mockResolvedValue(1)
    // srem is not in jest.setup.ts mock, add it inline
    ;(mockRedis as any).srem = jest.fn().mockResolvedValue(1)
    ;(mockPushNotificationService.sendToUser as jest.Mock).mockResolvedValue(undefined)
  })

  describe('push', () => {
    it('creates a notification with correct fields and returns it', async () => {
      const InAppNotificationService = (await import('@/services/InAppNotificationService/index')).default
      const data = { title: 'Test Title', message: 'Test Message', path: '/admin/test' }
      const result = await InAppNotificationService.push('user-1', data)

      expect(result.notificationId).toBe('test-uuid-1')
      expect(result.title).toBe('Test Title')
      expect(result.message).toBe('Test Message')
      expect(result.path).toBe('/admin/test')
      expect(result.isRead).toBe(false)
      expect(result.createdAt).toBeDefined()
    })

    it('calls redis.hset and redis.expire', async () => {
      const InAppNotificationService = (await import('@/services/InAppNotificationService/index')).default
      const data = { title: 'Test', message: 'Msg', path: '/path' }
      await InAppNotificationService.push('user-1', data)

      expect(mockRedis.hset).toHaveBeenCalledWith(
        'notifications:user-1',
        'test-uuid-1',
        expect.any(String)
      )
      expect(mockRedis.expire).toHaveBeenCalledWith('notifications:user-1', InAppNotificationService.TTL)
    })

    it('calls redis.publish with the notification JSON', async () => {
      const InAppNotificationService = (await import('@/services/InAppNotificationService/index')).default
      const data = { title: 'Pub Test', message: 'Pub Msg', path: '/pub' }
      await InAppNotificationService.push('user-1', data)

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'notifications:user-1',
        expect.stringContaining('test-uuid-1')
      )
    })

    it('calls PushNotificationService.sendToUser as fire-and-forget', async () => {
      const InAppNotificationService = (await import('@/services/InAppNotificationService/index')).default
      const data = { title: 'Push Test', message: 'Push Msg', path: '/push' }
      await InAppNotificationService.push('user-1', data)

      expect(mockPushNotificationService.sendToUser).toHaveBeenCalledWith('user-1', {
        title: 'Push Test',
        body: 'Push Msg',
        url: '/push',
      })
    })

    it('uses "/" as url fallback when path is empty', async () => {
      const InAppNotificationService = (await import('@/services/InAppNotificationService/index')).default
      const data = { title: 'T', message: 'M', path: '' }
      await InAppNotificationService.push('user-1', data)

      expect(mockPushNotificationService.sendToUser).toHaveBeenCalledWith('user-1', expect.objectContaining({ url: '/' }))
    })
  })

  describe('getAll', () => {
    it('returns empty array when no notifications', async () => {
      ;(mockRedis.hgetall as jest.Mock).mockResolvedValue(null)
      const InAppNotificationService = (await import('@/services/InAppNotificationService/index')).default
      const result = await InAppNotificationService.getAll('user-1')
      expect(result).toEqual([])
    })

    it('returns sorted notifications with isRead populated from smembers', async () => {
      const notif1 = { notificationId: 'id-1', title: 'Old', message: 'Msg', path: '/', isRead: false, createdAt: '2024-01-01T00:00:00.000Z' }
      const notif2 = { notificationId: 'id-2', title: 'New', message: 'Msg', path: '/', isRead: false, createdAt: '2024-06-01T00:00:00.000Z' }
      ;(mockRedis.hgetall as jest.Mock).mockResolvedValue({
        'id-1': JSON.stringify(notif1),
        'id-2': JSON.stringify(notif2),
      })
      ;(mockRedis.smembers as jest.Mock).mockResolvedValue(['id-1'])

      const InAppNotificationService = (await import('@/services/InAppNotificationService/index')).default
      const result = await InAppNotificationService.getAll('user-1')

      expect(result).toHaveLength(2)
      // sorted newest first
      expect(result[0].notificationId).toBe('id-2')
      expect(result[0].isRead).toBe(false)
      expect(result[1].notificationId).toBe('id-1')
      expect(result[1].isRead).toBe(true)
    })
  })

  describe('markAsRead', () => {
    it('calls redis.sadd with correct key and notificationId and sets expire', async () => {
      const InAppNotificationService = (await import('@/services/InAppNotificationService/index')).default
      await InAppNotificationService.markAsRead('user-1', 'notif-123')

      expect(mockRedis.sadd).toHaveBeenCalledWith('notifications_read:user-1', 'notif-123')
      expect(mockRedis.expire).toHaveBeenCalledWith('notifications_read:user-1', InAppNotificationService.TTL)
    })
  })

  describe('markAllAsRead', () => {
    it('does nothing when there are no notifications', async () => {
      ;(mockRedis.hgetall as jest.Mock).mockResolvedValue({})
      const InAppNotificationService = (await import('@/services/InAppNotificationService/index')).default
      await InAppNotificationService.markAllAsRead('user-1')

      expect(mockRedis.sadd).not.toHaveBeenCalled()
    })

    it('calls sadd with all notification ids', async () => {
      const notif1 = { notificationId: 'id-1', title: 'T', message: 'M', path: '/', isRead: false, createdAt: '2024-01-01T00:00:00.000Z' }
      const notif2 = { notificationId: 'id-2', title: 'T', message: 'M', path: '/', isRead: false, createdAt: '2024-06-01T00:00:00.000Z' }
      ;(mockRedis.hgetall as jest.Mock).mockResolvedValue({
        'id-1': JSON.stringify(notif1),
        'id-2': JSON.stringify(notif2),
      })
      ;(mockRedis.smembers as jest.Mock).mockResolvedValue([])

      const InAppNotificationService = (await import('@/services/InAppNotificationService/index')).default
      await InAppNotificationService.markAllAsRead('user-1')

      expect(mockRedis.sadd).toHaveBeenCalledWith('notifications_read:user-1', 'id-2', 'id-1')
    })
  })

  describe('deleteOne', () => {
    it('calls redis.hdel and redis.srem', async () => {
      const InAppNotificationService = (await import('@/services/InAppNotificationService/index')).default
      await InAppNotificationService.deleteOne('user-1', 'notif-abc')

      expect(mockRedis.hdel).toHaveBeenCalledWith('notifications:user-1', 'notif-abc')
      expect((mockRedis as any).srem).toHaveBeenCalledWith('notifications_read:user-1', 'notif-abc')
    })
  })

  describe('clearAll', () => {
    it('calls redis.del for both notifications and read keys', async () => {
      const InAppNotificationService = (await import('@/services/InAppNotificationService/index')).default
      await InAppNotificationService.clearAll('user-1')

      expect(mockRedis.del).toHaveBeenCalledWith('notifications:user-1')
      expect(mockRedis.del).toHaveBeenCalledWith('notifications_read:user-1')
    })
  })

  describe('unreadCount', () => {
    it('returns count of unread notifications', async () => {
      const notif1 = { notificationId: 'id-1', title: 'T', message: 'M', path: '/', isRead: false, createdAt: '2024-01-01T00:00:00.000Z' }
      const notif2 = { notificationId: 'id-2', title: 'T', message: 'M', path: '/', isRead: false, createdAt: '2024-06-01T00:00:00.000Z' }
      ;(mockRedis.hgetall as jest.Mock).mockResolvedValue({
        'id-1': JSON.stringify(notif1),
        'id-2': JSON.stringify(notif2),
      })
      // id-1 is read, id-2 is not
      ;(mockRedis.smembers as jest.Mock).mockResolvedValue(['id-1'])

      const InAppNotificationService = (await import('@/services/InAppNotificationService/index')).default
      const count = await InAppNotificationService.unreadCount('user-1')

      expect(count).toBe(1)
    })
  })

  describe('pushToAdmins', () => {
    it('calls push for each admin user', async () => {
      const admins = [{ userId: 'admin-1' }, { userId: 'admin-2' }]
      ;(mockPrisma.user.findMany as jest.Mock).mockResolvedValue(admins)
      ;(mockRedis.hset as jest.Mock).mockResolvedValue(1)
      ;(mockRedis.expire as jest.Mock).mockResolvedValue(1)
      ;(mockRedis.publish as jest.Mock).mockResolvedValue(1)
      ;(mockRedis.hgetall as jest.Mock).mockResolvedValue({})
      ;(mockRedis.smembers as jest.Mock).mockResolvedValue([])

      const InAppNotificationService = (await import('@/services/InAppNotificationService/index')).default
      const data = { title: 'Admin Title', message: 'Admin Msg', path: '/admin' }
      await InAppNotificationService.pushToAdmins(data)

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { userRole: 'ADMIN' },
        select: { userId: true },
      })
      expect(mockPushNotificationService.sendToUser).toHaveBeenCalledTimes(2)
      expect(mockPushNotificationService.sendToUser).toHaveBeenCalledWith('admin-1', expect.objectContaining({ title: 'Admin Title' }))
      expect(mockPushNotificationService.sendToUser).toHaveBeenCalledWith('admin-2', expect.objectContaining({ title: 'Admin Title' }))
    })
  })
})
