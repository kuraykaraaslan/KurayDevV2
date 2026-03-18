import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import AuthMessages from '@/messages/AuthMessages'
jest.mock('@/services/AuthService/ApiKeyService', () => ({ authenticateByApiKey: jest.fn() }))
jest.mock('@/services/AuthService/UserSessionService', () => ({ getSession: jest.fn() }))
const apiKeyMock = require('@/services/AuthService/ApiKeyService')
const sessionMock = require('@/services/AuthService/UserSessionService')

const mockRequest = {
  headers: { get: jest.fn() },
  cookies: { get: jest.fn() },
  user: null,
}

describe('AuthMiddleware', () => {
  beforeEach(() => jest.resetAllMocks())

  it('throws USER_NOT_AUTHENTICATED if user role insufficient', async () => {
    mockRequest.headers.get.mockReturnValue('kdev_xxx')
    apiKeyMock.authenticateByApiKey.mockResolvedValueOnce({ userRole: 'USER', userId: 'user-1' })
    await expect(AuthMiddleware.authenticateUserByRequest({ request: mockRequest, requiredUserRole: 'ADMIN' })).rejects.toThrow(AuthMessages.USER_NOT_AUTHENTICATED)
  })

  it('returns null for GUEST if no tokens', async () => {
    mockRequest.headers.get.mockReturnValue(null)
    mockRequest.cookies.get.mockReturnValue(undefined)
    const result = await AuthMiddleware.authenticateUserByRequest({ request: mockRequest, requiredUserRole: 'GUEST' })
    expect(result.user).toBeNull()
    expect(result.userSession).toBeNull()
  })

  it('throws USER_DOES_NOT_HAVE_REQUIRED_ROLE if no tokens and not guest', async () => {
    mockRequest.headers.get.mockReturnValue(null)
    mockRequest.cookies.get.mockReturnValue(undefined)
    await expect(AuthMiddleware.authenticateUserByRequest({ request: mockRequest, requiredUserRole: 'ADMIN' })).rejects.toThrow(AuthMessages.USER_DOES_NOT_HAVE_REQUIRED_ROLE)
  })
})

// ── Phase 16: AuthMiddleware edge-case tests ─────────────────────────────────

