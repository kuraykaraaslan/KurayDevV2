import UserService from '@/services/UserService'
import FieldValidater from '@/utils/FieldValidater'

// Mock prisma client so prisma.user methods are available as jest mocks
jest.mock('@/libs/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { prisma } from '@/libs/prisma'

jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashed_password')),
}))

jest.mock('@/utils/FieldValidater', () => ({
  __esModule: true,
  default: {
    isEmail: jest.fn(),
    isPassword: jest.fn(),
  },
}))

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockUser = {
    userId: '1',
    email: 'test@example.com',
    name: 'Test User',
    phone: '555-5555',
    password: 'hashed_password',
    userRole: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
    profilePicture: null,
    otpMethods: [],
  }

  // CREATE
  it('creates a new user successfully', async () => {
    ;(FieldValidater.isEmail as jest.Mock).mockReturnValue(true)
    ;(FieldValidater.isPassword as jest.Mock).mockReturnValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

    const result = await UserService.create({
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
    })

    expect(result.email).toBe('test@example.com')
    expect(prisma.user.create).toHaveBeenCalled()
  })

  it('throws error when email invalid', async () => {
    ;(FieldValidater.isEmail as jest.Mock).mockReturnValue(false)
    await expect(
      UserService.create({
        email: 'invalid',
        password: 'Password123!',
        name: 'Test User',
      })
    ).rejects.toThrow(UserService.INVALID_EMAIL)
  })

  it('throws error when password invalid', async () => {
    ;(FieldValidater.isEmail as jest.Mock).mockReturnValue(true)
    ;(FieldValidater.isPassword as jest.Mock).mockReturnValue(false)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(
      UserService.create({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      })
    ).rejects.toThrow(UserService.INVALID_PASSWORD_FORMAT)
  })

  it('throws error when email already exists', async () => {
    ;(FieldValidater.isEmail as jest.Mock).mockReturnValue(true)
    ;(FieldValidater.isPassword as jest.Mock).mockReturnValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

    await expect(
      UserService.create({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      })
    ).rejects.toThrow(UserService.EMAIL_ALREADY_EXISTS)
  })

  // GET BY ID
  it('gets user by ID successfully', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    const result = await UserService.getById('1')
    expect(result.email).toBe(mockUser.email)
  })

  it('throws error when user not found by ID', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    await expect(UserService.getById('999')).rejects.toThrow(UserService.USER_NOT_FOUND)
  })

  // UPDATE
  it('updates user successfully', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, name: 'Updated' })
    const result = await UserService.update({ userId: '1', name: 'Updated' })
    expect(result.name).toBe('Updated')
  })

  it('throws error when updating non-existing user', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    await expect(UserService.update({ userId: '404', name: 'X' })).rejects.toThrow(
      UserService.USER_NOT_FOUND
    )
  })

  // DELETE
  it('deletes user successfully', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(prisma.user.delete as jest.Mock).mockResolvedValue(undefined)
    await expect(UserService.delete('1')).resolves.not.toThrow()
    expect(prisma.user.delete).toHaveBeenCalled()
  })

  it('throws error when deleting non-existing user', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    await expect(UserService.delete('999')).rejects.toThrow(UserService.USER_NOT_FOUND)
  })

  // GET BY EMAIL
  it('gets user by email successfully', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    const result = await UserService.getByEmail('test@example.com')
    expect(result?.email).toBe(mockUser.email)
  })
})
