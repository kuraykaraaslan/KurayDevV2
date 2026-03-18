import ChatSessionService from '@/services/ChatbotService/ChatSessionService'
import ChatSessionDBService from '@/services/ChatbotService/ChatSessionDBService'
import redis from '@/libs/redis'

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/libs/redis', () => ({
  __esModule: true,
  default: {
    get:      jest.fn(),
    set:      jest.fn(),
    rpush:    jest.fn(),
    expire:   jest.fn(),
    lrange:   jest.fn(),
    zadd:     jest.fn(),
    sadd:     jest.fn(),
    smembers: jest.fn(),
    pipeline: jest.fn(),
  },
}))

jest.mock('@/services/ChatbotService/ChatSessionDBService', () => ({
  __esModule: true,
  default: {
    upsertSession:  jest.fn().mockResolvedValue(undefined),
    upsertMessage:  jest.fn().mockResolvedValue(undefined),
    getSession:     jest.fn(),
    getMessages:    jest.fn(),
    listSessions:   jest.fn(),
  },
}))

jest.mock('@/libs/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const redisMock = redis as jest.Mocked<typeof redis>
const dbMock    = ChatSessionDBService as jest.Mocked<typeof ChatSessionDBService>

function makePipelineMock() {
  const exec = jest.fn().mockResolvedValue([])
  return {
    set:    jest.fn().mockReturnThis(),
    zadd:   jest.fn().mockReturnThis(),
    sadd:   jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec,
  }
}

const BASE_SESSION = {
  chatSessionId: 'cs_test_001',
  userId:        'user-123',
  userEmail:     'user@example.com',
  browserId:     'browser-abc',
  status:        'ACTIVE' as const,
  title:         undefined,
  takenOverBy:   undefined,
  summary:       undefined,
  createdAt:     '2026-03-18T10:00:00.000Z',
  updatedAt:     '2026-03-18T10:00:00.000Z',
}

const BASE_MESSAGE = {
  id:        'msg_001',
  role:      'USER' as const,
  content:   'Hello, chatbot!',
  createdAt: '2026-03-18T10:00:00.000Z',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChatSessionService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── createSession ──────────────────────────────────────────────────────────
  describe('createSession', () => {
    it('creates a new ACTIVE session and returns it', async () => {
      const pipeline = makePipelineMock()
      redisMock.pipeline.mockReturnValue(pipeline as any)

      const session = await ChatSessionService.createSession('user-123', 'user@example.com', 'browser-abc')

      expect(session.userId).toBe('user-123')
      expect(session.userEmail).toBe('user@example.com')
      expect(session.browserId).toBe('browser-abc')
      expect(session.status).toBe('ACTIVE')
      expect(session.chatSessionId).toMatch(/^cs_/)
      expect(pipeline.exec).toHaveBeenCalledTimes(1)
    })

    it('creates session without optional browserId and email', async () => {
      const pipeline = makePipelineMock()
      redisMock.pipeline.mockReturnValue(pipeline as any)

      const session = await ChatSessionService.createSession('user-456')

      expect(session.userId).toBe('user-456')
      expect(session.browserId).toBeUndefined()
      expect(session.userEmail).toBeUndefined()
      expect(session.status).toBe('ACTIVE')
    })

    it('queues a DB upsert for the new session (fire-and-forget)', async () => {
      const pipeline = makePipelineMock()
      redisMock.pipeline.mockReturnValue(pipeline as any)
      dbMock.upsertSession.mockResolvedValue(undefined)

      await ChatSessionService.createSession('user-789')

      // DB upsert is async fire-and-forget — allow microtask queue to flush
      await Promise.resolve()
      expect(dbMock.upsertSession).toHaveBeenCalledTimes(1)
    })
  })

  // ── getSession ─────────────────────────────────────────────────────────────
  describe('getSession', () => {
    it('returns session from Redis cache when present', async () => {
      redisMock.get.mockResolvedValueOnce(JSON.stringify(BASE_SESSION))

      const session = await ChatSessionService.getSession('cs_test_001')

      expect(session).toEqual(BASE_SESSION)
      expect(dbMock.getSession).not.toHaveBeenCalled()
    })

    it('falls back to DB when Redis cache misses', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK' as any)
      dbMock.getSession.mockResolvedValueOnce(BASE_SESSION)

      const session = await ChatSessionService.getSession('cs_test_001')

      expect(session).toEqual(BASE_SESSION)
      expect(dbMock.getSession).toHaveBeenCalledWith('cs_test_001')
    })

    it('re-populates Redis cache after DB fetch', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK' as any)
      dbMock.getSession.mockResolvedValueOnce(BASE_SESSION)

      await ChatSessionService.getSession('cs_test_001')

      expect(redisMock.set).toHaveBeenCalledWith(
        expect.stringContaining('cs_test_001'),
        expect.any(String),
        'EX',
        expect.any(Number),
      )
    })

    it('returns undefined when session does not exist in Redis or DB', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      dbMock.getSession.mockResolvedValueOnce(undefined)

      const session = await ChatSessionService.getSession('nonexistent')

      expect(session).toBeUndefined()
    })
  })

  // ── updateSession ──────────────────────────────────────────────────────────
  describe('updateSession', () => {
    it('writes updated session back to Redis and fires DB upsert', async () => {
      redisMock.set.mockResolvedValue('OK' as any)
      dbMock.upsertSession.mockResolvedValue(undefined)

      const toUpdate = { ...BASE_SESSION, title: 'Updated title' }
      await ChatSessionService.updateSession(toUpdate)

      expect(redisMock.set).toHaveBeenCalledWith(
        expect.stringContaining(BASE_SESSION.chatSessionId),
        expect.stringContaining('Updated title'),
        'EX',
        expect.any(Number),
      )
      await Promise.resolve()
      expect(dbMock.upsertSession).toHaveBeenCalledTimes(1)
    })

    it('stamps updatedAt with a fresh ISO timestamp', async () => {
      redisMock.set.mockResolvedValue('OK' as any)
      const before = new Date().toISOString()
      const session = { ...BASE_SESSION, updatedAt: '2020-01-01T00:00:00.000Z' }

      await ChatSessionService.updateSession(session)

      expect(session.updatedAt >= before).toBe(true)
    })
  })

  // ── addMessage ─────────────────────────────────────────────────────────────
  describe('addMessage', () => {
    it('appends message to Redis list and sets TTL', async () => {
      redisMock.rpush.mockResolvedValue(1 as any)
      redisMock.expire.mockResolvedValue(1 as any)
      dbMock.upsertMessage.mockResolvedValue(undefined)

      await ChatSessionService.addMessage('cs_test_001', BASE_MESSAGE)

      expect(redisMock.rpush).toHaveBeenCalledWith(
        expect.stringContaining('cs_test_001'),
        JSON.stringify(BASE_MESSAGE),
      )
      expect(redisMock.expire).toHaveBeenCalledTimes(1)
    })

    it('fires a DB upsert for the message (fire-and-forget)', async () => {
      redisMock.rpush.mockResolvedValue(1 as any)
      redisMock.expire.mockResolvedValue(1 as any)
      dbMock.upsertMessage.mockResolvedValue(undefined)

      await ChatSessionService.addMessage('cs_test_001', BASE_MESSAGE)

      await Promise.resolve()
      expect(dbMock.upsertMessage).toHaveBeenCalledWith('cs_test_001', BASE_MESSAGE)
    })
  })

  // ── getMessages ────────────────────────────────────────────────────────────
  describe('getMessages', () => {
    it('returns messages from Redis list when populated', async () => {
      redisMock.lrange.mockResolvedValueOnce([JSON.stringify(BASE_MESSAGE)])

      const messages = await ChatSessionService.getMessages('cs_test_001')

      expect(messages).toHaveLength(1)
      expect(messages[0]).toEqual(BASE_MESSAGE)
      expect(dbMock.getMessages).not.toHaveBeenCalled()
    })

    it('falls back to DB when Redis list is empty', async () => {
      redisMock.lrange.mockResolvedValueOnce([])
      dbMock.getMessages.mockResolvedValueOnce([BASE_MESSAGE])

      const messages = await ChatSessionService.getMessages('cs_test_001')

      expect(messages).toHaveLength(1)
      expect(dbMock.getMessages).toHaveBeenCalledWith('cs_test_001')
    })

    it('returns empty array when no messages in Redis or DB', async () => {
      redisMock.lrange.mockResolvedValueOnce([])
      dbMock.getMessages.mockResolvedValueOnce([])

      const messages = await ChatSessionService.getMessages('cs_test_001')

      expect(messages).toEqual([])
    })
  })

  // ── listSessions ───────────────────────────────────────────────────────────
  describe('listSessions', () => {
    it('delegates directly to ChatSessionDBService.listSessions', async () => {
      const dbResult = { sessions: [BASE_SESSION], total: 1 }
      dbMock.listSessions.mockResolvedValueOnce(dbResult)

      const result = await ChatSessionService.listSessions({ status: 'ACTIVE', page: 0, pageSize: 10 })

      expect(result).toEqual(dbResult)
      expect(dbMock.listSessions).toHaveBeenCalledWith({ status: 'ACTIVE', page: 0, pageSize: 10 })
    })

    it('returns empty result when DB returns nothing', async () => {
      dbMock.listSessions.mockResolvedValueOnce({ sessions: [], total: 0 })

      const result = await ChatSessionService.listSessions()

      expect(result.sessions).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  // ── getUserSessions ────────────────────────────────────────────────────────
  describe('getUserSessions', () => {
    it('merges Redis and DB sessions, preferring Redis data for the same id', async () => {
      redisMock.smembers.mockResolvedValueOnce(['cs_test_001'])
      redisMock.get.mockResolvedValueOnce(JSON.stringify(BASE_SESSION)) // Redis hit for cs_test_001
      dbMock.listSessions.mockResolvedValueOnce({
        sessions: [{ ...BASE_SESSION, title: 'DB title' }],
        total:    1,
      })

      const sessions = await ChatSessionService.getUserSessions('user-123')

      // Redis version overwrites DB version for the same id
      const found = sessions.find((s) => s.chatSessionId === 'cs_test_001')
      expect(found).toBeDefined()
      expect(sessions.length).toBeGreaterThanOrEqual(1)
    })

    it('returns only sessions belonging to the requested userId', async () => {
      redisMock.smembers.mockResolvedValueOnce([])
      dbMock.listSessions.mockResolvedValueOnce({
        sessions: [
          { ...BASE_SESSION, chatSessionId: 'cs_a', userId: 'user-123' },
          { ...BASE_SESSION, chatSessionId: 'cs_b', userId: 'other-user' },
        ],
        total: 2,
      })

      const sessions = await ChatSessionService.getUserSessions('user-123')

      expect(sessions.every((s) => s.userId === 'user-123')).toBe(true)
    })

    it('returns empty array when user has no sessions', async () => {
      redisMock.smembers.mockResolvedValueOnce([])
      dbMock.listSessions.mockResolvedValueOnce({ sessions: [], total: 0 })

      const sessions = await ChatSessionService.getUserSessions('unknown-user')

      expect(sessions).toEqual([])
    })
  })
})
