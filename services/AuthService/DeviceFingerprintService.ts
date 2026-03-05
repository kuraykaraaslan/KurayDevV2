import crypto from 'crypto'

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
}
