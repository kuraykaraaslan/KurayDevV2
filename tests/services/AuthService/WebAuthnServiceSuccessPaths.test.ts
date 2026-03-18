// Tests for WebAuthnService success paths (verifyRegistration, verifyAuthentication)
// These mock @simplewebauthn/server to cover lines 96-135 and 244-275

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn().mockResolvedValue({ challenge: 'reg-challenge' }),
  verifyRegistrationResponse: jest.fn(),
  generateAuthenticationOptions: jest.fn().mockResolvedValue({ challenge: 'auth-challenge' }),
  verifyAuthenticationResponse: jest.fn(),
}))

jest.mock('@/libs/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  },
}))

jest.mock('@/libs/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}))

jest.mock('@/services/AuthService/SecurityService', () => ({
  __esModule: true,
  default: {
    getUserSecurity: jest.fn(),
    updateUserSecurity: jest.fn(),
  },
}))

import WebAuthnService from '@/services/AuthService/WebAuthnService'
import AuthMessages from '@/messages/AuthMessages'
import { verifyRegistrationResponse, verifyAuthenticationResponse } from '@simplewebauthn/server'
import redis from '@/libs/redis'

const { prisma } = require('@/libs/prisma')
const SecurityService = require('@/services/AuthService/SecurityService').default
const mockRedis = redis as jest.Mocked<typeof redis>

const mockUser = {
  userId: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  userRole: 'USER',
  userStatus: 'ACTIVE',
  phone: null,
  userProfile: null,
  userPreferences: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('WebAuthnService.verifyRegistration — success path', () => {
  it('stores new passkey and returns credentialId on successful verification', async () => {
    const mockCredential = {
      id: 'cred-base64url-id',
      publicKey: new Uint8Array([1, 2, 3, 4, 5]),
      counter: 0,
      transports: ['usb', 'nfc'],
    }

    ;(mockRedis.get as jest.Mock).mockResolvedValueOnce('stored-challenge')
    ;(verifyRegistrationResponse as jest.Mock).mockResolvedValueOnce({
      verified: true,
      registrationInfo: {
        credential: mockCredential,
        aaguid: '00000000-0000-0000-0000-000000000000',
      },
    })
    SecurityService.getUserSecurity.mockResolvedValueOnce({
      userSecurity: { passkeys: [], passkeyEnabled: false },
    })
    SecurityService.updateUserSecurity.mockResolvedValueOnce(undefined)
    ;(mockRedis.del as jest.Mock).mockResolvedValueOnce(1)

    const result = await WebAuthnService.verifyRegistration({
      user: mockUser as any,
      response: { id: 'cred-base64url-id', type: 'public-key' } as any,
      label: 'My YubiKey',
    })

    expect(result.credentialId).toBe('cred-base64url-id')
    expect(SecurityService.updateUserSecurity).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        passkeyEnabled: true,
        passkeys: expect.arrayContaining([
          expect.objectContaining({
            credentialId: 'cred-base64url-id',
            label: 'My YubiKey',
            counter: 0,
            transports: ['usb', 'nfc'],
          }),
        ]),
      })
    )
    expect(mockRedis.del).toHaveBeenCalled()
  })

  it('throws PASSKEY_REGISTRATION_FAILED when verification returns verified=false', async () => {
    ;(mockRedis.get as jest.Mock).mockResolvedValueOnce('stored-challenge')
    ;(verifyRegistrationResponse as jest.Mock).mockResolvedValueOnce({
      verified: false,
      registrationInfo: null,
    })

    await expect(
      WebAuthnService.verifyRegistration({
        user: mockUser as any,
        response: {} as any,
      })
    ).rejects.toThrow(AuthMessages.PASSKEY_REGISTRATION_FAILED)
  })

  it('appends new passkey to existing passkeys list', async () => {
    const existingPasskey = {
      credentialId: 'existing-cred',
      publicKey: 'existing-pk',
      counter: 5,
      aaguid: 'aaguid',
      label: 'Old Key',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastUsedAt: null,
      transports: [],
    }

    ;(mockRedis.get as jest.Mock).mockResolvedValueOnce('challenge-xyz')
    ;(verifyRegistrationResponse as jest.Mock).mockResolvedValueOnce({
      verified: true,
      registrationInfo: {
        credential: {
          id: 'new-cred-id',
          publicKey: new Uint8Array([9, 8, 7]),
          counter: 0,
          transports: ['internal'],
        },
        aaguid: 'aaguid-new',
      },
    })
    SecurityService.getUserSecurity.mockResolvedValueOnce({
      userSecurity: { passkeys: [existingPasskey], passkeyEnabled: true },
    })
    SecurityService.updateUserSecurity.mockResolvedValueOnce(undefined)
    ;(mockRedis.del as jest.Mock).mockResolvedValueOnce(1)

    await WebAuthnService.verifyRegistration({
      user: mockUser as any,
      response: {} as any,
    })

    expect(SecurityService.updateUserSecurity).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        passkeys: expect.arrayContaining([
          expect.objectContaining({ credentialId: 'existing-cred' }),
          expect.objectContaining({ credentialId: 'new-cred-id' }),
        ]),
      })
    )
  })

  it('uses default label when none provided', async () => {
    ;(mockRedis.get as jest.Mock).mockResolvedValueOnce('challenge')
    ;(verifyRegistrationResponse as jest.Mock).mockResolvedValueOnce({
      verified: true,
      registrationInfo: {
        credential: {
          id: 'cred-no-label',
          publicKey: new Uint8Array([1]),
          counter: 0,
          transports: [],
        },
        aaguid: 'aaguid',
      },
    })
    SecurityService.getUserSecurity.mockResolvedValueOnce({
      userSecurity: { passkeys: [] },
    })
    SecurityService.updateUserSecurity.mockResolvedValueOnce(undefined)
    ;(mockRedis.del as jest.Mock).mockResolvedValueOnce(1)

    await WebAuthnService.verifyRegistration({
      user: mockUser as any,
      response: {} as any,
      // no label provided
    })

    expect(SecurityService.updateUserSecurity).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        passkeys: expect.arrayContaining([
          expect.objectContaining({ label: expect.stringContaining('Passkey') }),
        ]),
      })
    )
  })
})

