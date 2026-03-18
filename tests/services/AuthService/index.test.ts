jest.mock('@/libs/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userSession: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

jest.mock('@/services/UserService', () => ({
  __esModule: true,
  default: { getByEmail: jest.fn() },
}))

jest.mock('@/services/NotificationService/MailService', () => ({
  __esModule: true,
  default: { sendWelcomeEmail: jest.fn().mockResolvedValue(undefined) },
}))

jest.mock('@/services/NotificationService/SMSService', () => ({
  __esModule: true,
  default: { sendShortMessage: jest.fn().mockResolvedValue(undefined) },
}))

jest.mock('@/services/AuthService/SecurityService', () => ({
  __esModule: true,
  default: { getUserSecurity: jest.fn() },
}))

import { prisma } from '@/libs/prisma'
import bcrypt from 'bcrypt'
import AuthService from '@/services/AuthService'
import UserService from '@/services/UserService'
import SecurityService from '@/services/AuthService/SecurityService'

const prismaMock = prisma as jest.Mocked<typeof prisma>
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>
const userServiceMock = UserService as jest.Mocked<typeof UserService>
const securityMock = SecurityService as jest.Mocked<typeof SecurityService>

const SAFE_USER = {
  userId: 'user-1',
  email: 'test@example.com',
  userRole: 'USER',
  userStatus: 'ACTIVE',
  phone: null,
  name: null,
  userProfile: null,
  userPreferences: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const DB_USER = { ...SAFE_USER, password: '$2b$10$hashedpassword' }

describe('AuthService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── generateToken ─────────────────────────────────────────────────────────
  describe('generateToken', () => {
    it('returns a 6-digit numeric string', () => {
      const token = AuthService.generateToken()
      expect(token).toMatch(/^\d{6}$/)
    })

    it('produces values between 100000 and 999999', () => {
      for (let i = 0; i < 20; i++) {
        const n = parseInt(AuthService.generateToken(), 10)
        expect(n).toBeGreaterThanOrEqual(100000)
        expect(n).toBeLessThanOrEqual(999999)
      }
    })
  })

  // ── hashPassword ──────────────────────────────────────────────────────────
  describe('hashPassword', () => {
    it('delegates to bcrypt.hash and returns the hash', async () => {
      ;(bcryptMock.hash as jest.Mock).mockResolvedValueOnce('hashed-pw')
      const result = await AuthService.hashPassword('mypassword')
      expect(bcryptMock.hash).toHaveBeenCalledWith('mypassword', expect.any(Number))
      expect(result).toBe('hashed-pw')
    })
  })

  // ── login ─────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('returns SafeUser and userSecurity on valid credentials', async () => {
      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(DB_USER)
      ;(bcryptMock.compare as jest.Mock).mockResolvedValueOnce(true)
      ;(securityMock.getUserSecurity as jest.Mock).mockResolvedValueOnce({
        userSecurity: { twoFactorEnabled: false },
      })

      const result = await AuthService.login({ email: 'test@example.com', password: 'pass123' })
      expect(result.user.email).toBe('test@example.com')
      expect(result.userSecurity).toBeDefined()
    })

    it('normalizes email to lowercase before lookup', async () => {
      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(DB_USER)
      ;(bcryptMock.compare as jest.Mock).mockResolvedValueOnce(true)
      ;(securityMock.getUserSecurity as jest.Mock).mockResolvedValueOnce({
        userSecurity: { twoFactorEnabled: false },
      })

      await AuthService.login({ email: 'TEST@EXAMPLE.COM', password: 'pass123' })
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
    })

    it('throws INVALID_EMAIL_OR_PASSWORD when user not found', async () => {
      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(null)
      await expect(AuthService.login({ email: 'unknown@example.com', password: 'pass' })).rejects.toThrow(
        'INVALID_EMAIL_OR_PASSWORD'
      )
    })

    it('throws INVALID_EMAIL_OR_PASSWORD when password is wrong', async () => {
      ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(DB_USER)
      ;(bcryptMock.compare as jest.Mock).mockResolvedValueOnce(false)
      await expect(AuthService.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(
        'INVALID_EMAIL_OR_PASSWORD'
      )
    })
  })

  // ── logout ────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('deletes sessions for the given accessToken', async () => {
      ;(prismaMock.userSession.findMany as jest.Mock).mockResolvedValueOnce([{ userSessionId: 'sess-1' }])
      ;(prismaMock.userSession.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 1 })

      await AuthService.logout({ accessToken: 'valid-token' })
      expect(prismaMock.userSession.deleteMany).toHaveBeenCalledWith({
        where: { accessToken: 'valid-token' },
      })
    })

    it('throws SESSION_NOT_FOUND when no sessions exist', async () => {
      ;(prismaMock.userSession.findMany as jest.Mock).mockResolvedValueOnce([])
      await expect(AuthService.logout({ accessToken: 'ghost-token' })).rejects.toThrow('SESSION_NOT_FOUND')
    })
  })

  // ── register ──────────────────────────────────────────────────────────────
  describe('register', () => {
    it('throws EMAIL_ALREADY_EXISTS when user already exists', async () => {
      ;(userServiceMock.getByEmail as jest.Mock).mockResolvedValueOnce(SAFE_USER)
      await expect(
        AuthService.register({ email: 'test@example.com', password: 'pass123' })
      ).rejects.toThrow('EMAIL_ALREADY_EXISTS')
    })

    it('creates a new user and sends welcome notifications', async () => {
      ;(userServiceMock.getByEmail as jest.Mock).mockResolvedValueOnce(null)
      ;(bcryptMock.hash as jest.Mock).mockResolvedValueOnce('hashed-pass')
      ;(prismaMock.user.create as jest.Mock).mockResolvedValueOnce({
        ...SAFE_USER,
        email: 'new@example.com',
      })

      const result = await AuthService.register({ email: 'new@example.com', password: 'pass123' })
      expect(result.email).toBe('new@example.com')
      expect(prismaMock.user.create).toHaveBeenCalled()
    })
  })

  // ── checkIfUserHasRole ────────────────────────────────────────────────────
  describe('checkIfUserHasRole', () => {
    it('returns true when user role equals required role', () => {
      const user = { ...SAFE_USER, userRole: 'USER' } as any
      expect(AuthService.checkIfUserHasRole(user, 'USER')).toBe(true)
    })

    it('returns true when user role is higher (ADMIN ≥ USER)', () => {
      const admin = { ...SAFE_USER, userRole: 'ADMIN' } as any
      expect(AuthService.checkIfUserHasRole(admin, 'USER')).toBe(true)
    })

    it('returns false when user role is lower than required', () => {
      const user = { ...SAFE_USER, userRole: 'USER' } as any
      expect(AuthService.checkIfUserHasRole(user, 'ADMIN')).toBe(false)
    })

    it('returns false for an unknown role', () => {
      const user = { ...SAFE_USER, userRole: 'UNKNOWN' } as any
      expect(AuthService.checkIfUserHasRole(user, 'USER')).toBe(false)
    })
  })
})
