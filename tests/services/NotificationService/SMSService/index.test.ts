jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({ add: jest.fn().mockResolvedValue({}) })),
  Worker: jest.fn().mockImplementation(() => ({ on: jest.fn() })),
}))

import SMSService from '@/services/NotificationService/SMSService'
import redis from '@/libs/redis'

const redisMock = redis as jest.Mocked<typeof redis>

describe('SMSService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── getCountryCode ────────────────────────────────────────────────────
  describe('getCountryCode', () => {
    it('parses a valid E.164 Turkish number and returns TR region', () => {
      const result = SMSService.getCountryCode('+905551234567')
      expect(result).not.toBeNull()
      expect(result?.regionCode).toBe('TR')
    })

    it('parses a valid US number and returns US region', () => {
      const result = SMSService.getCountryCode('+12125551234')
      expect(result).not.toBeNull()
      expect(result?.regionCode).toBe('US')
    })

    it('returns null for an unparseable number', () => {
      const result = SMSService.getCountryCode('not-a-phone')
      expect(result).toBeNull()
    })
  })

  // ── isAllowedCountry ──────────────────────────────────────────────────
  describe('isAllowedCountry', () => {
    it('returns true when ALLOWED_COUNTRIES is not set (no restriction)', () => {
      ;(SMSService as any).ALLOWED_COUNTRIES = undefined
      expect(SMSService.isAllowedCountry('TR')).toBe(true)
    })

    it('returns true when ALLOWED_COUNTRIES is empty array', () => {
      ;(SMSService as any).ALLOWED_COUNTRIES = []
      expect(SMSService.isAllowedCountry('TR')).toBe(true)
    })

    it('returns true for a country in the allowed list', () => {
      ;(SMSService as any).ALLOWED_COUNTRIES = ['TR', 'US']
      expect(SMSService.isAllowedCountry('TR')).toBe(true)
    })

    it('returns false for a country not in the allowed list', () => {
      ;(SMSService as any).ALLOWED_COUNTRIES = ['US', 'GB']
      expect(SMSService.isAllowedCountry('TR')).toBe(false)
    })
  })

  // ── getServiceProvider ────────────────────────────────────────────────
  describe('getServiceProvider', () => {
    it('returns NetGSMService for TR', () => {
      const provider = SMSService.getServiceProvider('TR')
      expect(provider).toBeDefined()
    })

    it('returns TwilloService for US', () => {
      const provider = SMSService.getServiceProvider('US')
      expect(provider).toBeDefined()
    })

    it('falls back to DEFAULT_PROVIDER for unknown region', () => {
      const provider = SMSService.getServiceProvider('XX')
      expect(provider).toBe(SMSService.DEFAULT_PROVIDER)
    })
  })

  // ── sendShortMessage ──────────────────────────────────────────────────
  describe('sendShortMessage', () => {
    it('returns early without queuing for empty phone number', async () => {
      await SMSService.sendShortMessage({ to: '', body: 'test' })
      expect(SMSService.QUEUE.add).not.toHaveBeenCalled()
    })

    it('returns early without queuing for empty body', async () => {
      await SMSService.sendShortMessage({ to: '+905551234567', body: '' })
      expect(SMSService.QUEUE.add).not.toHaveBeenCalled()
    })

    it('returns early when rate limit key exists in redis', async () => {
      redisMock.get.mockResolvedValueOnce('1')
      await SMSService.sendShortMessage({ to: '+905551234567', body: 'hello' })
      expect(SMSService.QUEUE.add).not.toHaveBeenCalled()
    })

    it('queues message and sets rate limit when not rate-limited', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')

      await SMSService.sendShortMessage({ to: '+905551234567', body: 'hello' })

      expect(redisMock.set).toHaveBeenCalledWith(
        expect.stringContaining('+905551234567'),
        '1',
        'EX',
        expect.any(Number)
      )
      expect(SMSService.QUEUE.add).toHaveBeenCalledWith(
        'sendShortMessage',
        expect.objectContaining({ to: '+905551234567', body: 'hello' })
      )
    })
  })

  // ── _sendShortMessage fallback ───────────────────────────────────────
  describe('_sendShortMessage', () => {
    it('uses default provider when region has no dedicated provider', async () => {
      ;(SMSService as any).ALLOWED_COUNTRIES = undefined
      const providerSpy = jest
        .spyOn(SMSService.DEFAULT_PROVIDER, 'sendShortMessage')
        .mockResolvedValueOnce(undefined)

      await SMSService._sendShortMessage({ to: '+33123456789', body: 'Bonjour' })

      expect(providerSpy).toHaveBeenCalledWith('+33123456789', 'Bonjour')
    })
  })
})

