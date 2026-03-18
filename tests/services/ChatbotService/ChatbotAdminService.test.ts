import ChatbotAdminService from '@/services/ChatbotService/ChatbotAdminService'
import ChatSessionService from '@/services/ChatbotService/ChatSessionService'
import ChatSessionDBService from '@/services/ChatbotService/ChatSessionDBService'
import redis from '@/libs/redis'

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/libs/redis', () => ({
  __esModule: true,
  default: {
    zadd: jest.fn(),
  },
}))

jest.mock('@/services/ChatbotService/ChatSessionService', () => ({
  __esModule: true,
  default: {
    getSession:    jest.fn(),
    updateSession: jest.fn().mockResolvedValue(undefined),
    addMessage:    jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@/services/ChatbotService/ChatSessionDBService', () => ({
  __esModule: true,
  default: {
    getStats: jest.fn(),
  },
}))

jest.mock('@/libs/websocket/WSManager', () => ({
  __esModule: true,
  default: {
    publish: jest.fn(),
  },
}))

jest.mock('@/libs/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

// ── Imports after mocking ─────────────────────────────────────────────────────

import wsManager from '@/libs/websocket/WSManager'
import ChatbotMessages from '@/messages/ChatbotMessages'

// ── Helpers ───────────────────────────────────────────────────────────────────

const sessionServiceMock = ChatSessionService as jest.Mocked<typeof ChatSessionService>
const dbServiceMock      = ChatSessionDBService as jest.Mocked<typeof ChatSessionDBService>
const redisMock          = redis as jest.Mocked<typeof redis>
const wsMock             = wsManager as jest.Mocked<typeof wsManager>

const BASE_SESSION = {
  chatSessionId: 'cs_test_001',
  userId:        'user-123',
  userEmail:     'user@example.com',
  status:        'ACTIVE' as const,
  createdAt:     '2026-03-18T10:00:00.000Z',
  updatedAt:     '2026-03-18T10:00:00.000Z',
}

const ADMIN_STATS = {
  totalSessions:        10,
  activeSessions:       4,
  closedSessions:       5,
  takenOverSessions:    1,
  totalMessages:        80,
  avgMessagesPerSession: 8,
  uniqueUsers:          7,
  recentSessions:       [],
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChatbotAdminService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── takeoverSession ────────────────────────────────────────────────────────
  describe('takeoverSession', () => {
    it('sets session status to TAKEN_OVER and assigns takenOverBy', async () => {
      const session = { ...BASE_SESSION }
      sessionServiceMock.getSession.mockResolvedValueOnce(session)

      await ChatbotAdminService.takeoverSession('cs_test_001', 'admin-001')

      expect(session.status).toBe('TAKEN_OVER')
      expect((session as any).takenOverBy).toBe('admin-001')
      expect(sessionServiceMock.updateSession).toHaveBeenCalledWith(session)
    })

    it('publishes a session_update WS event after takeover', async () => {
      const session = { ...BASE_SESSION }
      sessionServiceMock.getSession.mockResolvedValueOnce(session)

      await ChatbotAdminService.takeoverSession('cs_test_001', 'admin-001')

      expect(wsMock.publish).toHaveBeenCalledWith(
        'chatbot',
        'cs_test_001',
        expect.objectContaining({ type: 'session_update', status: 'TAKEN_OVER' }),
      )
    })

    it('throws SESSION_NOT_FOUND when session does not exist', async () => {
      sessionServiceMock.getSession.mockResolvedValueOnce(undefined)

      await expect(
        ChatbotAdminService.takeoverSession('nonexistent', 'admin-001'),
      ).rejects.toThrow(ChatbotMessages.SESSION_NOT_FOUND)
    })
  })

  // ── releaseSession ─────────────────────────────────────────────────────────
  describe('releaseSession', () => {
    it('sets session status back to ACTIVE and clears takenOverBy', async () => {
      const session = { ...BASE_SESSION, status: 'TAKEN_OVER' as const, takenOverBy: 'admin-001' }
      sessionServiceMock.getSession.mockResolvedValueOnce(session)

      await ChatbotAdminService.releaseSession('cs_test_001')

      expect(session.status).toBe('ACTIVE')
      expect((session as any).takenOverBy).toBeUndefined()
    })

    it('publishes a session_update WS event after release', async () => {
      const session = { ...BASE_SESSION, status: 'TAKEN_OVER' as const, takenOverBy: 'admin-001' }
      sessionServiceMock.getSession.mockResolvedValueOnce(session)

      await ChatbotAdminService.releaseSession('cs_test_001')

      expect(wsMock.publish).toHaveBeenCalledWith(
        'chatbot',
        'cs_test_001',
        expect.objectContaining({ type: 'session_update', status: 'ACTIVE' }),
      )
    })

    it('throws SESSION_NOT_FOUND when session does not exist', async () => {
      sessionServiceMock.getSession.mockResolvedValueOnce(undefined)

      await expect(ChatbotAdminService.releaseSession('nonexistent')).rejects.toThrow(
        ChatbotMessages.SESSION_NOT_FOUND,
      )
    })
  })

  // ── closeSession ───────────────────────────────────────────────────────────
  describe('closeSession', () => {
    it('sets session status to CLOSED', async () => {
      const session = { ...BASE_SESSION }
      sessionServiceMock.getSession.mockResolvedValueOnce(session)

      await ChatbotAdminService.closeSession('cs_test_001')

      expect(session.status).toBe('CLOSED')
      expect(sessionServiceMock.updateSession).toHaveBeenCalledWith(session)
    })

    it('publishes a session_update WS event after closing', async () => {
      const session = { ...BASE_SESSION }
      sessionServiceMock.getSession.mockResolvedValueOnce(session)

      await ChatbotAdminService.closeSession('cs_test_001')

      expect(wsMock.publish).toHaveBeenCalledWith(
        'chatbot',
        'cs_test_001',
        expect.objectContaining({ type: 'session_update', status: 'CLOSED' }),
      )
    })

    it('throws SESSION_NOT_FOUND when session does not exist', async () => {
      sessionServiceMock.getSession.mockResolvedValueOnce(undefined)

      await expect(ChatbotAdminService.closeSession('nonexistent')).rejects.toThrow(
        ChatbotMessages.SESSION_NOT_FOUND,
      )
    })
  })

  // ── adminReply ─────────────────────────────────────────────────────────────
  describe('adminReply', () => {
    it('creates and returns a stored ADMIN message', async () => {
      const session = { ...BASE_SESSION }
      sessionServiceMock.getSession.mockResolvedValueOnce(session)
      redisMock.zadd.mockResolvedValue(1 as any)

      const msg = await ChatbotAdminService.adminReply({
        chatSessionId: 'cs_test_001',
        message:       'Hello user, I am here to help.',
        adminUserId:   'admin-001',
      })

      expect(msg.role).toBe('ADMIN')
      expect(msg.content).toBe('Hello user, I am here to help.')
      expect(msg.adminUserId).toBe('admin-001')
      expect(msg.id).toMatch(/^msg_/)
    })

    it('auto-promotes ACTIVE session to TAKEN_OVER when admin replies', async () => {
      const session = { ...BASE_SESSION, status: 'ACTIVE' as const }
      sessionServiceMock.getSession.mockResolvedValueOnce(session)
      redisMock.zadd.mockResolvedValue(1 as any)

      await ChatbotAdminService.adminReply({
        chatSessionId: 'cs_test_001',
        message:       'Hi!',
        adminUserId:   'admin-001',
      })

      expect(session.status).toBe('TAKEN_OVER')
      expect(session.takenOverBy).toBe('admin-001')
    })

    it('does not change TAKEN_OVER session status on subsequent replies', async () => {
      const session = { ...BASE_SESSION, status: 'TAKEN_OVER' as const, takenOverBy: 'admin-001' }
      sessionServiceMock.getSession.mockResolvedValueOnce(session)
      redisMock.zadd.mockResolvedValue(1 as any)

      await ChatbotAdminService.adminReply({
        chatSessionId: 'cs_test_001',
        message:       'Follow-up message.',
        adminUserId:   'admin-001',
      })

      // updateSession should NOT be called again for an already TAKEN_OVER session
      expect(sessionServiceMock.updateSession).not.toHaveBeenCalled()
    })

    it('publishes new_message WS event after admin reply', async () => {
      const session = { ...BASE_SESSION }
      sessionServiceMock.getSession.mockResolvedValueOnce(session)
      redisMock.zadd.mockResolvedValue(1 as any)

      await ChatbotAdminService.adminReply({
        chatSessionId: 'cs_test_001',
        message:       'Admin reply',
        adminUserId:   'admin-001',
      })

      expect(wsMock.publish).toHaveBeenCalledWith(
        'chatbot',
        'cs_test_001',
        expect.objectContaining({ type: 'new_message' }),
      )
    })

    it('throws SESSION_NOT_FOUND when session does not exist', async () => {
      sessionServiceMock.getSession.mockResolvedValueOnce(undefined)

      await expect(
        ChatbotAdminService.adminReply({
          chatSessionId: 'nonexistent',
          message:       'Hi',
          adminUserId:   'admin-001',
        }),
      ).rejects.toThrow(ChatbotMessages.SESSION_NOT_FOUND)
    })
  })

  // ── getStats ───────────────────────────────────────────────────────────────
  describe('getStats', () => {
    it('delegates to ChatSessionDBService.getStats and returns the result', async () => {
      dbServiceMock.getStats.mockResolvedValueOnce(ADMIN_STATS)

      const stats = await ChatbotAdminService.getStats()

      expect(stats).toEqual(ADMIN_STATS)
      expect(dbServiceMock.getStats).toHaveBeenCalledTimes(1)
    })

    it('returns stats with correct session counts', async () => {
      dbServiceMock.getStats.mockResolvedValueOnce(ADMIN_STATS)

      const stats = await ChatbotAdminService.getStats()

      expect(stats.totalSessions).toBe(10)
      expect(stats.activeSessions).toBe(4)
      expect(stats.takenOverSessions).toBe(1)
    })
  })
})
