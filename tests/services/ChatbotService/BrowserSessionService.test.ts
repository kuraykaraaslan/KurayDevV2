jest.mock('@/libs/redis', () => ({
  __esModule: true,
  default: {
    get:  jest.fn(),
    set:  jest.fn(),
    del:  jest.fn(),
  },
}))

jest.mock('@/services/ChatbotService/ChatSessionService', () => ({
  __esModule: true,
  default: {
    getSession:    jest.fn(),
    updateSession: jest.fn(),
    getMessages:   jest.fn(),
  },
}))

jest.mock('@/libs/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

import redis from '@/libs/redis'
import ChatSessionService from '@/services/ChatbotService/ChatSessionService'
import BrowserSessionService from '@/services/ChatbotService/BrowserSessionService'

const redisMock = redis as jest.Mocked<typeof redis>
const sessionMock = ChatSessionService as jest.Mocked<typeof ChatSessionService>

const SESSION = {
  chatSessionId: 'sess-1',
  userId: 'user-1',
  browserId: 'browser-1',
  status: 'ACTIVE' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const MESSAGES = [
  { id: 'm1', role: 'USER' as const, content: 'hello', createdAt: new Date().toISOString() },
]

describe('BrowserSessionService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── restoreSession ────────────────────────────────────────────────────────
  describe('restoreSession', () => {
    it('returns null when no browser session key in Redis', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      const result = await BrowserSessionService.restoreSession('user-1', 'browser-1')
      expect(result).toBeNull()
    })

    it('returns null and deletes key when session not found in ChatSessionService', async () => {
      redisMock.get.mockResolvedValueOnce('sess-1')
      sessionMock.getSession.mockResolvedValueOnce(undefined)
      const result = await BrowserSessionService.restoreSession('user-1', 'browser-1')
      expect(result).toBeNull()
      expect(redisMock.del).toHaveBeenCalled()
    })

    it('returns null when session status is CLOSED', async () => {
      redisMock.get.mockResolvedValueOnce('sess-1')
      sessionMock.getSession.mockResolvedValueOnce({ ...SESSION, status: 'CLOSED' })
      const result = await BrowserSessionService.restoreSession('user-1', 'browser-1')
      expect(result).toBeNull()
    })

    it('returns null when userId does not match (non-guest)', async () => {
      redisMock.get.mockResolvedValueOnce('sess-1')
      sessionMock.getSession.mockResolvedValueOnce({ ...SESSION, userId: 'other-user' })
      const result = await BrowserSessionService.restoreSession('user-1', 'browser-1')
      expect(result).toBeNull()
      expect(redisMock.del).toHaveBeenCalled()
    })

    it('returns session and messages on valid restore (no disconnect key)', async () => {
      redisMock.get
        .mockResolvedValueOnce('sess-1') // BROWSER_SESSION key
        .mockResolvedValueOnce(null)     // DISCONNECT_KEY → no disconnect record
      sessionMock.getSession.mockResolvedValueOnce(SESSION)
      sessionMock.getMessages.mockResolvedValueOnce(MESSAGES)

      const result = await BrowserSessionService.restoreSession('user-1', 'browser-1')
      expect(result).not.toBeNull()
      expect(result!.session.chatSessionId).toBe('sess-1')
      expect(result!.messages).toEqual(MESSAGES)
    })

    it('auto-closes and returns null when browser was disconnected too long ago', async () => {
      const oldTimestamp = (Date.now() - 10 * 60 * 1000).toString() // 10 min ago
      redisMock.get
        .mockResolvedValueOnce('sess-1')     // BROWSER_SESSION key
        .mockResolvedValueOnce(oldTimestamp) // DISCONNECT_KEY
      sessionMock.getSession.mockResolvedValueOnce(SESSION)
      sessionMock.updateSession.mockResolvedValueOnce(undefined as any)

      const result = await BrowserSessionService.restoreSession('user-1', 'browser-1')
      expect(result).toBeNull()
      expect(sessionMock.updateSession).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'CLOSED' })
      )
    })

    it('clears disconnect key and restores when disconnected recently', async () => {
      const recentTimestamp = (Date.now() - 30 * 1000).toString() // 30s ago
      redisMock.get
        .mockResolvedValueOnce('sess-1')       // BROWSER_SESSION
        .mockResolvedValueOnce(recentTimestamp) // DISCONNECT_KEY → recent, OK
      sessionMock.getSession.mockResolvedValueOnce(SESSION)
      sessionMock.getMessages.mockResolvedValueOnce(MESSAGES)

      const result = await BrowserSessionService.restoreSession('user-1', 'browser-1')
      expect(result).not.toBeNull()
      expect(redisMock.del).toHaveBeenCalled()
    })

    it('verifies by browserId for guest users instead of userId', async () => {
      const guestSession = { ...SESSION, userId: 'guest:abc', browserId: 'browser-g' }
      redisMock.get
        .mockResolvedValueOnce('sess-g')
        .mockResolvedValueOnce(null)
      sessionMock.getSession.mockResolvedValueOnce(guestSession)
      sessionMock.getMessages.mockResolvedValueOnce([])

      const result = await BrowserSessionService.restoreSession('guest:abc', 'browser-g', true)
      expect(result).not.toBeNull()
    })
  })

  // ── markBrowserDisconnected ───────────────────────────────────────────────
  describe('markBrowserDisconnected', () => {
    it('sets DISCONNECT_KEY with current timestamp and TTL', async () => {
      redisMock.set.mockResolvedValueOnce('OK')
      await BrowserSessionService.markBrowserDisconnected('browser-1')
      expect(redisMock.set).toHaveBeenCalledWith(
        expect.stringContaining('browser-1'),
        expect.any(String),
        'EX',
        expect.any(Number)
      )
    })
  })

  // ── cancelBrowserDisconnect ───────────────────────────────────────────────
  describe('cancelBrowserDisconnect', () => {
    it('deletes the DISCONNECT_KEY for the browser', async () => {
      redisMock.del.mockResolvedValueOnce(1)
      await BrowserSessionService.cancelBrowserDisconnect('browser-1')
      expect(redisMock.del).toHaveBeenCalledWith(expect.stringContaining('browser-1'))
    })
  })

  // ── getSessionIdByBrowser ─────────────────────────────────────────────────
  describe('getSessionIdByBrowser', () => {
    it('returns session ID from Redis', async () => {
      redisMock.get.mockResolvedValueOnce('sess-lookup')
      const id = await BrowserSessionService.getSessionIdByBrowser('browser-1')
      expect(id).toBe('sess-lookup')
    })

    it('returns null when no session is linked', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      const id = await BrowserSessionService.getSessionIdByBrowser('unknown-browser')
      expect(id).toBeNull()
    })
  })

  // ── linkBrowserToSession ──────────────────────────────────────────────────
  describe('linkBrowserToSession', () => {
    it('stores the session ID under the BROWSER_SESSION key with TTL', async () => {
      redisMock.set.mockResolvedValueOnce('OK')
      await BrowserSessionService.linkBrowserToSession('browser-1', 'sess-new')
      expect(redisMock.set).toHaveBeenCalledWith(
        expect.stringContaining('browser-1'),
        'sess-new',
        'EX',
        expect.any(Number)
      )
    })
  })
})
