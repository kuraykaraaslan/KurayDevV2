import redis from '@/libs/redis'
import BrowserSessionService from '@/services/ChatbotService/BrowserSessionService'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/services/ChatbotService/constants', () => ({
  BROWSER_SESSION: (browserId: string) => `chatbot:browser:${browserId}`,
  DISCONNECT_KEY: (browserId: string) => `chatbot:disconnect:${browserId}`,
  SESSION_TTL_SECONDS: 604800,
  SESSION_CLOSE_TIMEOUT_SECONDS: 300,
}))

jest.mock('@/services/ChatbotService/ChatSessionService', () => ({
  __esModule: true,
  default: {
    getSession: jest.fn(),
    updateSession: jest.fn(),
    getMessages: jest.fn(),
  },
}))

// ── Typed references ──────────────────────────────────────────────────────────

import ChatSessionService from '@/services/ChatbotService/ChatSessionService'

const redisMock = redis as jest.Mocked<typeof redis>
const chatSessionServiceMock = ChatSessionService as jest.Mocked<typeof ChatSessionService>

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeSession = (overrides: Partial<{
  chatSessionId: string
  userId: string
  browserId: string
  status: 'ACTIVE' | 'CLOSED' | 'TAKEN_OVER'
}> = {}) => ({
  chatSessionId: 'session-abc',
  userId: 'user-123',
  browserId: 'browser-xyz',
  status: 'ACTIVE' as const,
  userEmail: 'user@example.com',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BrowserSessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── restoreSession ───────────────────────────────────────────────────────────

  describe('restoreSession', () => {
    it('returns null when no chatSessionId found in redis', async () => {
      redisMock.get.mockResolvedValue(null)

      const result = await BrowserSessionService.restoreSession('user-123', 'browser-xyz')

      expect(result).toBeNull()
      expect(chatSessionServiceMock.getSession).not.toHaveBeenCalled()
    })

    it('returns null and clears browser key when session not found in ChatSessionService', async () => {
      redisMock.get.mockResolvedValue('session-abc')
      chatSessionServiceMock.getSession.mockResolvedValue(undefined)

      const result = await BrowserSessionService.restoreSession('user-123', 'browser-xyz')

      expect(result).toBeNull()
      expect(redisMock.del).toHaveBeenCalledWith('chatbot:browser:browser-xyz')
    })

    it('returns null and clears browser key when session.userId does not match for logged-in user', async () => {
      redisMock.get.mockResolvedValue('session-abc')
      chatSessionServiceMock.getSession.mockResolvedValue(
        makeSession({ userId: 'different-user' })
      )

      const result = await BrowserSessionService.restoreSession('user-123', 'browser-xyz', false)

      expect(result).toBeNull()
      expect(redisMock.del).toHaveBeenCalledWith('chatbot:browser:browser-xyz')
    })

    it('returns null and clears browser key when isGuest=true and session.browserId does not match', async () => {
      redisMock.get.mockResolvedValue('session-abc')
      chatSessionServiceMock.getSession.mockResolvedValue(
        makeSession({ browserId: 'different-browser' })
      )

      const result = await BrowserSessionService.restoreSession('user-123', 'browser-xyz', true)

      expect(result).toBeNull()
      expect(redisMock.del).toHaveBeenCalledWith('chatbot:browser:browser-xyz')
    })

    it('returns null and clears browser key when session.status is CLOSED', async () => {
      redisMock.get.mockResolvedValue('session-abc')
      chatSessionServiceMock.getSession.mockResolvedValue(
        makeSession({ status: 'CLOSED', userId: 'user-123' })
      )

      const result = await BrowserSessionService.restoreSession('user-123', 'browser-xyz')

      expect(result).toBeNull()
      expect(redisMock.del).toHaveBeenCalledWith('chatbot:browser:browser-xyz')
    })

    it('returns null and closes session when elapsed time exceeds SESSION_CLOSE_TIMEOUT_SECONDS', async () => {
      const session = makeSession({ userId: 'user-123' })
      // SESSION_CLOSE_TIMEOUT_SECONDS is mocked to 300; elapsed = 400s ago
      const pastTimestamp = (Date.now() - 400_000).toString()

      redisMock.get
        .mockResolvedValueOnce('session-abc')  // BROWSER_SESSION lookup
        .mockResolvedValueOnce(pastTimestamp)   // DISCONNECT_KEY lookup

      chatSessionServiceMock.getSession.mockResolvedValue(session)
      chatSessionServiceMock.updateSession.mockResolvedValue(undefined)

      const result = await BrowserSessionService.restoreSession('user-123', 'browser-xyz')

      expect(result).toBeNull()
      expect(session.status).toBe('CLOSED')
      expect(chatSessionServiceMock.updateSession).toHaveBeenCalledWith(session)
      expect(redisMock.del).toHaveBeenCalledWith('chatbot:browser:browser-xyz')
      expect(redisMock.del).toHaveBeenCalledWith('chatbot:disconnect:browser-xyz')
    })

    it('clears disconnect key and continues restoring when elapsed is within timeout', async () => {
      const session = makeSession({ userId: 'user-123' })
      const messages = [{ id: 'msg-1', role: 'USER' as const, content: 'hello', createdAt: new Date().toISOString() }]
      // elapsed = 60s, within the 300s timeout
      const recentTimestamp = (Date.now() - 60_000).toString()

      redisMock.get
        .mockResolvedValueOnce('session-abc')    // BROWSER_SESSION lookup
        .mockResolvedValueOnce(recentTimestamp)  // DISCONNECT_KEY lookup

      chatSessionServiceMock.getSession.mockResolvedValue(session)
      chatSessionServiceMock.getMessages.mockResolvedValue(messages)

      const result = await BrowserSessionService.restoreSession('user-123', 'browser-xyz')

      expect(redisMock.del).toHaveBeenCalledWith('chatbot:disconnect:browser-xyz')
      expect(result).toEqual({ session, messages })
    })

    it('returns { session, messages } on successful restore with no disconnect key', async () => {
      const session = makeSession({ userId: 'user-123' })
      const messages = [{ id: 'msg-1', role: 'USER' as const, content: 'hello', createdAt: new Date().toISOString() }]

      redisMock.get
        .mockResolvedValueOnce('session-abc') // BROWSER_SESSION
        .mockResolvedValueOnce(null)          // DISCONNECT_KEY — not set

      chatSessionServiceMock.getSession.mockResolvedValue(session)
      chatSessionServiceMock.getMessages.mockResolvedValue(messages)

      const result = await BrowserSessionService.restoreSession('user-123', 'browser-xyz')

      expect(result).toEqual({ session, messages })
      expect(chatSessionServiceMock.getMessages).toHaveBeenCalledWith('session-abc')
    })

    it('verifies by browserId when isGuest=true and browserId matches', async () => {
      const session = makeSession({ browserId: 'browser-xyz', userId: 'guest-id' })
      const messages: never[] = []

      redisMock.get
        .mockResolvedValueOnce('session-abc')
        .mockResolvedValueOnce(null)

      chatSessionServiceMock.getSession.mockResolvedValue(session)
      chatSessionServiceMock.getMessages.mockResolvedValue(messages)

      const result = await BrowserSessionService.restoreSession('does-not-matter', 'browser-xyz', true)

      expect(result).toEqual({ session, messages })
    })
  })

  // ── markBrowserDisconnected ──────────────────────────────────────────────────

  describe('markBrowserDisconnected', () => {
    it('calls redis.set with the disconnect key and a timestamp', async () => {
      await BrowserSessionService.markBrowserDisconnected('browser-xyz')

      expect(redisMock.set).toHaveBeenCalledWith(
        'chatbot:disconnect:browser-xyz',
        expect.any(String),
        'EX',
        360  // SESSION_CLOSE_TIMEOUT_SECONDS (300) + 60
      )
    })

    it('stores a numeric timestamp string', async () => {
      const before = Date.now()
      await BrowserSessionService.markBrowserDisconnected('browser-xyz')
      const after = Date.now()

      const [, storedValue] = redisMock.set.mock.calls[0]
      const ts = parseInt(storedValue as string, 10)
      expect(ts).toBeGreaterThanOrEqual(before)
      expect(ts).toBeLessThanOrEqual(after)
    })
  })

  // ── cancelBrowserDisconnect ──────────────────────────────────────────────────

  describe('cancelBrowserDisconnect', () => {
    it('calls redis.del with the disconnect key', async () => {
      await BrowserSessionService.cancelBrowserDisconnect('browser-xyz')

      expect(redisMock.del).toHaveBeenCalledWith('chatbot:disconnect:browser-xyz')
      expect(redisMock.del).toHaveBeenCalledTimes(1)
    })
  })

  // ── getSessionIdByBrowser ────────────────────────────────────────────────────

  describe('getSessionIdByBrowser', () => {
    it('calls redis.get with the browser session key and returns the value', async () => {
      redisMock.get.mockResolvedValue('session-abc')

      const result = await BrowserSessionService.getSessionIdByBrowser('browser-xyz')

      expect(redisMock.get).toHaveBeenCalledWith('chatbot:browser:browser-xyz')
      expect(result).toBe('session-abc')
    })

    it('returns null when no session is linked to the browser', async () => {
      redisMock.get.mockResolvedValue(null)

      const result = await BrowserSessionService.getSessionIdByBrowser('browser-xyz')

      expect(result).toBeNull()
    })
  })

  // ── linkBrowserToSession ─────────────────────────────────────────────────────

  describe('linkBrowserToSession', () => {
    it('calls redis.set with browser session key, chatSessionId, and TTL', async () => {
      await BrowserSessionService.linkBrowserToSession('browser-xyz', 'session-abc')

      expect(redisMock.set).toHaveBeenCalledWith(
        'chatbot:browser:browser-xyz',
        'session-abc',
        'EX',
        604800  // SESSION_TTL_SECONDS from mocked constants
      )
    })

    it('stores only the provided chatSessionId (no mutation)', async () => {
      await BrowserSessionService.linkBrowserToSession('browser-abc', 'session-999')

      const [key, value] = redisMock.set.mock.calls[0]
      expect(key).toBe('chatbot:browser:browser-abc')
      expect(value).toBe('session-999')
    })
  })
})
