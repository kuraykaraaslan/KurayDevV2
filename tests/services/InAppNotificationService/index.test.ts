jest.mock('@/libs/redis', () => ({
  __esModule: true,
  default: {
    hset:    jest.fn(),
    expire:  jest.fn(),
    hgetall: jest.fn(),
    hdel:    jest.fn(),
    smembers: jest.fn(),
    sadd:    jest.fn(),
    srem:    jest.fn(),
    del:     jest.fn(),
    publish: jest.fn(),
  },
  redisConnection: {},
}))

jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('@/libs/prisma', () => ({
  prisma: {
    user: { findMany: jest.fn() },
  },
}))

jest.mock('@/services/PushNotificationService', () => ({
  __esModule: true,
  default: { sendToUser: jest.fn().mockResolvedValue(undefined) },
}))

import redis from '@/libs/redis'
import { prisma } from '@/libs/prisma'
import PushNotificationService from '@/services/PushNotificationService'
import InAppNotificationService from '@/services/InAppNotificationService'

const redisMock = redis as jest.Mocked<typeof redis>
const prismaMock = prisma as jest.Mocked<typeof prisma>

const NOTIF = {
  notificationId: 'notif-1',
  title: 'Test',
  message: 'Hello',
  path: '/dashboard',
  isRead: false,
  createdAt: new Date().toISOString(),
}

