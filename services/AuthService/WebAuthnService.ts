import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server'

import { prisma } from '@/libs/prisma'
import redis from '@/libs/redis'
import AuthMessages from '@/messages/AuthMessages'
import SecurityService from './SecurityService'
import {
  PASSKEY_REG_CHALLENGE_KEY,
  PASSKEY_AUTH_CHALLENGE_KEY,
  PASSKEY_EMAIL_CHALLENGE_KEY,
  PASSKEY_CHALLENGE_TTL_SECONDS,
  PASSKEY_MAX_PER_USER,
  APPLICATION_DOMAIN,
} from './constants'
import { StoredPasskey } from '@/types/user/UserSecurityTypes'
import { SafeUser } from '@/types/user/UserTypes'

const RP_NAME = process.env.WEBAUTHN_RP_NAME ?? 'KurayDev'
const RP_ID = process.env.WEBAUTHN_RP_ID ?? APPLICATION_DOMAIN
const ORIGIN = process.env.WEBAUTHN_ORIGIN ?? `https://${APPLICATION_DOMAIN}`

export default class WebAuthnService {
  // ── Registration ──────────────────────────────────────────────────────────

  /**
   * Generates PublicKeyCredentialCreationOptions for a logged-in user.
   * Stores the challenge in Redis so it can be verified later.
   */
  static async generateRegistrationOptions(user: SafeUser): Promise<Record<string, unknown>> {
    const { userSecurity } = await SecurityService.getUserSecurity(user.userId)

    if (userSecurity.passkeys.length >= PASSKEY_MAX_PER_USER) {
      throw new Error(AuthMessages.PASSKEY_LIMIT_REACHED)
    }

    // Exclude credentials the user already has registered
    const excludeCredentials = userSecurity.passkeys.map((pk) => ({
      id: pk.credentialId,
      transports: (pk.transports ?? []) as AuthenticatorTransportFuture[],
    }))

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: user.email,
      userDisplayName: user.name ?? user.email,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    })

    await redis.set(
      PASSKEY_REG_CHALLENGE_KEY(user.userId),
      options.challenge,
      'EX',
      PASSKEY_CHALLENGE_TTL_SECONDS
    )

    return options as unknown as Record<string, unknown>
  }

  /**
   * Verifies the RegistrationResponseJSON sent by the browser and stores
   * the new credential in `userSecurity.passkeys`.
   */
  static async verifyRegistration({
    user,
    response,
    label,
  }: {
    user: SafeUser
    response: RegistrationResponseJSON
    label?: string
  }): Promise<{ credentialId: string }> {
    const challenge = await redis.get(PASSKEY_REG_CHALLENGE_KEY(user.userId))
    if (!challenge) throw new Error(AuthMessages.PASSKEY_CHALLENGE_EXPIRED)

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: false,
    })

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error(AuthMessages.PASSKEY_REGISTRATION_FAILED)
    }

    const { credential, aaguid } = verification.registrationInfo

    const credentialId = Buffer.from(credential.id).toString('base64url')
    const publicKey = Buffer.from(credential.publicKey).toString('base64url')

    const newPasskey: StoredPasskey = {
      credentialId,
      publicKey,
      counter: credential.counter,
      aaguid,
      label: label ?? `Passkey ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      transports: (credential.transports ?? []) as string[],
    }

    const { userSecurity } = await SecurityService.getUserSecurity(user.userId)

    await SecurityService.updateUserSecurity(user.userId, {
      passkeyEnabled: true,
      passkeys: [...userSecurity.passkeys, newPasskey],
    })

    await redis.del(PASSKEY_REG_CHALLENGE_KEY(user.userId))

    return { credentialId }
  }

  // ── Authentication ────────────────────────────────────────────────────────

  /**
   * Generates PublicKeyCredentialRequestOptions.
   * - If `email` is supplied the options are scoped to that user's credentials.
   * - Otherwise a discoverable-credential (resident key) flow is used.
   *   In that case the challenge is stored under the email Redis key.
   */
  static async generateAuthenticationOptions(email?: string): Promise<Record<string, unknown>> {
    let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] = []
    let cacheKey: string

    if (email) {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
      if (!user) throw new Error(AuthMessages.USER_NOT_FOUND)

      const { userSecurity } = await SecurityService.getUserSecurity(user.userId)

      if (!userSecurity.passkeyEnabled || userSecurity.passkeys.length === 0) {
        throw new Error(AuthMessages.PASSKEY_NOT_REGISTERED)
      }

      allowCredentials = userSecurity.passkeys.map((pk) => ({
        id: pk.credentialId,
        transports: (pk.transports ?? []) as AuthenticatorTransportFuture[],
      }))

      cacheKey = PASSKEY_AUTH_CHALLENGE_KEY(user.userId)
    } else {
      // Resident-key / discoverable flow — challenge stored temporarily
      cacheKey = PASSKEY_EMAIL_CHALLENGE_KEY('_resident_')
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
      allowCredentials,
    })

    await redis.set(cacheKey, options.challenge, 'EX', PASSKEY_CHALLENGE_TTL_SECONDS)

    return options as unknown as Record<string, unknown>
  }

  /**
   * Verifies the AuthenticationResponseJSON and, if valid, creates a new
   * session for the matched user. Returns the user so the route handler can
   * build the session cookie (mirrors the SSO/OTP pattern).
   */
  static async verifyAuthentication({
    response,
    email,
  }: {
    response: AuthenticationResponseJSON
    email?: string
  }): Promise<SafeUser> {
    // Find which user owns this credential
    let matchedUser = await prisma.user.findFirst({
      where: {
        userSecurity: {
          path: ['passkeys'],
          array_contains: [{ credentialId: response.id }],
        },
      },
    })

    if (!matchedUser && email) {
      matchedUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    }

    if (!matchedUser) throw new Error(AuthMessages.USER_NOT_FOUND)

    const { userSecurity } = await SecurityService.getUserSecurity(matchedUser.userId)

    const storedPasskey = userSecurity.passkeys.find((pk) => pk.credentialId === response.id)
    if (!storedPasskey) throw new Error(AuthMessages.PASSKEY_NOT_REGISTERED)

    const cacheKey = PASSKEY_AUTH_CHALLENGE_KEY(matchedUser.userId)
    const challenge = await redis.get(cacheKey)
    if (!challenge) throw new Error(AuthMessages.PASSKEY_CHALLENGE_EXPIRED)

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: storedPasskey.credentialId,
        publicKey: Buffer.from(storedPasskey.publicKey, 'base64url'),
        counter: storedPasskey.counter,
        transports: (storedPasskey.transports ?? []) as AuthenticatorTransportFuture[],
      },
      requireUserVerification: false,
    })

    if (!verification.verified) throw new Error(AuthMessages.PASSKEY_AUTHENTICATION_FAILED)

    // Update counter and lastUsedAt
    const updatedPasskeys = userSecurity.passkeys.map((pk) =>
      pk.credentialId === storedPasskey.credentialId
        ? {
            ...pk,
            counter: verification.authenticationInfo.newCounter,
            lastUsedAt: new Date().toISOString(),
          }
        : pk
    )

    await SecurityService.updateUserSecurity(matchedUser.userId, { passkeys: updatedPasskeys })
    await redis.del(cacheKey)

    const { SafeUserSchema } = await import('@/types/user/UserTypes')
    return SafeUserSchema.parse(matchedUser)
  }

  // ── Management ────────────────────────────────────────────────────────────

  /** Remove a single passkey credential from the user's security record. */
  static async deletePasskey(user: SafeUser, credentialId: string): Promise<void> {
    const { userSecurity } = await SecurityService.getUserSecurity(user.userId)

    const exists = userSecurity.passkeys.some((pk) => pk.credentialId === credentialId)
    if (!exists) throw new Error(AuthMessages.PASSKEY_NOT_FOUND)

    const remaining = userSecurity.passkeys.filter((pk) => pk.credentialId !== credentialId)

    await SecurityService.updateUserSecurity(user.userId, {
      passkeys: remaining,
      passkeyEnabled: remaining.length > 0,
    })
  }

  /** List all passkeys for the user (public info only — no raw keys). */
  static async listPasskeys(
    userId: string
  ): Promise<{ credentialId: string; label?: string; createdAt: string; lastUsedAt?: string | null; transports?: string[] }[]> {
    const { userSecurity } = await SecurityService.getUserSecurity(userId)

    return userSecurity.passkeys.map(({ credentialId, label, createdAt, lastUsedAt, transports }) => ({
      credentialId,
      label,
      createdAt,
      lastUsedAt,
      transports,
    }))
  }
}