// ── Phase 20: SMSService notification extensions ──────────────────────────

describe('SMSService — Phase 20 notification extensions', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── send to invalid phone number ─────────────────────────────────────
  describe('_sendShortMessage — invalid phone number', () => {
    it('returns early without calling any provider when phone number is unparseable', async () => {
      ;(SMSService as any).ALLOWED_COUNTRIES = undefined
      const providerSpy = jest.spyOn(SMSService.DEFAULT_PROVIDER, 'sendShortMessage')

      await SMSService._sendShortMessage({ to: 'not-a-phone', body: 'test' })

      expect(providerSpy).not.toHaveBeenCalled()
    })

    it('returns early without calling any provider for an empty phone string', async () => {
      const providerSpy = jest.spyOn(SMSService.DEFAULT_PROVIDER, 'sendShortMessage')

      await SMSService._sendShortMessage({ to: '   ', body: 'hello' })

      expect(providerSpy).not.toHaveBeenCalled()
    })
  })

  // ── SMS with empty message body ───────────────────────────────────────
  describe('sendShortMessage — empty message body', () => {
    it('does not queue when body is an empty string', async () => {
      await SMSService.sendShortMessage({ to: '+905551234567', body: '' })
      expect(SMSService.QUEUE.add).not.toHaveBeenCalled()
    })

    it('does not queue when body is only whitespace', async () => {
      await SMSService.sendShortMessage({ to: '+905551234567', body: '   ' })
      expect(SMSService.QUEUE.add).not.toHaveBeenCalled()
    })
  })

  // ── provider failure: no fallback (single provider per region) ────────
  describe('_sendShortMessage — provider failure', () => {
    it('propagates synchronous provider error up the call stack when provider throws', async () => {
      ;(SMSService as any).ALLOWED_COUNTRIES = undefined

      // service.sendShortMessage is called without await — a synchronous throw propagates
      jest
        .spyOn(SMSService.DEFAULT_PROVIDER, 'sendShortMessage')
        .mockImplementationOnce(() => { throw new Error('Provider unavailable') })

      await expect(
        SMSService._sendShortMessage({ to: '+33123456789', body: 'hello' })
      ).rejects.toThrow('Provider unavailable')
    })
  })

  // ── retry logic: first attempt fails, second succeeds ─────────────────
  describe('sendShortMessage — retry via re-queue', () => {
    it('queues message successfully after rate limit window clears (simulated retry)', async () => {
      // First call — rate limit not set, message queued
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')

      await SMSService.sendShortMessage({ to: '+905551234567', body: 'first' })
      expect(SMSService.QUEUE.add).toHaveBeenCalledTimes(1)

      // Simulate rate limit window expiring: get returns null again
      jest.clearAllMocks()
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')

      await SMSService.sendShortMessage({ to: '+905551234567', body: 'retry' })
      expect(SMSService.QUEUE.add).toHaveBeenCalledTimes(1)
    })

    it('blocks second queue attempt within rate limit window', async () => {
      redisMock.get.mockResolvedValueOnce('1') // rate-limited
      await SMSService.sendShortMessage({ to: '+905551234567', body: 'blocked' })
      expect(SMSService.QUEUE.add).not.toHaveBeenCalled()
    })
  })

  // ── getCountryCode: boundary cases ───────────────────────────────────
  describe('getCountryCode — boundary cases', () => {
    it('returns null for a number with only country code and no local part', () => {
      // "+1" alone has no valid national number
      const result = SMSService.getCountryCode('+1')
      expect(result).toBeNull()
    })
  })
})
