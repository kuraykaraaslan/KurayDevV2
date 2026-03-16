import SSOService from '@/services/AuthService/SSOService'
import { prisma } from '@/libs/prisma'
import { SSOMessages } from '@/messages/SSOMessages'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), create: jest.fn() },
    userSocialAccount: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  },
}))

jest.mock('@/services/SettingService', () => ({
  __esModule: true,
  default: { getSettingByKey: jest.fn().mockResolvedValue(true) },
}))

jest.mock('@/services/AuthService/SecurityService', () => ({
  __esModule: true,
  default: {
    getUserSecurity: jest.fn().mockResolvedValue({
      userSecurity: { otpMethods: [], otpSecret: null, otpBackupCodes: [] },
    }),
  },
}))

// Mock all provider services
jest.mock('@/services/AuthService/SSOService/GoogleService', () => ({
  __esModule: true,
  default: {
    generateAuthUrl: jest.fn().mockReturnValue('https://google-auth-url'),
    getTokens: jest.fn(),
    getUserInfo: jest.fn(),
  },
}))

jest.mock('@/services/AuthService/SSOService/GithubService', () => ({
  __esModule: true,
  default: {
    generateAuthUrl: jest.fn().mockReturnValue('https://github-auth-url'),
    getTokens: jest.fn(),
    getUserInfo: jest.fn(),
  },
}))

jest.mock('@/services/AuthService/SSOService/AppleService', () => ({
  __esModule: true,
  default: { generateAuthUrl: jest.fn(), getTokens: jest.fn(), getUserInfo: jest.fn() },
}))
jest.mock('@/services/AuthService/SSOService/FacebookService', () => ({
  __esModule: true,
  default: { generateAuthUrl: jest.fn(), getTokens: jest.fn(), getUserInfo: jest.fn() },
}))
jest.mock('@/services/AuthService/SSOService/LinkedInService', () => ({
  __esModule: true,
  default: { generateAuthUrl: jest.fn(), getTokens: jest.fn(), getUserInfo: jest.fn() },
}))
jest.mock('@/services/AuthService/SSOService/MicrosoftService', () => ({
  __esModule: true,
  default: { generateAuthUrl: jest.fn(), getTokens: jest.fn(), getUserInfo: jest.fn() },
}))
jest.mock('@/services/AuthService/SSOService/TwitterService', () => ({
  __esModule: true,
  default: { generateAuthUrl: jest.fn(), getTokens: jest.fn(), getUserInfo: jest.fn() },
}))
jest.mock('@/services/AuthService/SSOService/AutodeskService', () => ({
  __esModule: true,
  default: { generateAuthUrl: jest.fn(), getTokens: jest.fn(), getUserInfo: jest.fn() },
}))

import GoogleService from '@/services/AuthService/SSOService/GoogleService'
import GithubService from '@/services/AuthService/SSOService/GithubService'

const prismaMock = prisma as any
const googleMock = GoogleService as jest.Mocked<typeof GoogleService>
const githubMock = GithubService as jest.Mocked<typeof GithubService>

