import crypto from 'crypto'
import { ACCESS_TOKEN_SECRET } from './constants'

export default class DeviceFingerprintService {
  /**
   * Generates a device fingerprint based on the request headers.
   * @param request - The HTTP request object.
   * @returns A promise that resolves to the device fingerprint.
   */
  static async generateDeviceFingerprint(request: NextRequest): Promise<string> {
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('remote-addr') ||
      request.headers.get('x-client-ip') ||
      request.headers.get('x-cluster-client-ip') ||
      request.headers.get('x-original-forwarded-for') ||
      request.headers.get('forwarded-for') ||
      request.headers.get('forwarded')
    const userAgent = request.headers.get('user-agent') || ''
    const acceptLanguage = request.headers.get('accept-language') || ''

    const rawFingerprint = `${ip}|${userAgent}|${acceptLanguage}`
    return crypto.createHash('sha256').update(rawFingerprint).digest('hex')
  }

  /**
   * Generates a trusted device token for the given user + device fingerprint.
   * Uses HMAC-SHA256 so it is stateless and verifiable without DB.
   */
  static generateTrustedDeviceToken(userId: string, deviceFingerprint: string): string {
    return crypto
      .createHmac('sha256', ACCESS_TOKEN_SECRET as string)
      .update(`${userId}:${deviceFingerprint}`)
      .digest('hex')
  }

  /**
   * Checks whether a trusted device cookie value matches the current user + fingerprint.
   */
  static isTrustedDevice(
    userId: string,
    deviceFingerprint: string,
    cookieValue: string | undefined
  ): boolean {
    if (!cookieValue) return false
    const expected = DeviceFingerprintService.generateTrustedDeviceToken(userId, deviceFingerprint)
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(cookieValue, 'hex'))
  }
}
