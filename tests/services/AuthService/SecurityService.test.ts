import SecurityService from '@/services/AuthService/SecurityService'
import { prisma } from '@/libs/prisma'
import AuthMessages from '@/messages/AuthMessages'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const prismaMock = prisma as any

const mockPrismaUser = {
  userId: 'user-1',
  email: 'test@example.com',
  userSecurity: null,
}

describe('SecurityService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── getUserSecurity ──────────────────────────────────────────────────
  describe('getUserSecurity', () => {
    it('throws USER_NOT_FOUND when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null)
      await expect(SecurityService.getUserSecurity('nonexistent')).rejects.toThrow(
        AuthMessages.USER_NOT_FOUND
      )
    })

    it('returns default UserSecurity when userSecurity is null', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ ...mockPrismaUser, userSecurity: null } as any)
      const { userSecurity } = await SecurityService.getUserSecurity('user-1')
      expect(userSecurity).toBeDefined()
      expect(Array.isArray(userSecurity.otpMethods)).toBe(true)
    })

    it('returns parsed UserSecurity from stored JSON', async () => {
      const stored = { otpMethods: ['EMAIL'], otpSecret: null, otpBackupCodes: [] }
      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockPrismaUser,
        userSecurity: stored,
      } as any)
      const { userSecurity } = await SecurityService.getUserSecurity('user-1')
      expect(userSecurity.otpMethods).toContain('EMAIL')
    })
  })

  // ── updateUserSecurity ───────────────────────────────────────────────
  describe('updateUserSecurity', () => {
    it('throws USER_NOT_FOUND when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null)
      await expect(
        SecurityService.updateUserSecurity('nonexistent', { otpMethods: [] as any })
      ).rejects.toThrow(AuthMessages.USER_NOT_FOUND)
    })

    it('merges partial updates into existing security and calls prisma.update', async () => {
      const existing = { otpMethods: ['EMAIL'], otpSecret: null, otpBackupCodes: [] }
      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockPrismaUser,
        userSecurity: existing,
      } as any)
      prismaMock.user.update.mockResolvedValueOnce({} as any)

      await SecurityService.updateUserSecurity('user-1', { otpSecret: 'NEW_SECRET' })

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          data: expect.objectContaining({
            userSecurity: expect.objectContaining({ otpSecret: 'NEW_SECRET', otpMethods: ['EMAIL'] }),
          }),
        })
      )
    })

    it('preserves unmodified fields when updating a subset', async () => {
      const existing = { otpMethods: ['SMS'], otpSecret: 'old-secret', otpBackupCodes: ['x'] }
      prismaMock.user.findUnique.mockResolvedValueOnce({
        ...mockPrismaUser,
        userSecurity: existing,
      } as any)
      prismaMock.user.update.mockResolvedValueOnce({} as any)

      await SecurityService.updateUserSecurity('user-1', { otpSecret: 'new-secret' })

      const updateCall = prismaMock.user.update.mock.calls[0][0]
      expect((updateCall.data.userSecurity as any).otpMethods).toContain('SMS')
    })
  })
})
