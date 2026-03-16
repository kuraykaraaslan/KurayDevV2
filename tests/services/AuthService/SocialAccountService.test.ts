import SocialAccountService from '@/services/AuthService/SocialAccountService'
import { prisma } from '@/libs/prisma'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    userSocialAccount: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

jest.mock('@/services/UserService', () => ({
  __esModule: true,
  default: {
    getByEmail: jest.fn(),
  },
}))

import UserService from '@/services/UserService'

const prismaMock = prisma as any
const userServiceMock = UserService as jest.Mocked<typeof UserService>

const mockAccount = {
  userSocialAccountId: 'sa-1',
  userId: 'user-1',
  provider: 'google',
  providerId: 'google-id-123',
  accessToken: 'access-tok',
  refreshToken: 'refresh-tok',
  profilePicture: 'https://example.com/pic.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('SocialAccountService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── addOrUpdateSocialAccount ─────────────────────────────────────────
  describe('addOrUpdateSocialAccount', () => {
    it('creates a new social account when one does not exist', async () => {
      prismaMock.userSocialAccount.findUnique.mockResolvedValueOnce(null)
      prismaMock.userSocialAccount.create.mockResolvedValueOnce(mockAccount as any)

      const result = await SocialAccountService.addOrUpdateSocialAccount(
        'user-1', 'google', 'google-id-123', 'at', 'rt', 'pic'
      )

      expect(prismaMock.userSocialAccount.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', provider: 'google', providerId: 'google-id-123' }),
        })
      )
      expect(result.provider).toBe('google')
    })

    it('updates existing account when one exists', async () => {
      prismaMock.userSocialAccount.findUnique.mockResolvedValueOnce(mockAccount as any)
      prismaMock.userSocialAccount.update.mockResolvedValueOnce({ ...mockAccount, accessToken: 'new-at' } as any)

      const result = await SocialAccountService.addOrUpdateSocialAccount(
        'user-1', 'google', 'google-id-123', 'new-at'
      )

      expect(prismaMock.userSocialAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { providerId: 'google-id-123' },
          data: expect.objectContaining({ accessToken: 'new-at' }),
        })
      )
      expect(result.accessToken).toBe('new-at')
    })

    it('wraps prisma errors in a descriptive error', async () => {
      prismaMock.userSocialAccount.findUnique.mockRejectedValueOnce(new Error('DB error'))
      await expect(
        SocialAccountService.addOrUpdateSocialAccount('u', 'g', 'id')
      ).rejects.toThrow('Error adding/updating social account')
    })
  })

  // ── getSocialAccountByProvider ───────────────────────────────────────
  describe('getSocialAccountByProvider', () => {
    it('returns account when found', async () => {
      prismaMock.userSocialAccount.findUnique.mockResolvedValueOnce(mockAccount as any)
      const result = await SocialAccountService.getSocialAccountByProvider('google', 'google-id-123')
      expect(result).not.toBeNull()
      expect(result?.provider).toBe('google')
    })

    it('returns null when not found', async () => {
      prismaMock.userSocialAccount.findUnique.mockResolvedValueOnce(null)
      const result = await SocialAccountService.getSocialAccountByProvider('github', 'unknown-id')
      expect(result).toBeNull()
    })

    it('wraps prisma errors', async () => {
      prismaMock.userSocialAccount.findUnique.mockRejectedValueOnce(new Error('fail'))
      await expect(
        SocialAccountService.getSocialAccountByProvider('g', 'id')
      ).rejects.toThrow('Error fetching social account')
    })
  })

  // ── linkSocialAccountToUser ──────────────────────────────────────────
  describe('linkSocialAccountToUser', () => {
    it('throws when user is not found by email', async () => {
      userServiceMock.getByEmail.mockResolvedValueOnce(null)
      await expect(
        SocialAccountService.linkSocialAccountToUser('none@x.com', 'google', 'id')
      ).rejects.toThrow()
    })

    it('links account when user is found', async () => {
      userServiceMock.getByEmail.mockResolvedValueOnce({ userId: 'user-1', email: 'u@x.com' } as any)
      prismaMock.userSocialAccount.findUnique.mockResolvedValueOnce(null)
      prismaMock.userSocialAccount.create.mockResolvedValueOnce(mockAccount as any)

      const result = await SocialAccountService.linkSocialAccountToUser('u@x.com', 'google', 'id', 'at')
      expect(result).not.toBeNull()
    })
  })

  // ── unlinkSocialAccount ──────────────────────────────────────────────
  describe('unlinkSocialAccount', () => {
    it('calls deleteMany with userId and provider', async () => {
      prismaMock.userSocialAccount.deleteMany.mockResolvedValueOnce({ count: 1 })
      await SocialAccountService.unlinkSocialAccount('user-1', 'google')
      expect(prismaMock.userSocialAccount.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', provider: 'google' },
      })
    })

    it('wraps errors', async () => {
      prismaMock.userSocialAccount.deleteMany.mockRejectedValueOnce(new Error('fail'))
      await expect(
        SocialAccountService.unlinkSocialAccount('u', 'g')
      ).rejects.toThrow('Error unlinking social account')
    })
  })

  // ── getAllUserSocialAccounts ──────────────────────────────────────────
  describe('getAllUserSocialAccounts', () => {
    it('returns all accounts for a user', async () => {
      prismaMock.userSocialAccount.findMany.mockResolvedValueOnce([mockAccount] as any)
      const result = await SocialAccountService.getAllUserSocialAccounts('user-1')
      expect(result).toHaveLength(1)
      expect(result[0].provider).toBe('google')
    })

    it('returns empty array when user has no linked accounts', async () => {
      prismaMock.userSocialAccount.findMany.mockResolvedValueOnce([])
      const result = await SocialAccountService.getAllUserSocialAccounts('user-1')
      expect(result).toHaveLength(0)
    })
  })
})
