import UserService from '@/services/UserService'
import { prisma } from '@/libs/prisma'
import UserMessages from '@/messages/UserMessages'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/utils/FieldValidater', () => ({
  __esModule: true,
  default: {
    isEmail: jest.fn(),
    isPassword: jest.fn(),
  },
}))

import FieldValidater from '@/utils/FieldValidater'

const prismaMock = prisma as any
const fieldValidaterMock = FieldValidater as jest.Mocked<typeof FieldValidater>

const mockDbUser = {
  userId: 'user-1',
  email: 'test@example.com',
  password: 'hashed-password',
  phone: null,
  userRole: 'USER',
  userStatus: 'ACTIVE',
  userProfile: null,
  userPreferences: null,
  userSecurity: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

beforeEach(() => {
  jest.resetAllMocks()
  ;(fieldValidaterMock.isEmail as jest.Mock).mockReturnValue(true)
  ;(fieldValidaterMock.isPassword as jest.Mock).mockReturnValue(true)
})

describe('UserService.create', () => {
  it('throws INVALID_EMAIL when email is invalid', async () => {
    ;(fieldValidaterMock.isEmail as jest.Mock).mockReturnValue(false)

    await expect(
      UserService.create({ email: 'bad-email', password: 'Password123!', name: 'Test' }),
    ).rejects.toThrow(UserMessages.INVALID_EMAIL)
  })

  it('throws EMAIL_ALREADY_EXISTS when email is taken', async () => {
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser)

    await expect(
      UserService.create({ email: 'test@example.com', password: 'Password123!', name: 'Test' }),
    ).rejects.toThrow(UserMessages.EMAIL_ALREADY_EXISTS)
  })

  it('throws INVALID_PASSWORD_FORMAT when password is invalid', async () => {
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(fieldValidaterMock.isPassword as jest.Mock).mockReturnValue(false)

    await expect(
      UserService.create({ email: 'test@example.com', password: 'weak', name: 'Test' }),
    ).rejects.toThrow(UserMessages.INVALID_PASSWORD_FORMAT)
  })

  it('creates user and returns SafeUser without password field', async () => {
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prismaMock.user.create as jest.Mock).mockResolvedValue(mockDbUser)

    const result = await UserService.create({
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
    })

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'test@example.com' }),
      }),
    )
    expect(result).not.toHaveProperty('password')
    expect(result).toHaveProperty('userId')
    expect(result).toHaveProperty('email')
  })

  it('stores hashed password, not plain text', async () => {
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prismaMock.user.create as jest.Mock).mockResolvedValue(mockDbUser)

    await UserService.create({ email: 'test@example.com', password: 'Password123!', name: 'Test' })

    const createCall = (prismaMock.user.create as jest.Mock).mock.calls[0][0]
    expect(createCall.data.password).not.toBe('Password123!')
    expect(createCall.data.password).toMatch(/^\$2[aby]\$/)
  })
})

describe('UserService.getByEmail', () => {
  it('returns user when found', async () => {
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser)

    const result = await UserService.getByEmail('test@example.com')
    expect(result).not.toBeNull()
    expect(result?.email).toBe('test@example.com')
  })

  it('returns null when user is not found', async () => {
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await UserService.getByEmail('nobody@example.com')
    expect(result).toBeNull()
  })
})

describe('UserService.getAll', () => {
  it('returns SafeUser list without password hash or userSecurity', async () => {
    ;(prismaMock.$transaction as jest.Mock).mockResolvedValueOnce([[mockDbUser], 1])

    const result = await UserService.getAll({ page: 0, pageSize: 10 })

    expect(result.total).toBe(1)
    expect(result.users).toHaveLength(1)
    expect(result.users[0]).not.toHaveProperty('password')
    expect(result.users[0]).not.toHaveProperty('userSecurity')
  })

  it('preserves safe profile/preferences fields in list responses', async () => {
    ;(prismaMock.$transaction as jest.Mock).mockResolvedValueOnce([
      [
        {
          ...mockDbUser,
          userProfile: { name: 'Ada', profilePicture: '/p.png', bio: null },
          userPreferences: { newsletter: true },
        },
      ],
      1,
    ])

    const result = await UserService.getAll({ page: 0, pageSize: 10, search: 'ada' })

    expect(result.users[0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        email: 'test@example.com',
        userProfile: expect.objectContaining({ name: 'Ada' }),
        userPreferences: expect.objectContaining({ newsletter: true }),
      })
    )
  })
})

describe('UserService.getById', () => {
  it('returns SafeUser when found', async () => {
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser)

    const result = await UserService.getById('user-1')
    expect(result).toHaveProperty('userId', 'user-1')
    expect(result).not.toHaveProperty('password')
  })

  it('throws USER_NOT_FOUND when user does not exist', async () => {
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(UserService.getById('nonexistent')).rejects.toThrow(UserMessages.USER_NOT_FOUND)
  })
})

describe('UserService.update', () => {
  it('calls prisma.user.update and returns SafeUser', async () => {
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser)
    const updated = { ...mockDbUser, userRole: 'AUTHOR' }
    ;(prismaMock.user.update as jest.Mock).mockResolvedValue(updated)

    const result = await UserService.update({ userId: 'user-1', data: { userRole: 'AUTHOR' } as any })

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    )
    expect(result).not.toHaveProperty('password')
    expect(result).not.toHaveProperty('userSecurity')
  })

  it('throws USER_NOT_FOUND when userId is empty', async () => {
    await expect(UserService.update({ userId: '', data: {} as any })).rejects.toThrow(
      UserMessages.USER_NOT_FOUND,
    )
  })
})

