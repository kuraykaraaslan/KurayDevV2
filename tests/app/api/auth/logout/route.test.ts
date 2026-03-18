/**
 * Phase 28 – HTTP contract tests for POST /api/auth/logout
 */

// ── mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/services/AuthService/AuthMiddleware', () => ({
  __esModule: true,
  default: {
    authenticateUserByRequest: jest.fn(),
  },
}))

jest.mock('@/services/AuthService/UserSessionService', () => ({
  __esModule: true,
  default: {
    deleteSession: jest.fn().mockResolvedValue(undefined),
  },
}))

// ── imports ───────────────────────────────────────────────────────────────────

import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { POST } from '@/app/(api)/api/auth/logout/route'

const authMock = AuthMiddleware as jest.Mocked<typeof AuthMiddleware>
const sessionMock = UserSessionService as jest.Mocked<typeof UserSessionService>

// ── helpers ───────────────────────────────────────────────────────────────────

function buildRequest(options: { origin?: string } = {}) {
  return {
    headers: {
      get: jest.fn((key: string) => {
        if (key === 'origin') return options.origin ?? null
        return null
      }),
    },
    cookies: { get: jest.fn().mockReturnValue(undefined) },
  } as any
}

const FAKE_SESSION = { userSessionId: 'sess-logout' }

// ── tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── 200 – authenticated user ─────────────────────────────────────────────
  describe('authenticated user', () => {
    it('returns 200 with logout message', async () => {
      authMock.authenticateUserByRequest.mockResolvedValueOnce({
        user: { userId: 'u-1' },
        userSession: FAKE_SESSION,
      } as any)

      const response = await POST(buildRequest())
      const payload = await response.json()

      expect(response.status).toBe(200)
      expect(payload).toHaveProperty('message')
    })

    it('clears accessToken and refreshToken cookies', async () => {
      authMock.authenticateUserByRequest.mockResolvedValueOnce({
        user: { userId: 'u-1' },
        userSession: FAKE_SESSION,
      } as any)

      const response = await POST(buildRequest())
      const setCookieHeader = response.headers.get('set-cookie') ?? ''

      expect(setCookieHeader).toContain('accessToken')
      expect(setCookieHeader).toContain('refreshToken')
    })

    it('calls deleteSession with the resolved session object', async () => {
      authMock.authenticateUserByRequest.mockResolvedValueOnce({
        user: { userId: 'u-1' },
        userSession: FAKE_SESSION,
      } as any)

      await POST(buildRequest())

      expect(sessionMock.deleteSession).toHaveBeenCalledWith(FAKE_SESSION)
    })
  })

  // ── 500 – unauthenticated / middleware throws ─────────────────────────────
  describe('authentication failure', () => {
    it('returns 500 when authenticateUserByRequest throws', async () => {
      authMock.authenticateUserByRequest.mockRejectedValueOnce(
        new Error('UNAUTHORIZED')
      )

      const response = await POST(buildRequest())

      expect(response.status).toBe(500)
    })

    it('includes a message in the 500 body', async () => {
      authMock.authenticateUserByRequest.mockRejectedValueOnce(
        new Error('UNAUTHORIZED')
      )

      const response = await POST(buildRequest())
      const payload = await response.json()

      expect(payload).toHaveProperty('message')
    })
  })
})
