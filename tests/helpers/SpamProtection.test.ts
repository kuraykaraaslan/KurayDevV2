import {
  isHoneypotFilled,
  isSubmittedTooQuickly,
  hasSpamPatterns,
  checkForSpam,
  MIN_FORM_FILL_TIME_MS,
  HONEYPOT_FIELD_NAME,
} from '@/helpers/SpamProtection'

describe('SpamProtection', () => {
  // ── constants ─────────────────────────────────────────────────────────
  it('exports HONEYPOT_FIELD_NAME as "website"', () => {
    expect(HONEYPOT_FIELD_NAME).toBe('website')
  })

  it('MIN_FORM_FILL_TIME_MS is at least 1000ms', () => {
    expect(MIN_FORM_FILL_TIME_MS).toBeGreaterThanOrEqual(1000)
  })

  // ── isHoneypotFilled ──────────────────────────────────────────────────
  describe('isHoneypotFilled', () => {
    it('returns false for empty string', () => {
      expect(isHoneypotFilled('')).toBe(false)
    })

    it('returns false for null/undefined', () => {
      expect(isHoneypotFilled(null)).toBe(false)
      expect(isHoneypotFilled(undefined)).toBe(false)
    })

    it('returns true when honeypot has content', () => {
      expect(isHoneypotFilled('http://spam.com')).toBe(true)
    })

    it('returns false for whitespace-only value', () => {
      expect(isHoneypotFilled('   ')).toBe(false)
    })
  })

  // ── isSubmittedTooQuickly ─────────────────────────────────────────────
  describe('isSubmittedTooQuickly', () => {
    it('returns false when no formLoadTime provided', () => {
      expect(isSubmittedTooQuickly(undefined)).toBe(false)
    })

    it('returns true when submitted within MIN_FORM_FILL_TIME_MS', () => {
      const recentLoad = Date.now() - 500 // 0.5s ago
      expect(isSubmittedTooQuickly(recentLoad)).toBe(true)
    })

    it('returns false when enough time has passed', () => {
      const oldLoad = Date.now() - (MIN_FORM_FILL_TIME_MS + 1000)
      expect(isSubmittedTooQuickly(oldLoad)).toBe(false)
    })
  })

  // ── hasSpamPatterns ───────────────────────────────────────────────────
  describe('hasSpamPatterns', () => {
    it('returns false for clean message', () => {
      expect(hasSpamPatterns('Hello, I would like to discuss a project.')).toBe(false)
    })

    it('returns true for viagra-like pharmacy spam', () => {
      expect(hasSpamPatterns('Buy cheap viagra pills online')).toBe(true)
    })

    it('returns true for messages with 3+ URLs', () => {
      expect(hasSpamPatterns('http://a.com http://b.com http://c.com')).toBe(true)
    })

    it('returns true for messages with excessive repeated characters', () => {
      expect(hasSpamPatterns('aaaaaaaaaaaaa')).toBe(true)
    })

    it('returns false for a single URL', () => {
      expect(hasSpamPatterns('Check my portfolio at https://kuray.dev')).toBe(false)
    })
  })

  // ── checkForSpam ──────────────────────────────────────────────────────
  describe('checkForSpam', () => {
    it('returns isSpam=false for clean submission', () => {
      const result = checkForSpam({
        honeypot: '',
        formLoadTime: Date.now() - 10_000,
        message: 'Hello, I need help with my website.',
      })
      expect(result.isSpam).toBe(false)
    })

    it('returns isSpam=true with reason honeypot_filled', () => {
      const result = checkForSpam({ honeypot: 'bot-value', message: 'hello' })
      expect(result.isSpam).toBe(true)
      expect(result.reason).toBe('honeypot_filled')
    })

    it('returns isSpam=true with reason submitted_too_quickly', () => {
      const result = checkForSpam({
        honeypot: '',
        formLoadTime: Date.now() - 100,
        message: 'normal message',
      })
      expect(result.isSpam).toBe(true)
      expect(result.reason).toBe('submitted_too_quickly')
    })

    it('returns isSpam=true with reason spam_patterns_detected', () => {
      const result = checkForSpam({
        message: 'Buy cheap viagra pills online discount',
        formLoadTime: Date.now() - 10_000,
      })
      expect(result.isSpam).toBe(true)
      expect(result.reason).toBe('spam_patterns_detected')
    })
  })
})
