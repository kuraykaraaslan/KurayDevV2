// Override the global prisma mock to include all methods UserProfileService needs.
jest.mock('@/libs/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}))

import UserProfileService from '@/services/UserProfileService'
import { prisma } from '@/libs/prisma'
import { UserProfileDefault } from '@/types/user/UserProfileTypes'

const prismaMock = prisma as any

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_USER_ID = 'user-abc-123'

const MINIMAL_PROFILE = {
  name: 'Ada Lovelace',
  username: 'ada_lovelace',
  biography: null,
  profilePicture: null,
  headerImage: null,
  socialLinks: [],
  hideProfileFromIndex: true,
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    userId: VALID_USER_ID,
    email: 'ada@example.com',
    userProfile: MINIMAL_PROFILE,
    ...overrides,
  }
}

// ── getProfile ─────────────────────────────────────────────────────────────────

describe('UserProfileService.getProfile', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the parsed profile when the user exists with a stored profile', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser())

    const result = await UserProfileService.getProfile(VALID_USER_ID)

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { userId: VALID_USER_ID } })
    expect(result.username).toBe('ada_lovelace')
    expect(result.name).toBe('Ada Lovelace')
  })

  it('falls back to UserProfileDefault when userProfile is null', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser({ userProfile: null }))

    const result = await UserProfileService.getProfile(VALID_USER_ID)

    // The default profile has all null fields and empty socialLinks.
    expect(result).toEqual(UserProfileDefault)
  })

  it('throws USER_NOT_FOUND when the user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)

    await expect(UserProfileService.getProfile('missing-user')).rejects.toThrow(
      UserProfileService.USER_NOT_FOUND
    )
  })

  it('returns a profile with socialLinks preserved from stored data', async () => {
    const profileWithLinks = {
      ...MINIMAL_PROFILE,
      socialLinks: [
        { id: '00000000-0000-0000-0000-000000000001', platform: 'GITHUB', url: 'https://github.com/ada', order: 0 },
      ],
    }
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser({ userProfile: profileWithLinks }))

    const result = await UserProfileService.getProfile(VALID_USER_ID)

    expect(result.socialLinks).toHaveLength(1)
    expect(result.socialLinks![0].platform).toBe('GITHUB')
  })
})

// ── updateProfile ──────────────────────────────────────────────────────────────