describe('WebAuthnService.verifyAuthentication — success path', () => {
  it('verifies authentication and returns SafeUser on success', async () => {
    const storedPasskey = {
      credentialId: 'cred-1',
      publicKey: Buffer.from([1, 2, 3]).toString('base64url'),
      counter: 0,
      transports: ['usb'],
      label: 'My Key',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastUsedAt: null,
      aaguid: 'aaguid',
    }

    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ userId: 'user-1' }])
    prisma.user.findUnique.mockResolvedValueOnce(mockUser)
    SecurityService.getUserSecurity.mockResolvedValueOnce({
      userSecurity: { passkeys: [storedPasskey] },
    })
    // challenge found in user-scoped key
    ;(mockRedis.get as jest.Mock).mockResolvedValueOnce('stored-auth-challenge')
    ;(verifyAuthenticationResponse as jest.Mock).mockResolvedValueOnce({
      verified: true,
      authenticationInfo: { newCounter: 1 },
    })
    SecurityService.updateUserSecurity.mockResolvedValueOnce(undefined)
    ;(mockRedis.del as jest.Mock).mockResolvedValueOnce(1)

    const result = await WebAuthnService.verifyAuthentication({
      response: { id: 'cred-1', type: 'public-key' } as any,
    })

    expect(result.userId).toBe('user-1')
    expect(SecurityService.updateUserSecurity).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        passkeys: expect.arrayContaining([
          expect.objectContaining({ credentialId: 'cred-1', counter: 1 }),
        ]),
      })
    )
    expect(mockRedis.del).toHaveBeenCalled()
  })

  it('throws PASSKEY_AUTHENTICATION_FAILED when verification returns verified=false', async () => {
    const storedPasskey = {
      credentialId: 'cred-bad',
      publicKey: Buffer.from([1]).toString('base64url'),
      counter: 0,
      transports: [],
    }

    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ userId: 'user-1' }])
    prisma.user.findUnique.mockResolvedValueOnce(mockUser)
    SecurityService.getUserSecurity.mockResolvedValueOnce({
      userSecurity: { passkeys: [storedPasskey] },
    })
    ;(mockRedis.get as jest.Mock).mockResolvedValueOnce('auth-challenge')
    ;(verifyAuthenticationResponse as jest.Mock).mockResolvedValueOnce({
      verified: false,
    })

    await expect(
      WebAuthnService.verifyAuthentication({ response: { id: 'cred-bad' } as any })
    ).rejects.toThrow(AuthMessages.PASSKEY_AUTHENTICATION_FAILED)
  })

  it('uses resident-key challenge when user-scoped challenge is absent', async () => {
    const storedPasskey = {
      credentialId: 'resident-cred',
      publicKey: Buffer.from([5, 6]).toString('base64url'),
      counter: 0,
      transports: [],
    }

    prisma.$queryRawUnsafe.mockResolvedValueOnce([{ userId: 'user-1' }])
    prisma.user.findUnique.mockResolvedValueOnce(mockUser)
    SecurityService.getUserSecurity.mockResolvedValueOnce({
      userSecurity: { passkeys: [storedPasskey] },
    })
    // user-scoped challenge absent, resident key present
    ;(mockRedis.get as jest.Mock)
      .mockResolvedValueOnce(null) // user-scoped key
      .mockResolvedValueOnce('resident-challenge') // resident key
    ;(verifyAuthenticationResponse as jest.Mock).mockResolvedValueOnce({
      verified: true,
      authenticationInfo: { newCounter: 2 },
    })
    SecurityService.updateUserSecurity.mockResolvedValueOnce(undefined)
    ;(mockRedis.del as jest.Mock).mockResolvedValueOnce(1)

    const result = await WebAuthnService.verifyAuthentication({
      response: { id: 'resident-cred' } as any,
    })

    expect(result.userId).toBe('user-1')
  })

  it('falls back to email user lookup when $queryRawUnsafe returns no rows', async () => {
    const storedPasskey = {
      credentialId: 'email-cred',
      publicKey: Buffer.from([7]).toString('base64url'),
      counter: 0,
      transports: [],
    }

    prisma.$queryRawUnsafe.mockResolvedValueOnce([]) // no rows from credential scan
    prisma.user.findUnique.mockResolvedValueOnce(mockUser) // email fallback
    SecurityService.getUserSecurity.mockResolvedValueOnce({
      userSecurity: { passkeys: [storedPasskey] },
    })
    ;(mockRedis.get as jest.Mock).mockResolvedValueOnce('email-challenge')
    ;(verifyAuthenticationResponse as jest.Mock).mockResolvedValueOnce({
      verified: true,
      authenticationInfo: { newCounter: 1 },
    })
    SecurityService.updateUserSecurity.mockResolvedValueOnce(undefined)
    ;(mockRedis.del as jest.Mock).mockResolvedValueOnce(1)

    const result = await WebAuthnService.verifyAuthentication({
      response: { id: 'email-cred' } as any,
      email: 'test@example.com',
    })

    expect(result.userId).toBe('user-1')
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    })
  })
})
