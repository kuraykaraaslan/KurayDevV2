import DeviceFingerprintService from '@/services/AuthService/DeviceFingerprintService'

function makeRequest(headers: Record<string, string | null>): NextRequest {
  return {
    headers: {
      get: (name: string) => headers[name] ?? null,
    },
  } as unknown as NextRequest
}

describe('DeviceFingerprintService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── generateDeviceFingerprint ────────────────────────────────────────
  describe('generateDeviceFingerprint', () => {
    it('returns a 64-char hex SHA-256 string', async () => {
      const req = makeRequest({
        'x-forwarded-for': '1.2.3.4',
        'user-agent': 'Mozilla/5.0',
        'accept-language': 'en-US',
      })
      const fp = await DeviceFingerprintService.generateDeviceFingerprint(req)
      expect(fp).toMatch(/^[a-f0-9]{64}$/)
    })

    it('is deterministic — same headers produce same fingerprint', async () => {
      const req1 = makeRequest({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'UA', 'accept-language': 'en' })
      const req2 = makeRequest({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'UA', 'accept-language': 'en' })
      const fp1 = await DeviceFingerprintService.generateDeviceFingerprint(req1)
      const fp2 = await DeviceFingerprintService.generateDeviceFingerprint(req2)
      expect(fp1).toBe(fp2)
    })

    it('different IP → different fingerprint', async () => {
      const req1 = makeRequest({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'UA', 'accept-language': 'en' })
      const req2 = makeRequest({ 'x-forwarded-for': '9.9.9.9', 'user-agent': 'UA', 'accept-language': 'en' })
      const fp1 = await DeviceFingerprintService.generateDeviceFingerprint(req1)
      const fp2 = await DeviceFingerprintService.generateDeviceFingerprint(req2)
      expect(fp1).not.toBe(fp2)
    })

    it('different User-Agent → different fingerprint', async () => {
      const req1 = makeRequest({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'Chrome', 'accept-language': 'en' })
      const req2 = makeRequest({ 'x-forwarded-for': '1.2.3.4', 'user-agent': 'Firefox', 'accept-language': 'en' })
      const fp1 = await DeviceFingerprintService.generateDeviceFingerprint(req1)
      const fp2 = await DeviceFingerprintService.generateDeviceFingerprint(req2)
      expect(fp1).not.toBe(fp2)
    })

    it('falls back gracefully when headers are missing (no throw)', async () => {
      const req = makeRequest({})
      await expect(DeviceFingerprintService.generateDeviceFingerprint(req)).resolves.toMatch(
        /^[a-f0-9]{64}$/
      )
    })

    it('uses x-real-ip as fallback when x-forwarded-for is missing', async () => {
      const req1 = makeRequest({ 'x-real-ip': '5.5.5.5', 'user-agent': 'UA', 'accept-language': 'en' })
      const req2 = makeRequest({ 'x-real-ip': '5.5.5.5', 'user-agent': 'UA', 'accept-language': 'en' })
      const fp1 = await DeviceFingerprintService.generateDeviceFingerprint(req1)
      const fp2 = await DeviceFingerprintService.generateDeviceFingerprint(req2)
      expect(fp1).toBe(fp2)
    })
  })

  // ── generateTrustedDeviceToken ───────────────────────────────────────
  describe('generateTrustedDeviceToken', () => {
    it('returns a 64-char hex string', () => {
      const token = DeviceFingerprintService.generateTrustedDeviceToken('user-1', 'fp-abc')
      expect(token).toMatch(/^[a-f0-9]{64}$/)
    })

    it('is deterministic for same inputs', () => {
      const t1 = DeviceFingerprintService.generateTrustedDeviceToken('user-1', 'fp-abc')
      const t2 = DeviceFingerprintService.generateTrustedDeviceToken('user-1', 'fp-abc')
      expect(t1).toBe(t2)
    })

    it('differs for different userId', () => {
      const t1 = DeviceFingerprintService.generateTrustedDeviceToken('user-1', 'fp-abc')
      const t2 = DeviceFingerprintService.generateTrustedDeviceToken('user-2', 'fp-abc')
      expect(t1).not.toBe(t2)
    })

    it('differs for different fingerprint', () => {
      const t1 = DeviceFingerprintService.generateTrustedDeviceToken('user-1', 'fp-abc')
      const t2 = DeviceFingerprintService.generateTrustedDeviceToken('user-1', 'fp-xyz')
      expect(t1).not.toBe(t2)
    })
  })

  // ── isTrustedDevice ──────────────────────────────────────────────────
  describe('isTrustedDevice', () => {
    it('returns true when cookie matches expected HMAC', () => {
      const userId = 'user-1'
      const fp = 'fp-abc'
      const validToken = DeviceFingerprintService.generateTrustedDeviceToken(userId, fp)
      expect(DeviceFingerprintService.isTrustedDevice(userId, fp, validToken)).toBe(true)
    })

    it('returns false when cookie is undefined', () => {
      expect(DeviceFingerprintService.isTrustedDevice('user-1', 'fp', undefined)).toBe(false)
    })

    it('returns false when cookie is wrong', () => {
      const wrong = 'a'.repeat(64)
      expect(DeviceFingerprintService.isTrustedDevice('user-1', 'fp', wrong)).toBe(false)
    })

    it('returns false when userId mismatches', () => {
      const fp = 'fp-abc'
      const token = DeviceFingerprintService.generateTrustedDeviceToken('user-1', fp)
      expect(DeviceFingerprintService.isTrustedDevice('user-2', fp, token)).toBe(false)
    })
  })
})