describe('InAppNotificationService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── push ──────────────────────────────────────────────────────────────────
  describe('push', () => {
    it('stores notification in Redis hash and publishes to channel', async () => {
      redisMock.hset.mockResolvedValueOnce(1)
      redisMock.expire.mockResolvedValueOnce(1)
      redisMock.hgetall.mockResolvedValueOnce({}) // getAll → empty (no trim needed)
      redisMock.smembers.mockResolvedValueOnce([]) // getReadIds
      redisMock.publish.mockResolvedValueOnce(0)

      const result = await InAppNotificationService.push('user-1', {
        title: 'Test',
        message: 'Hello',
        path: '/dashboard',
      })

      expect(redisMock.hset).toHaveBeenCalled()
      expect(redisMock.publish).toHaveBeenCalled()
      expect(result.title).toBe('Test')
      expect(result.isRead).toBe(false)
    })

    it('triggers PushNotificationService.sendToUser (fire-and-forget)', async () => {
      redisMock.hset.mockResolvedValueOnce(1)
      redisMock.expire.mockResolvedValueOnce(1)
      redisMock.hgetall.mockResolvedValueOnce({})
      redisMock.smembers.mockResolvedValueOnce([])
      redisMock.publish.mockResolvedValueOnce(0)

      await InAppNotificationService.push('user-2', { title: 'T', message: 'M', path: '/p' })
      // Fire-and-forget — the call is non-blocking, just assert it was invoked
      expect(PushNotificationService.sendToUser).toHaveBeenCalledWith(
        'user-2',
        expect.objectContaining({ title: 'T', body: 'M' })
      )
    })

    it('trims oldest notifications when over MAX_PER_USER', async () => {
      // Simulate 51 existing notifications (> MAX_PER_USER = 50)
      const many: Record<string, string> = {}
      for (let i = 0; i < 51; i++) {
        const id = `notif-${i}`
        many[id] = JSON.stringify({ notificationId: id, title: 'x', message: 'x', path: '/', isRead: false, createdAt: new Date(i * 1000).toISOString() })
      }
      redisMock.hset.mockResolvedValueOnce(1)
      redisMock.expire.mockResolvedValueOnce(1)
      redisMock.hgetall.mockResolvedValueOnce(many)
      redisMock.smembers.mockResolvedValueOnce([])
      redisMock.hdel.mockResolvedValueOnce(1)
      redisMock.publish.mockResolvedValueOnce(0)

      await InAppNotificationService.push('user-1', { title: 'New', message: 'Msg', path: '/' })
      expect(redisMock.hdel).toHaveBeenCalled()
    })
  })

  // ── getAll ────────────────────────────────────────────────────────────────
  describe('getAll', () => {
    it('returns empty array when no notifications exist', async () => {
      redisMock.hgetall.mockResolvedValueOnce(null as any)
      const result = await InAppNotificationService.getAll('user-1')
      expect(result).toEqual([])
    })

    it('merges read status from read set', async () => {
      redisMock.hgetall.mockResolvedValueOnce({ 'notif-1': JSON.stringify(NOTIF) })
      redisMock.smembers.mockResolvedValueOnce(['notif-1'])

      const result = await InAppNotificationService.getAll('user-1')
      expect(result[0].isRead).toBe(true)
    })

    it('returns notifications sorted by createdAt descending', async () => {
      const older = { ...NOTIF, notificationId: 'old', createdAt: new Date(1000).toISOString() }
      const newer = { ...NOTIF, notificationId: 'new', createdAt: new Date(9000).toISOString() }
      redisMock.hgetall.mockResolvedValueOnce({
        old: JSON.stringify(older),
        new: JSON.stringify(newer),
      })
      redisMock.smembers.mockResolvedValueOnce([])

      const result = await InAppNotificationService.getAll('user-1')
      expect(result[0].notificationId).toBe('new')
    })
  })

  // ── unreadCount ───────────────────────────────────────────────────────────
  describe('unreadCount', () => {
    it('returns the count of unread notifications', async () => {
      redisMock.hgetall.mockResolvedValueOnce({
        'n1': JSON.stringify({ ...NOTIF, notificationId: 'n1' }),
        'n2': JSON.stringify({ ...NOTIF, notificationId: 'n2' }),
      })
      redisMock.smembers.mockResolvedValueOnce(['n1']) // n1 is read

      const count = await InAppNotificationService.unreadCount('user-1')
      expect(count).toBe(1) // only n2 is unread
    })
  })

  // ── markAsRead ────────────────────────────────────────────────────────────
  describe('markAsRead', () => {
    it('adds notification ID to the read set with TTL', async () => {
      redisMock.sadd.mockResolvedValueOnce(1)
      redisMock.expire.mockResolvedValueOnce(1)
      await InAppNotificationService.markAsRead('user-1', 'notif-1')
      expect(redisMock.sadd).toHaveBeenCalled()
      expect(redisMock.expire).toHaveBeenCalled()
    })
  })

  // ── markAllAsRead ─────────────────────────────────────────────────────────
  describe('markAllAsRead', () => {
    it('does nothing when there are no notifications', async () => {
      redisMock.hgetall.mockResolvedValueOnce(null as any)
      await InAppNotificationService.markAllAsRead('user-1')
      expect(redisMock.sadd).not.toHaveBeenCalled()
    })

    it('marks all notification IDs as read', async () => {
      redisMock.hgetall.mockResolvedValueOnce({ 'n1': JSON.stringify(NOTIF) })
      redisMock.smembers.mockResolvedValueOnce([])
      redisMock.sadd.mockResolvedValueOnce(1)
      redisMock.expire.mockResolvedValueOnce(1)

      await InAppNotificationService.markAllAsRead('user-1')
      expect(redisMock.sadd).toHaveBeenCalled()
    })
  })

  // ── deleteOne ─────────────────────────────────────────────────────────────
  describe('deleteOne', () => {
    it('removes from both hash and read set', async () => {
      redisMock.hdel.mockResolvedValueOnce(1)
      redisMock.srem.mockResolvedValueOnce(1)
      await InAppNotificationService.deleteOne('user-1', 'notif-1')
      expect(redisMock.hdel).toHaveBeenCalled()
      expect(redisMock.srem).toHaveBeenCalled()
    })
  })

  // ── clearAll ──────────────────────────────────────────────────────────────
  describe('clearAll', () => {
    it('deletes both hash and read-set keys', async () => {
      redisMock.del.mockResolvedValue(1)
      await InAppNotificationService.clearAll('user-1')
      expect(redisMock.del).toHaveBeenCalledTimes(2)
    })
  })

  // ── pushToAdmins ──────────────────────────────────────────────────────────
  describe('pushToAdmins', () => {
    it('pushes notification to every admin user', async () => {
      ;(prismaMock.user.findMany as jest.Mock).mockResolvedValueOnce([
        { userId: 'admin-1' },
        { userId: 'admin-2' },
      ])
      redisMock.hset.mockResolvedValue(1)
      redisMock.expire.mockResolvedValue(1)
      redisMock.hgetall.mockResolvedValue({})
      redisMock.smembers.mockResolvedValue([])
      redisMock.publish.mockResolvedValue(0)

      await InAppNotificationService.pushToAdmins({ title: 'Admin alert', message: 'Important', path: '/' })
      expect(redisMock.publish).toHaveBeenCalledTimes(2)
    })
  })
})
