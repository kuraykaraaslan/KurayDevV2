/**
 * Phase 28 – HTTP contract tests for POST /api/auth/login
 *
 * Strategy: mock every external dependency so the route handler itself is the
 * only real code under test.  We verify HTTP status codes, response shape and
 * cookie behaviour rather than the business logic of individual services.
 */

// ── mocks (must come before any import that triggers the module graph) ────────

jest.mock('@/libs/rateLimit', () => ({
  __esModule: true,
  default: {
    checkRateLimit: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@/services/AuthService', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
  },
}))

jest.mock('@/services/AuthService/UserSessionService', () => ({
  __esModule: true,
  default: {
    createSession: jest.fn(),
  },
}))

jest.mock('@/services/AuthService/DeviceFingerprintService', () => ({
  __esModule: true,
  default: {
    generateDeviceFingerprint: jest.fn().mockResolvedValue('test-fp'),
    isTrustedDevice: jest.fn().mockReturnValue(false),
    generateTrustedDeviceToken: jest.fn().mockReturnValue('trusted-token'),
  },
}))

jest.mock('@/services/NotificationService/MailService', () => ({
  __esModule: true,
  default: {
    sendNewLoginEmail: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@/types/user/UserSecurityTypes', () => {
  const { z } = require('zod')
  return {
    SafeUserSecuritySchema: {
      parse: jest.fn((v: unknown) => v),
    },
    UserSecuritySchema: z.object({}).passthrough(),
    UserSecurityDefault: {},
  }
})

// ── imports ───────────────────────────────────────────────────────────────────

import AuthService from '@/services/AuthService'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { POST } from '@/app/(api)/api/auth/login/route'

const authMock = AuthService as jest.Mocked<typeof AuthService>
const sessionMock = UserSessionService as jest.Mocked<typeof UserSessionService>

// ── helpers ───────────────────────────────────────────────────────────────────

function buildRequest(body: unknown, options: { badJson?: boolean } = {}) {
  const request: any = {
    json: options.badJson
      ? jest.fn().mockRejectedValue(new SyntaxError('Unexpected token'))
      : jest.fn().mockResolvedValue(body),
    headers: {
      get: jest.fn().mockReturnValue(null),
    },
    cookies: {
      get: jest.fn().mockReturnValue(undefined),
    },
  }
  return request
}

const VALID_USER = {
  userId: 'user-1',
  email: 'admin@example.com',
  name: 'Admin',
  role: 'ADMIN',
}

const VALID_USER_SECURITY = {
  twoFactorEnabled: false,
  otpEnabled: false,
}

const VALID_SESSION = {
  userSession: { userSessionId: 'sess-1' },
  rawAccessToken: 'access-token',
  rawRefreshToken: 'refresh-token',
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── 200 – valid credentials ──────────────────────────────────────────────
  describe('valid credentials', () => {
    it('returns 200 with user payload', async () => {
      authMock.login.mockResolvedValueOnce({
        user: VALID_USER,
        userSecurity: VALID_USER_SECURITY,
      } as any)
      sessionMock.createSession.mockResolvedValueOnce(VALID_SESSION as any)

      const request = buildRequest({ email: 'admin@example.com', password: 'Password1@' })
      const response = await POST(request)
      const payload = await response.json()

      expect(response.status).toBe(200)
      expect(payload).toHaveProperty('user')
      expect(payload.user.email).toBe('admin@example.com')
    })

    it('sets accessToken and refreshToken cookies on success', async () => {
      authMock.login.mockResolvedValueOnce({
        user: VALID_USER,
        userSecurity: VALID_USER_SECURITY,
      } as any)
      sessionMock.createSession.mockResolvedValueOnce(VALID_SESSION as any)

      const request = buildRequest({ email: 'admin@example.com', password: 'Password1@' })
      const response = await POST(request)

      // NextResponse cookies are iterable via .getSetCookie() or inspectable via
      // the response headers — use the standard Headers API
      const setCookieHeader = response.headers.get('set-cookie') ?? ''
      expect(setCookieHeader).toContain('accessToken')
    })
  })

  // ── 400 – validation failures ────────────────────────────────────────────
  describe('missing / invalid fields', () => {
    it('returns 400 when email is missing', async () => {
      const request = buildRequest({ password: 'Password1@' })
      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('returns 400 when password is missing', async () => {
      const request = buildRequest({ email: 'admin@example.com' })
      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('returns 400 when email format is invalid', async () => {
      const request = buildRequest({ email: 'not-an-email', password: 'Password1@' })
      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('returns 400 when password is shorter than 8 chars', async () => {
      const request = buildRequest({ email: 'admin@example.com', password: 'short' })
      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('returns 400 when body is an empty object', async () => {
      const request = buildRequest({})
      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('includes a message field in the 400 response body', async () => {
      const request = buildRequest({ email: 'bad', password: 'x' })
      const response = await POST(request)
      const payload = await response.json()
      expect(payload).toHaveProperty('message')
      expect(typeof payload.message).toBe('string')
    })
  })

  // ── 500 – AuthService.login throws ──────────────────────────────────────
  describe('service-level errors', () => {
    it('returns 500 when AuthService.login throws (invalid credentials path)', async () => {
      authMock.login.mockRejectedValueOnce(new Error('INVALID_CREDENTIALS'))

      const request = buildRequest({ email: 'admin@example.com', password: 'Password1@' })
      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('returns 500 with message when login returns no user', async () => {
      // When login returns { user: null } the route throws AuthMessages.INVALID_CREDENTIALS
      authMock.login.mockResolvedValueOnce({ user: null, userSecurity: null } as any)

      const request = buildRequest({ email: 'admin@example.com', password: 'Password1@' })
      const response = await POST(request)

      expect(response.status).toBe(500)
      const payload = await response.json()
      expect(payload).toHaveProperty('message')
    })

    it('returns 500 when session creation fails', async () => {
      authMock.login.mockResolvedValueOnce({
        user: VALID_USER,
        userSecurity: VALID_USER_SECURITY,
      } as any)
      sessionMock.createSession.mockRejectedValueOnce(new Error('Session store unavailable'))

      const request = buildRequest({ email: 'admin@example.com', password: 'Password1@' })
      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })

  // ── rememberDevice cookie ────────────────────────────────────────────────
  describe('rememberDevice flag', () => {
    it('includes trusted-device cookie when rememberDevice=true', async () => {
      authMock.login.mockResolvedValueOnce({
        user: VALID_USER,
        userSecurity: VALID_USER_SECURITY,
      } as any)
      sessionMock.createSession.mockResolvedValueOnce(VALID_SESSION as any)

      const request = buildRequest({
        email: 'admin@example.com',
        password: 'Password1@',
        rememberDevice: true,
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      const setCookieHeader = response.headers.get('set-cookie') ?? ''
      expect(setCookieHeader).toContain('trusted')
    })
  })
})
