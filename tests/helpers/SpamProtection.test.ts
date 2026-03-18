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

// ── Phase 27 boundary / edge-case additions ───────────────────────────────────

describe('SpamProtection – Phase 27 edge cases', () => {
  // ── hasSpamPatterns: threshold boundary ───────────────────────────────
  describe('hasSpamPatterns – threshold boundary', () => {
    it('returns false for 10 repeated characters (just under threshold)', () => {
      // Pattern requires 11+ repetitions (/(.)\1{10,}/ matches 11+ of same char)
      expect(hasSpamPatterns('aaaaaaaaaa')).toBe(false)
    })

    it('returns true for exactly 11 repeated characters (at threshold)', () => {
      expect(hasSpamPatterns('aaaaaaaaaaa')).toBe(true)
    })

    it('returns true for 20 repeated characters (above threshold)', () => {
      expect(hasSpamPatterns('aaaaaaaaaaaaaaaaaaaa')).toBe(true)
    })
  })

  // ── hasSpamPatterns: repeated character spam ──────────────────────────
  describe('hasSpamPatterns – repeated characters', () => {
    it('detects repeated-digit spam', () => {
      expect(hasSpamPatterns('11111111111')).toBe(true)
    })

    it('detects repeated special-character spam', () => {
      expect(hasSpamPatterns('!!!!!!!!!!!!')).toBe(true)
    })

    it('does not flag a word with no repetition', () => {
      expect(hasSpamPatterns('abcdefghij')).toBe(false)
    })
  })

  // ── hasSpamPatterns: empty content ────────────────────────────────────
  describe('hasSpamPatterns – empty and minimal content', () => {
    it('returns false for empty string', () => {
      expect(hasSpamPatterns('')).toBe(false)
    })

    it('returns false for a single character', () => {
      expect(hasSpamPatterns('a')).toBe(false)
    })

    it('returns false for whitespace-only string', () => {
      expect(hasSpamPatterns('   ')).toBe(false)
    })
  })

  // ── hasSpamPatterns: exactly 2 URLs ───────────────────────────────────
  describe('hasSpamPatterns – URL count boundary', () => {
    it('returns false for exactly 2 URLs', () => {
      expect(hasSpamPatterns('See http://a.com and http://b.com for details')).toBe(false)
    })

    it('returns true for exactly 3 URLs', () => {
      expect(hasSpamPatterns('http://a.com http://b.com http://c.com')).toBe(true)
    })
  })

  // ── isHoneypotFilled: single-space boundary ───────────────────────────
  describe('isHoneypotFilled – whitespace boundary', () => {
    it('returns false for a single space', () => {
      expect(isHoneypotFilled(' ')).toBe(false)
    })

    it('returns false for tab character only', () => {
      expect(isHoneypotFilled('\t')).toBe(false)
    })

    it('returns true for value containing at least one non-whitespace character', () => {
      expect(isHoneypotFilled(' x ')).toBe(true)
    })
  })

  // ── isSubmittedTooQuickly: boundary around MIN_FORM_FILL_TIME_MS ──────
  describe('isSubmittedTooQuickly – exact boundary', () => {
    it('returns false when time taken equals MIN_FORM_FILL_TIME_MS exactly', () => {
      // Date.now() - (Date.now() - MIN_FORM_FILL_TIME_MS) === MIN_FORM_FILL_TIME_MS
      // which is NOT < MIN_FORM_FILL_TIME_MS → should return false
      const exactBoundary = Date.now() - MIN_FORM_FILL_TIME_MS
      expect(isSubmittedTooQuickly(exactBoundary)).toBe(false)
    })

    it('returns true when one millisecond under the limit', () => {
      const oneUnder = Date.now() - (MIN_FORM_FILL_TIME_MS - 1)
      expect(isSubmittedTooQuickly(oneUnder)).toBe(true)
    })
  })

  // ── checkForSpam: empty message ───────────────────────────────────────
  describe('checkForSpam – empty message', () => {
    it('returns isSpam=false for an empty message (no patterns match)', () => {
      const result = checkForSpam({
        honeypot: '',
        formLoadTime: Date.now() - 10_000,
        message: '',
      })
      expect(result.isSpam).toBe(false)
    })
  })
})