describe('UserProfileService.updateProfile', () => {
  beforeEach(() => jest.clearAllMocks())

  it('throws USER_NOT_FOUND when the user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)

    await expect(
      UserProfileService.updateProfile({ userId: VALID_USER_ID, data: { name: 'New Name' } })
    ).rejects.toThrow(UserProfileService.USER_NOT_FOUND)
  })

  it('updates and returns the merged profile when data is valid', async () => {
    const updatedProfile = { ...MINIMAL_PROFILE, name: 'Updated Name' }

    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser())
    prismaMock.$queryRaw.mockResolvedValueOnce([]) // username available
    prismaMock.user.update.mockResolvedValueOnce(makeUser({ userProfile: updatedProfile }))

    const result = await UserProfileService.updateProfile({
      userId: VALID_USER_ID,
      data: { name: 'Updated Name', username: 'ada_lovelace' },
    })

    expect(result.name).toBe('Updated Name')
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: VALID_USER_ID } })
    )
  })

  it('throws INVALID_USERNAME when username contains uppercase letters', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser())

    await expect(
      UserProfileService.updateProfile({ userId: VALID_USER_ID, data: { username: 'Ada_Lovelace' } })
    ).rejects.toThrow(UserProfileService.INVALID_USERNAME)
  })

  it('throws INVALID_USERNAME when username contains spaces', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser())

    await expect(
      UserProfileService.updateProfile({ userId: VALID_USER_ID, data: { username: 'ada lovelace' } })
    ).rejects.toThrow(UserProfileService.INVALID_USERNAME)
  })

  it('throws INVALID_USERNAME when username contains hyphens', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser())

    await expect(
      UserProfileService.updateProfile({ userId: VALID_USER_ID, data: { username: 'ada-lovelace' } })
    ).rejects.toThrow(UserProfileService.INVALID_USERNAME)
  })

  it('throws USERNAME_TAKEN when the username belongs to a different user', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser())
    // Another user already owns that username.
    prismaMock.$queryRaw.mockResolvedValueOnce([{ userId: 'other-user-id' }])

    await expect(
      UserProfileService.updateProfile({ userId: VALID_USER_ID, data: { username: 'taken_name' } })
    ).rejects.toThrow(UserProfileService.USERNAME_TAKEN)
  })

  it('does not throw USERNAME_TAKEN when the same user owns the username', async () => {
    const updatedProfile = { ...MINIMAL_PROFILE, username: 'ada_lovelace' }
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser())
    // The same userId is returned — not a different user.
    prismaMock.$queryRaw.mockResolvedValueOnce([{ userId: VALID_USER_ID }])
    prismaMock.user.update.mockResolvedValueOnce(makeUser({ userProfile: updatedProfile }))

    await expect(
      UserProfileService.updateProfile({ userId: VALID_USER_ID, data: { username: 'ada_lovelace' } })
    ).resolves.not.toThrow()
  })

  it('skips username validation when username is not present in data', async () => {
    const updatedProfile = { ...MINIMAL_PROFILE, biography: 'New bio' }
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser())
    prismaMock.user.update.mockResolvedValueOnce(makeUser({ userProfile: updatedProfile }))

    const result = await UserProfileService.updateProfile({
      userId: VALID_USER_ID,
      data: { biography: 'New bio' },
    })

    // $queryRaw should never be called if there's no username in the patch.
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled()
    expect(result.biography).toBe('New bio')
  })

  it('skips username validation when username is explicitly null', async () => {
    const updatedProfile = { ...MINIMAL_PROFILE, username: null }
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser())
    prismaMock.user.update.mockResolvedValueOnce(makeUser({ userProfile: updatedProfile }))

    await UserProfileService.updateProfile({
      userId: VALID_USER_ID,
      data: { username: null },
    })

    expect(prismaMock.$queryRaw).not.toHaveBeenCalled()
  })

  it('falls back to UserProfileDefault when the stored userProfile is null', async () => {
    const updatedProfile = { ...UserProfileDefault, name: 'Filling default' }
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser({ userProfile: null }))
    prismaMock.user.update.mockResolvedValueOnce(makeUser({ userProfile: updatedProfile }))

    const result = await UserProfileService.updateProfile({
      userId: VALID_USER_ID,
      data: { name: 'Filling default' },
    })

    expect(prismaMock.user.update).toHaveBeenCalled()
    expect(result.name).toBe('Filling default')
  })

  it('accepts valid usernames with only lowercase letters, digits, and underscores', async () => {
    const updatedProfile = { ...MINIMAL_PROFILE, username: 'valid_user_123' }
    prismaMock.user.findUnique.mockResolvedValueOnce(makeUser())
    prismaMock.$queryRaw.mockResolvedValueOnce([]) // available
    prismaMock.user.update.mockResolvedValueOnce(makeUser({ userProfile: updatedProfile }))

    await expect(
      UserProfileService.updateProfile({ userId: VALID_USER_ID, data: { username: 'valid_user_123' } })
    ).resolves.not.toThrow()
  })
})

// ── mergeProfile ───────────────────────────────────────────────────────────────

describe('UserProfileService.mergeProfile', () => {
  it('merges non-undefined incoming fields onto the existing profile', () => {
    const existing = { ...MINIMAL_PROFILE }
    const result = UserProfileService.mergeProfile(existing, { name: 'New Name' })

    expect(result.name).toBe('New Name')
    // Fields not in the patch remain unchanged.
    expect(result.username).toBe('ada_lovelace')
  })

  it('preserves fields from the existing profile that are absent in incoming data', () => {
    const existing = { ...MINIMAL_PROFILE }
    const result = UserProfileService.mergeProfile(existing, { biography: 'Mathematician' })

    expect(result.biography).toBe('Mathematician')
    expect(result.name).toBe('Ada Lovelace')
    expect(result.username).toBe('ada_lovelace')
  })

  it('does NOT apply undefined values (they are filtered out)', () => {
    const existing = { ...MINIMAL_PROFILE }
    // Passing undefined for name should leave name unchanged.
    const result = UserProfileService.mergeProfile(existing, { name: undefined })

    expect(result.name).toBe('Ada Lovelace')
  })

  it('applies null values to explicitly clear a field', () => {
    const existing = { ...MINIMAL_PROFILE }
    const result = UserProfileService.mergeProfile(existing, { name: null })

    expect(result.name).toBeNull()
  })

  it('merges all provided fields in a single call', () => {
    const existing = { ...MINIMAL_PROFILE }
    const result = UserProfileService.mergeProfile(existing, {
      name: 'Updated',
      biography: 'A pioneer',
      hideProfileFromIndex: false,
    })

    expect(result.name).toBe('Updated')
    expect(result.biography).toBe('A pioneer')
    expect(result.hideProfileFromIndex).toBe(false)
  })

  it('returns a new object and does not mutate the existing profile', () => {
    const existing = { ...MINIMAL_PROFILE }
    const result = UserProfileService.mergeProfile(existing, { name: 'Changed' })

    expect(existing.name).toBe('Ada Lovelace') // original unchanged
    expect(result).not.toBe(existing)
  })
})
