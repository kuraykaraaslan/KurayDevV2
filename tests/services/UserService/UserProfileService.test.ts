import UserProfileService from '@/services/UserService/UserProfileService'
import { prisma } from '@/libs/prisma'
import UserMessages from '@/messages/UserMessages'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}))

const prismaMock = prisma as any

const defaultUserProfile = {
  name: 'Test User',
  username: 'testuser',
  biography: null,
  profilePicture: null,
  headerImage: null,
  socialLinks: [],
  hideProfileFromIndex: true,
}

const mockDbUser = {
  userId: 'user-1',
  email: 'test@example.com',
  password: 'hashed',
  phone: null,
  userRole: 'USER',
  userStatus: 'ACTIVE',
  userProfile: defaultUserProfile,
  userPreferences: null,
  userSecurity: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

beforeEach(() => {
  jest.resetAllMocks()
})

// ── UserProfileService.getProfile ────────────────────────────────────────────

describe('UserProfileService.getProfile', () => {
  it('returns the parsed userProfile for an existing user', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(mockDbUser)

    const result = await UserProfileService.getProfile('user-1')

    expect(result).toBeDefined()
    expect(result.name).toBe('Test User')
    expect(result.username).toBe('testuser')
  })

  it('throws USER_NOT_FOUND when user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)

    await expect(UserProfileService.getProfile('nonexistent')).rejects.toThrow(
      UserMessages.USER_NOT_FOUND
    )
  })

  it('falls back to UserProfileDefault when userProfile is null', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ ...mockDbUser, userProfile: null })

    const result = await UserProfileService.getProfile('user-1')

    // Default profile should still parse successfully
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
    expect(result.name).toBeNull()
  })

  it('does not return sensitive user fields (password, userSecurity)', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(mockDbUser)

    const result = await UserProfileService.getProfile('user-1')

    // getProfile returns UserProfile (not User) — should not contain these
    expect(result).not.toHaveProperty('password')
    expect(result).not.toHaveProperty('userSecurity')
    expect(result).not.toHaveProperty('email')
  })

  it('returns socialLinks as an array', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(mockDbUser)

    const result = await UserProfileService.getProfile('user-1')
    expect(Array.isArray(result.socialLinks)).toBe(true)
  })
})

// ── UserProfileService.updateProfile ────────────────────────────────────────