describe('AuthMiddleware.authenticateUserByRequest — role enforcement', () => {
  beforeEach(() => jest.resetAllMocks())

  it('throws USER_NOT_AUTHENTICATED when USER role attempts ADMIN-only endpoint via API key', async () => {
    mockRequest.headers.get.mockReturnValue('kdev_userkey')
    apiKeyMock.authenticateByApiKey.mockResolvedValueOnce({
      userId: 'user-1',
      userRole: 'USER',
      userStatus: 'ACTIVE',
      email: 'user@example.com',
      name: null,
      phone: null,
      userProfile: null,
      userPreferences: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await expect(
      AuthMiddleware.authenticateUserByRequest({ request: mockRequest as any, requiredUserRole: 'ADMIN' })
    ).rejects.toThrow(AuthMessages.USER_NOT_AUTHENTICATED)
  })

  it('throws USER_NOT_AUTHENTICATED when AUTHOR role attempts ADMIN-only endpoint via API key', async () => {
    mockRequest.headers.get.mockReturnValue('kdev_authorkey')
    apiKeyMock.authenticateByApiKey.mockResolvedValueOnce({
      userId: 'user-2',
      userRole: 'AUTHOR',
      userStatus: 'ACTIVE',
      email: 'author@example.com',
      name: null,
      phone: null,
      userProfile: null,
      userPreferences: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await expect(
      AuthMiddleware.authenticateUserByRequest({ request: mockRequest as any, requiredUserRole: 'ADMIN' })
    ).rejects.toThrow(AuthMessages.USER_NOT_AUTHENTICATED)
  })

  it('succeeds when ADMIN role meets ADMIN requirement via API key', async () => {
    mockRequest.headers.get.mockReturnValue('kdev_adminkey')
    apiKeyMock.authenticateByApiKey.mockResolvedValueOnce({
      userId: 'admin-1',
      userRole: 'ADMIN',
      userStatus: 'ACTIVE',
      email: 'admin@example.com',
      name: null,
      phone: null,
      userProfile: null,
      userPreferences: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    const result = await AuthMiddleware.authenticateUserByRequest({ request: mockRequest as any, requiredUserRole: 'ADMIN' })
    expect(result.user?.userId).toBe('admin-1')
  })
})

describe('AuthMiddleware.authenticateUserByRequest — missing/malformed Authorization header', () => {
  beforeEach(() => jest.resetAllMocks())

  it('throws USER_DOES_NOT_HAVE_REQUIRED_ROLE when Authorization header is absent and no cookies for non-guest', async () => {
    mockRequest.headers.get.mockReturnValue(null)
    mockRequest.cookies.get.mockReturnValue(undefined)
    await expect(
      AuthMiddleware.authenticateUserByRequest({ request: mockRequest as any, requiredUserRole: 'USER' })
    ).rejects.toThrow(AuthMessages.USER_DOES_NOT_HAVE_REQUIRED_ROLE)
  })

  it('does not treat a non-kdev_ Bearer token as an API key (falls through to cookie path)', async () => {
    // Authorization: Bearer <normal-jwt> — not kdev_ prefix, so not API key
    mockRequest.headers.get.mockImplementation((h: string) => {
      if (h === 'x-api-key') return null
      if (h === 'authorization') return 'Bearer some-jwt-not-kdev'
      return null
    })
    mockRequest.cookies.get.mockReturnValue(undefined)
    await expect(
      AuthMiddleware.authenticateUserByRequest({ request: mockRequest as any, requiredUserRole: 'USER' })
    ).rejects.toThrow(AuthMessages.USER_DOES_NOT_HAVE_REQUIRED_ROLE)
  })

  it('propagates API_KEY_DAILY_LIMIT_EXCEEDED without wrapping', async () => {
    mockRequest.headers.get.mockReturnValue('kdev_ratelimitedkey')
    apiKeyMock.authenticateByApiKey.mockRejectedValueOnce(new Error(AuthMessages.API_KEY_DAILY_LIMIT_EXCEEDED))
    await expect(
      AuthMiddleware.authenticateUserByRequest({ request: mockRequest as any, requiredUserRole: 'USER' })
    ).rejects.toThrow(AuthMessages.API_KEY_DAILY_LIMIT_EXCEEDED)
  })

  it('propagates API_KEY_MONTHLY_LIMIT_EXCEEDED without wrapping', async () => {
    mockRequest.headers.get.mockReturnValue('kdev_ratelimitedkey')
    apiKeyMock.authenticateByApiKey.mockRejectedValueOnce(new Error(AuthMessages.API_KEY_MONTHLY_LIMIT_EXCEEDED))
    await expect(
      AuthMiddleware.authenticateUserByRequest({ request: mockRequest as any, requiredUserRole: 'USER' })
    ).rejects.toThrow(AuthMessages.API_KEY_MONTHLY_LIMIT_EXCEEDED)
  })
})

describe('AuthMiddleware.authenticateUserByRequest — session-based auth', () => {
  beforeEach(() => jest.resetAllMocks())

  it('throws USER_DOES_NOT_HAVE_REQUIRED_ROLE when both accessToken and refreshToken cookies are missing', async () => {
    mockRequest.headers.get.mockReturnValue(null)
    mockRequest.cookies.get.mockReturnValue(undefined)
    await expect(
      AuthMiddleware.authenticateUserByRequest({ request: mockRequest as any, requiredUserRole: 'ADMIN' })
    ).rejects.toThrow(AuthMessages.USER_DOES_NOT_HAVE_REQUIRED_ROLE)
  })

  it('throws USER_NOT_AUTHENTICATED when getSession rejects (tampered/invalid token)', async () => {
    mockRequest.headers.get.mockReturnValue(null)
    mockRequest.cookies.get.mockImplementation((name: string) => {
      if (name === 'accessToken') return { value: 'tampered.token.value' }
      if (name === 'refreshToken') return { value: 'some-refresh' }
      return undefined
    })
    sessionMock.getSession.mockRejectedValueOnce(new Error('jwt malformed'))
    await expect(
      AuthMiddleware.authenticateUserByRequest({ request: mockRequest as any, requiredUserRole: 'USER' })
    ).rejects.toThrow(AuthMessages.USER_NOT_AUTHENTICATED)
  })

  it('returns null for GUEST when session lookup fails (not authenticated)', async () => {
    mockRequest.headers.get.mockReturnValue(null)
    mockRequest.cookies.get.mockReturnValue(undefined)
    const result = await AuthMiddleware.authenticateUserByRequest({ request: mockRequest as any, requiredUserRole: 'GUEST' })
    expect(result.user).toBeNull()
    expect(result.userSession).toBeNull()
  })
})
