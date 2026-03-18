jest.mock('@/libs/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}))

import { prisma } from '@/libs/prisma'
import UserProfileService from '@/services/UserProfileService'

const prismaMock = prisma as jest.Mocked<typeof prisma>

const DB_USER = {
  userId: 'user-1',
  userProfile: {
    name: 'Alice',
    username: 'alice',
    bio: 'Developer',
    avatar: null,
    website: null,
    location: null,
    social: null,
  },
}

describe('UserProfileService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── getProfile ────────────────────────────────────────────────────────────
  describe('getProfile', () => {
    it('returns parsed userProfile for existing user', async () => {
      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(DB_USER)
      const profile = await UserProfileService.getProfile('user-1')
      expect(profile.name).toBe('Alice')
    })

    it('falls back to UserProfileDefault when userProfile is null', async () => {
      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({ ...DB_USER, userProfile: null })
      const profile = await UserProfileService.getProfile('user-1')
      expect(profile).toBeDefined()
    })

    it('throws USER_NOT_FOUND when user does not exist', async () => {
      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(null)
      await expect(UserProfileService.getProfile('ghost')).rejects.toThrow(
        UserProfileService.USER_NOT_FOUND
      )
    })
  })

  // ── updateProfile ─────────────────────────────────────────────────────────
  describe('updateProfile', () => {
    it('merges partial data and persists to DB', async () => {
      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(DB_USER)
      ;(prismaMock.$queryRaw as jest.Mock).mockResolvedValueOnce([]) // no username conflict
      ;(prismaMock.user.update as jest.Mock).mockResolvedValueOnce({
        ...DB_USER,
        userProfile: { ...DB_USER.userProfile, bio: 'Updated bio' },
      })

      const result = await UserProfileService.updateProfile({
        userId: 'user-1',
        data: { bio: 'Updated bio' },
      })
      expect(result.bio).toBe('Updated bio')
    })

    it('throws USER_NOT_FOUND when user does not exist', async () => {
      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(null)
      await expect(
        UserProfileService.updateProfile({ userId: 'ghost', data: { bio: 'x' } })
      ).rejects.toThrow(UserProfileService.USER_NOT_FOUND)
    })

    it('throws INVALID_USERNAME for username with invalid characters', async () => {
      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(DB_USER)
      await expect(
        UserProfileService.updateProfile({ userId: 'user-1', data: { username: 'Alice--Bad!' } })
      ).rejects.toThrow(UserProfileService.INVALID_USERNAME)
    })

    it('throws USERNAME_TAKEN when another user has the same username', async () => {
      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(DB_USER)
      ;(prismaMock.$queryRaw as jest.Mock).mockResolvedValueOnce([{ userId: 'other-user' }])
      await expect(
        UserProfileService.updateProfile({ userId: 'user-1', data: { username: 'taken' } })
      ).rejects.toThrow(UserProfileService.USERNAME_TAKEN)
    })

    it('allows updating username when it belongs to the same user', async () => {
      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(DB_USER)
      ;(prismaMock.$queryRaw as jest.Mock).mockResolvedValueOnce([{ userId: 'user-1' }]) // same user
      ;(prismaMock.user.update as jest.Mock).mockResolvedValueOnce({
        ...DB_USER,
        userProfile: { ...DB_USER.userProfile, username: 'alice' },
      })

      const result = await UserProfileService.updateProfile({
        userId: 'user-1',
        data: { username: 'alice' },
      })
      expect(result.username).toBe('alice')
    })
  })

  // ── mergeProfile ──────────────────────────────────────────────────────────
  describe('mergeProfile', () => {
    const base = {
      name: 'Alice',
      username: 'alice',
      bio: 'Dev',
      avatar: null,
      website: null,
      location: null,
      social: null,
    } as any

    it('overwrites fields present in incoming patch', () => {
      const result = UserProfileService.mergeProfile(base, { bio: 'New bio' })
      expect(result.bio).toBe('New bio')
      expect(result.name).toBe('Alice')
    })

    it('ignores undefined values (does not overwrite with undefined)', () => {
      const result = UserProfileService.mergeProfile(base, { bio: undefined })
      expect(result.bio).toBe('Dev')
    })

    it('allows null to explicitly clear a field', () => {
      const result = UserProfileService.mergeProfile(base, { bio: null } as any)
      expect(result.bio).toBeNull()
    })

    it('returns a new object without mutating the original', () => {
      UserProfileService.mergeProfile(base, { name: 'Bob' })
      expect(base.name).toBe('Alice')
    })
  })
})
