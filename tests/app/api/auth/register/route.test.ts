/**
 * Phase 28 – HTTP contract tests for POST /api/auth/register
 */

// ── mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/libs/rateLimit', () => ({
  __esModule: true,
  default: {
    checkRateLimit: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@/services/AuthService', () => ({
  __esModule: true,
  default: {
    register: jest.fn(),
  },
}))

jest.mock('@/helpers/SpamProtection', () => ({
  verifyRecaptcha: jest.fn(),
}))

// ── imports ───────────────────────────────────────────────────────────────────

import AuthService from '@/services/AuthService'
import { verifyRecaptcha } from '@/helpers/SpamProtection'
import { POST } from '@/app/(api)/api/auth/register/route'

const authMock = AuthService as jest.Mocked<typeof AuthService>
const recaptchaMock = verifyRecaptcha as jest.MockedFunction<typeof verifyRecaptcha>

// ── helpers ───────────────────────────────────────────────────────────────────

function buildRequest(body: unknown) {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: { get: jest.fn().mockReturnValue(null) },
    cookies: { get: jest.fn().mockReturnValue(undefined) },
  } as any
}

const VALID_BODY = {
  email: 'newuser@example.com',
  password: 'Password1@',
  name: 'New User',
  recaptchaToken: 'valid-token',
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── 201 – successful registration ────────────────────────────────────────
  describe('successful registration', () => {
    it('returns 201 with success message', async () => {
      recaptchaMock.mockResolvedValueOnce(true)
      authMock.register.mockResolvedValueOnce({ userId: 'u-1' } as any)

      const response = await POST(buildRequest(VALID_BODY))
      const payload = await response.json()

      expect(response.status).toBe(201)
      expect(payload).toHaveProperty('message')
    })
  })

  // ── 400 – schema validation failures ─────────────────────────────────────
  describe('schema validation failures', () => {
    it('returns 400 when email is missing', async () => {
      const body = { ...VALID_BODY, email: undefined }
      const response = await POST(buildRequest(body))
      expect(response.status).toBe(400)
    })

    it('returns 400 when email format is invalid', async () => {
      const body = { ...VALID_BODY, email: 'not-an-email' }
      const response = await POST(buildRequest(body))
      expect(response.status).toBe(400)
    })

    it('returns 400 when password is too short', async () => {
      const body = { ...VALID_BODY, password: 'short' }
      const response = await POST(buildRequest(body))
      expect(response.status).toBe(400)
    })

    it('returns 400 when recaptchaToken is missing', async () => {
      const { recaptchaToken, ...body } = VALID_BODY
      const response = await POST(buildRequest(body))
      expect(response.status).toBe(400)
    })

    it('returns 400 when name is missing', async () => {
      const { name, ...body } = VALID_BODY
      const response = await POST(buildRequest(body))
      expect(response.status).toBe(400)
    })

    it('includes a message string in the 400 body', async () => {
      const response = await POST(buildRequest({}))
      const payload = await response.json()
      expect(payload).toHaveProperty('message')
      expect(typeof payload.message).toBe('string')
    })
  })

  // ── 400 – reCAPTCHA failure ───────────────────────────────────────────────
  describe('reCAPTCHA failure', () => {
    it('returns 400 when reCAPTCHA verification fails', async () => {
      recaptchaMock.mockResolvedValueOnce(false)

      const response = await POST(buildRequest(VALID_BODY))
      const payload = await response.json()

      expect(response.status).toBe(400)
      expect(payload.message).toMatch(/recaptcha/i)
    })
  })

  // ── 400 – registration rejected by AuthService ────────────────────────────
  describe('AuthService returns null (registration failed)', () => {
    it('returns 400 when AuthService.register returns null', async () => {
      recaptchaMock.mockResolvedValueOnce(true)
      authMock.register.mockResolvedValueOnce(null as any)

      const response = await POST(buildRequest(VALID_BODY))

      expect(response.status).toBe(400)
    })
  })

  // ── 500 – unexpected service error ───────────────────────────────────────
  describe('unexpected service error', () => {
    it('returns 500 when AuthService.register throws', async () => {
      recaptchaMock.mockResolvedValueOnce(true)
      authMock.register.mockRejectedValueOnce(new Error('DB unavailable'))

      const response = await POST(buildRequest(VALID_BODY))

      expect(response.status).toBe(500)
      const payload = await response.json()
      expect(payload.message).toBe('DB unavailable')
    })
  })
})