describe('UserService.delete', () => {
  it('throws USER_NOT_FOUND when user does not exist', async () => {
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(UserService.delete('nonexistent')).rejects.toThrow(UserMessages.USER_NOT_FOUND)
  })

  it('deletes user when found and not last admin', async () => {
    const normalUser = { ...mockDbUser, userRole: 'USER' }
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(normalUser)
    ;(prismaMock.user.delete as jest.Mock).mockResolvedValue(normalUser)

    await UserService.delete('user-1')

    expect(prismaMock.user.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    )
  })
})

// ── Phase 17: UserService edge-case tests ────────────────────────────────────

describe('UserService.create — email conflict on registration', () => {
  it('throws EMAIL_ALREADY_EXISTS when email is already registered', async () => {
    ;(fieldValidaterMock.isEmail as jest.Mock).mockReturnValue(true)
    ;(fieldValidaterMock.isPassword as jest.Mock).mockReturnValue(true)
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser)

    await expect(
      UserService.create({ email: 'test@example.com', password: 'Password123!', name: 'Test' })
    ).rejects.toThrow(UserMessages.EMAIL_ALREADY_EXISTS)
  })

  it('normalizes email to lowercase before uniqueness check', async () => {
    ;(fieldValidaterMock.isEmail as jest.Mock).mockReturnValue(true)
    ;(fieldValidaterMock.isPassword as jest.Mock).mockReturnValue(true)
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prismaMock.user.create as jest.Mock).mockResolvedValue({ ...mockDbUser, email: 'test@example.com' })

    await UserService.create({ email: 'TEST@Example.COM', password: 'Password123!', name: 'Test' })

    const findCall = (prismaMock.user.findUnique as jest.Mock).mock.calls[0][0]
    expect(findCall.where.email).toBe('test@example.com')
  })
})

describe('UserService.update — duplicate email rejection', () => {
  it('throws EMAIL_ALREADY_EXISTS when updated email belongs to a different user', async () => {
    ;(prismaMock.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockDbUser) // current user lookup
      .mockResolvedValueOnce({ userId: 'other-user' }) // email conflict check

    await expect(
      UserService.update({ userId: 'user-1', data: { email: 'taken@example.com' } as any })
    ).rejects.toThrow(UserMessages.EMAIL_ALREADY_EXISTS)
  })

  it('allows updating email to the same email (no conflict with self)', async () => {
    const sameEmailUser = { ...mockDbUser, email: 'test@example.com' }
    ;(prismaMock.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(sameEmailUser) // current user
      .mockResolvedValueOnce({ userId: 'user-1' }) // same userId — no conflict

    ;(prismaMock.user.update as jest.Mock).mockResolvedValue(sameEmailUser)

    const result = await UserService.update({ userId: 'user-1', data: { email: 'test@example.com' } as any })
    expect(result.email).toBe('test@example.com')
  })
})

describe('UserService.getById — sensitive field exclusion', () => {
  it('does not include password field in the returned user', async () => {
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser)
    const result = await UserService.getById('user-1')
    expect(result).not.toHaveProperty('password')
  })

  it('does not include userSecurity field in the returned user', async () => {
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ ...mockDbUser, userSecurity: { otpSecret: 'sensitive' } })
    const result = await UserService.getById('user-1')
    expect(result).not.toHaveProperty('userSecurity')
  })

  it('does not include internal DB tokens in the returned user', async () => {
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser)
    const result = await UserService.getById('user-1')
    // SafeUserSchema must strip these
    expect(result).not.toHaveProperty('password')
    expect(result).toHaveProperty('userId')
    expect(result).toHaveProperty('email')
  })
})

describe('UserService.update — last admin protection', () => {
  it('throws LAST_ADMIN_CANNOT_DOWNGRADE when downgrading the sole admin', async () => {
    const adminUser = { ...mockDbUser, userRole: 'ADMIN' }
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(adminUser)
    ;(prismaMock.user.count as jest.Mock).mockResolvedValue(1)

    await expect(
      UserService.update({ userId: 'user-1', data: { userRole: 'USER' } as any })
    ).rejects.toThrow(UserMessages.LAST_ADMIN_CANNOT_DOWNGRADE)
  })

  it('allows downgrading an admin when multiple admins exist', async () => {
    const adminUser = { ...mockDbUser, userRole: 'ADMIN' }
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(adminUser)
    ;(prismaMock.user.count as jest.Mock).mockResolvedValue(2)
    ;(prismaMock.user.update as jest.Mock).mockResolvedValue({ ...mockDbUser, userRole: 'USER' })

    const result = await UserService.update({ userId: 'user-1', data: { userRole: 'USER' } as any })
    expect(result.userRole).toBe('USER')
  })
})

describe('UserService.delete — last admin protection', () => {
  it('throws LAST_ADMIN_CANNOT_DELETE when deleting the sole admin', async () => {
    const adminUser = { ...mockDbUser, userRole: 'ADMIN' }
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(adminUser)
    ;(prismaMock.user.count as jest.Mock).mockResolvedValue(1)

    await expect(UserService.delete('user-1')).rejects.toThrow(UserMessages.LAST_ADMIN_CANNOT_DELETE)
  })
})