describe('UserProfileService.updateProfile', () => {
  it('throws USER_NOT_FOUND when userId does not match any user', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)

    await expect(
      UserProfileService.updateProfile({ userId: 'ghost', data: { name: 'Ghost' } })
    ).rejects.toThrow(UserMessages.USER_NOT_FOUND)
  })

  it('merges partial data with existing profile', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(mockDbUser)
    const updatedProfile = { ...defaultUserProfile, biography: 'Hello world' }
    prismaMock.user.update.mockResolvedValueOnce({
      ...mockDbUser,
      userProfile: updatedProfile,
    })

    const result = await UserProfileService.updateProfile({
      userId: 'user-1',
      data: { biography: 'Hello world' },
    })

    expect(result.biography).toBe('Hello world')
    expect(result.name).toBe('Test User') // unchanged fields preserved
  })

  it('throws INVALID_USERNAME for username with uppercase letters', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(mockDbUser)

    await expect(
      UserProfileService.updateProfile({ userId: 'user-1', data: { username: 'InvalidName' } })
    ).rejects.toThrow(UserMessages.INVALID_USERNAME)
  })

  it('throws INVALID_USERNAME for username with special characters', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(mockDbUser)

    await expect(
      UserProfileService.updateProfile({ userId: 'user-1', data: { username: 'bad@user!' } })
    ).rejects.toThrow(UserMessages.INVALID_USERNAME)
  })

  it('throws INVALID_USERNAME for username with spaces', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(mockDbUser)

    await expect(
      UserProfileService.updateProfile({ userId: 'user-1', data: { username: 'bad user' } })
    ).rejects.toThrow(UserMessages.INVALID_USERNAME)
  })

  it('accepts valid lowercase alphanumeric username with underscores', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(mockDbUser)
    prismaMock.$queryRaw.mockResolvedValueOnce([]) // no existing username conflict
    const updatedProfile = { ...defaultUserProfile, username: 'valid_user_123' }
    prismaMock.user.update.mockResolvedValueOnce({
      ...mockDbUser,
      userProfile: updatedProfile,
    })

    const result = await UserProfileService.updateProfile({
      userId: 'user-1',
      data: { username: 'valid_user_123' },
    })

    expect(result.username).toBe('valid_user_123')
  })

  it('throws USERNAME_TAKEN when username belongs to a different user', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(mockDbUser)
    // $queryRaw returns another user owning the requested username
    prismaMock.$queryRaw.mockResolvedValueOnce([{ userId: 'other-user-99' }])

    await expect(
      UserProfileService.updateProfile({ userId: 'user-1', data: { username: 'takenusername' } })
    ).rejects.toThrow(UserMessages.USERNAME_TAKEN)
  })

  it('allows re-claiming the same username for the same user', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(mockDbUser)
    // $queryRaw returns same userId — no conflict
    prismaMock.$queryRaw.mockResolvedValueOnce([{ userId: 'user-1' }])
    const updatedProfile = { ...defaultUserProfile, username: 'testuser' }
    prismaMock.user.update.mockResolvedValueOnce({
      ...mockDbUser,
      userProfile: updatedProfile,
    })

    const result = await UserProfileService.updateProfile({
      userId: 'user-1',
      data: { username: 'testuser' },
    })

    expect(result.username).toBe('testuser')
  })

  it('does not check username availability when username is undefined', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(mockDbUser)
    const updatedProfile = { ...defaultUserProfile, biography: 'No username change' }
    prismaMock.user.update.mockResolvedValueOnce({
      ...mockDbUser,
      userProfile: updatedProfile,
    })

    const result = await UserProfileService.updateProfile({
      userId: 'user-1',
      data: { biography: 'No username change' },
    })

    expect(prismaMock.$queryRaw).not.toHaveBeenCalled()
    expect(result.biography).toBe('No username change')
  })

  it('does not validate username when explicitly set to null', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(mockDbUser)
    const updatedProfile = { ...defaultUserProfile, username: null }
    prismaMock.user.update.mockResolvedValueOnce({
      ...mockDbUser,
      userProfile: updatedProfile,
    })

    const result = await UserProfileService.updateProfile({
      userId: 'user-1',
      data: { username: null },
    })

    // null is allowed — no validation is run (the guard checks !== null)
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled()
    expect(result.username).toBeNull()
  })

  it('preserves unrelated profile fields when updating a single field', async () => {
    const userWithExtraData = {
      ...mockDbUser,
      userProfile: {
        ...defaultUserProfile,
        name: 'Full Name',
        username: 'existinguser',
      },
    }
    prismaMock.user.findUnique.mockResolvedValueOnce(userWithExtraData)
    const updatedProfile = { ...userWithExtraData.userProfile, biography: 'Updated bio' }
    prismaMock.user.update.mockResolvedValueOnce({
      ...mockDbUser,
      userProfile: updatedProfile,
    })

    const result = await UserProfileService.updateProfile({
      userId: 'user-1',
      data: { biography: 'Updated bio' },
    })

    expect(result.name).toBe('Full Name')
    expect(result.username).toBe('existinguser')
    expect(result.biography).toBe('Updated bio')
  })

  it('calls prisma.user.update with merged profile data', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(mockDbUser)
    const updatedProfile = { ...defaultUserProfile, name: 'New Name' }
    prismaMock.user.update.mockResolvedValueOnce({
      ...mockDbUser,
      userProfile: updatedProfile,
    })

    await UserProfileService.updateProfile({ userId: 'user-1', data: { name: 'New Name' } })

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        data: expect.objectContaining({
          userProfile: expect.objectContaining({ name: 'New Name' }),
        }),
      })
    )
  })
})

// ── UserProfileService.mergeProfile ──────────────────────────────────────────

describe('UserProfileService.mergeProfile', () => {
  it('merges incoming fields over existing', () => {
    const existing = {
      name: 'Old Name',
      biography: null,
      username: 'olduser',
      profilePicture: null,
      headerImage: null,
      socialLinks: [],
      hideProfileFromIndex: true,
    } as any

    const result = UserProfileService.mergeProfile(existing, { name: 'New Name', biography: 'Some bio' })

    expect(result.name).toBe('New Name')
    expect(result.biography).toBe('Some bio')
    expect(result.username).toBe('olduser') // unchanged
  })

  it('does not overwrite fields not present in incoming (undefined is ignored)', () => {
    const existing = {
      name: 'Kept Name',
      biography: 'Kept bio',
      username: null,
      profilePicture: null,
      headerImage: null,
      socialLinks: [],
      hideProfileFromIndex: true,
    } as any

    const result = UserProfileService.mergeProfile(existing, { username: undefined as any })

    expect(result.name).toBe('Kept Name')
    expect(result.biography).toBe('Kept bio')
  })

  it('null values explicitly clear a field', () => {
    const existing = {
      name: 'Has Name',
      biography: 'Has bio',
      username: 'someuser',
      profilePicture: null,
      headerImage: null,
      socialLinks: [],
      hideProfileFromIndex: true,
    } as any

    const result = UserProfileService.mergeProfile(existing, { biography: null })

    expect(result.biography).toBeNull()
    expect(result.name).toBe('Has Name') // unchanged
  })

  it('returns a new object that is a superset of existing fields', () => {
    const existing = {
      name: 'Alice',
      biography: null,
      username: 'alice',
      profilePicture: null,
      headerImage: null,
      socialLinks: [],
      hideProfileFromIndex: false,
    } as any

    const result = UserProfileService.mergeProfile(existing, { name: 'Alice Updated' })

    expect(result).toMatchObject({
      name: 'Alice Updated',
      username: 'alice',
      biography: null,
    })
  })
})
