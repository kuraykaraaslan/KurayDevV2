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