const mockPrismaUser = {
  userId: 'user-1',
  email: 'sso@example.com',
  userProfile: null,
  userPreferences: null,
  userSecurity: null,
  password: 'password12345678',
  phone: null,
  userRole: 'USER',
  userStatus: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

describe('SSOService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Allow 'google' and 'github' as providers
    process.env.SSO_ALLOWED_PROVIDERS = 'google,github'
    // Re-apply the static field (module was loaded with old env)
    ;(SSOService as any).ALLOWED_PROVIDERS = ['google', 'github']
  })

  // ── generateAuthUrl ──────────────────────────────────────────────────
  describe('generateAuthUrl', () => {
    it('returns auth URL for allowed provider', () => {
      const url = SSOService.generateAuthUrl('google')
      expect(url).toMatch(/^https:\/\/google-auth-url\/?$/)
      expect(googleMock.generateAuthUrl).toHaveBeenCalled()
    })

    it('throws INVALID_PROVIDER for disallowed provider', () => {
      expect(() => SSOService.generateAuthUrl('twitter')).toThrow(SSOMessages.INVALID_PROVIDER)
    })

    it('throws INVALID_PROVIDER for unknown provider', () => {
      expect(() => SSOService.generateAuthUrl('unknown-provider')).toThrow()
    })

    it('appends state and nonce query params when provided', () => {
      const url = SSOService.generateAuthUrl('google', { state: 'state-123', nonce: 'nonce-456' })
      const parsed = new URL(url)
      expect(parsed.searchParams.get('state')).toBe('state-123')
      expect(parsed.searchParams.get('nonce')).toBe('nonce-456')
    })
  })

  // ── authCallback ─────────────────────────────────────────────────────
  describe('authCallback', () => {
    it('throws CODE_NOT_FOUND when code is empty', async () => {
      await expect(SSOService.authCallback('google', '')).rejects.toThrow(SSOMessages.CODE_NOT_FOUND)
    })

    it('returns user data for existing user on successful callback', async () => {
      githubMock.getTokens.mockResolvedValueOnce({ access_token: 'gh-at' })
      githubMock.getUserInfo.mockResolvedValueOnce({
        sub: 'gh-42',
        email: 'sso@example.com',
        name: 'SSO User',
        picture: '',
        provider: 'github',
      })
      prismaMock.user.findUnique.mockResolvedValueOnce(mockPrismaUser as any)
      prismaMock.userSocialAccount.findFirst.mockResolvedValueOnce(null)
      prismaMock.userSocialAccount.create.mockResolvedValueOnce({} as any)
      prismaMock.user.findUnique.mockResolvedValueOnce(mockPrismaUser as any)

      const result = await SSOService.authCallback('github', 'valid-code')
      expect(result.newUser).toBe(false)
      expect(result.user.email).toBe('sso@example.com')
    })

    it('sets newUser=true when user does not exist yet', async () => {
      googleMock.getTokens.mockResolvedValueOnce({ access_token: 'g-at', refresh_token: 'g-rt' })
      googleMock.getUserInfo.mockResolvedValueOnce({
        sub: 'g-sub-99',
        email: 'new@example.com',
        name: 'New User',
        picture: '',
        provider: 'google',
      })
      prismaMock.user.findUnique.mockResolvedValueOnce(null) // user not found → newUser
      prismaMock.user.create.mockResolvedValueOnce({ ...mockPrismaUser, email: 'new@example.com' } as any)
      prismaMock.userSocialAccount.create.mockResolvedValueOnce({} as any)

      const result = await SSOService.authCallback('google', 'new-code')
      expect(result.newUser).toBe(true)
    })

    it('throws INVALID_REQUEST when state validation fails', async () => {
      await expect(
        SSOService.authCallback('google', 'code-1', {
          state: 'actual-state',
          expectedState: 'expected-state',
        })
      ).rejects.toThrow(SSOMessages.INVALID_REQUEST)
    })

    it('throws INVALID_REQUEST when nonce validation fails', async () => {
      await expect(
        SSOService.authCallback('google', 'code-1', {
          nonce: 'actual-nonce',
          expectedNonce: 'expected-nonce',
        })
      ).rejects.toThrow(SSOMessages.INVALID_REQUEST)
    })

    it('throws INVALID_REQUEST on redirect URI mismatch', async () => {
      await expect(
        SSOService.authCallback('google', 'code-1', {
          redirectUri: 'https://localhost/wrong-callback',
          expectedRedirectUri: 'https://localhost/api/auth/callback/google',
        })
      ).rejects.toThrow(SSOMessages.INVALID_REQUEST)
    })

    it('throws EMAIL_NOT_FOUND when provider profile has no email', async () => {
      googleMock.getTokens.mockResolvedValueOnce({ access_token: 'g-at', refresh_token: 'g-rt' })
      googleMock.getUserInfo.mockResolvedValueOnce({
        sub: 'g-sub-100',
        email: '',
        name: 'No Email User',
        picture: '',
        provider: 'google',
      })

      await expect(SSOService.authCallback('google', 'code-no-email')).rejects.toThrow(
        SSOMessages.EMAIL_NOT_FOUND
      )
    })

    it('throws OAUTH_ERROR when provider profile is missing required identifier', async () => {
      googleMock.getTokens.mockResolvedValueOnce({ access_token: 'g-at', refresh_token: 'g-rt' })
      googleMock.getUserInfo.mockResolvedValueOnce({
        sub: '',
        email: 'user@example.com',
        name: 'Bad Profile',
        picture: '',
        provider: 'google',
      })

      await expect(SSOService.authCallback('google', 'code-bad-profile')).rejects.toThrow(
        SSOMessages.OAUTH_ERROR
      )
    })

    it('throws AUTHENTICATION_FAILED when provider account is already linked to a different user', async () => {
      githubMock.getTokens.mockResolvedValueOnce({ access_token: 'gh-at' })
      githubMock.getUserInfo.mockResolvedValueOnce({
        sub: 'shared-provider-sub',
        email: 'sso@example.com',
        name: 'SSO User',
        picture: '',
        provider: 'github',
      })

      prismaMock.user.findUnique.mockResolvedValueOnce(mockPrismaUser as any)
      prismaMock.userSocialAccount.findFirst
        .mockResolvedValueOnce({
          userSocialAccountId: 'social-1',
          userId: 'another-user',
          provider: 'github',
          providerId: 'shared-provider-sub',
        } as any)

      await expect(SSOService.authCallback('github', 'collision-code')).rejects.toThrow(
        SSOMessages.AUTHENTICATION_FAILED
      )
    })

    it('allows same email to be linked from another provider when no provider collision exists', async () => {
      googleMock.getTokens.mockResolvedValueOnce({ access_token: 'g-at', refresh_token: 'g-rt' })
      googleMock.getUserInfo.mockResolvedValueOnce({
        sub: 'google-sub-same-email',
        email: 'sso@example.com',
        name: 'SSO User',
        picture: '',
        provider: 'google',
      })

      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockPrismaUser as any)
        .mockResolvedValueOnce(mockPrismaUser as any)

      prismaMock.userSocialAccount.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
      prismaMock.userSocialAccount.create.mockResolvedValueOnce({} as any)

      const result = await SSOService.authCallback('google', 'same-email-different-provider')
      expect(result.newUser).toBe(false)
      expect(prismaMock.userSocialAccount.create).toHaveBeenCalled()
    })
  })
})
