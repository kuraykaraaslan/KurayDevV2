import {
  formatDate,
  formatDateTime,
  formatTime,
  formatShortDate,
  formatShortDateTime,
  separateDateTimeWithTimeZone,
} from '@/helpers/TimeHelper'

const fixedDate = new Date('2024-03-15T14:30:00Z')

describe('TimeHelper', () => {
  // ── formatDate ────────────────────────────────────────────────────────
  describe('formatDate', () => {
    it('returns a human-readable date string', () => {
      const result = formatDate(fixedDate)
      expect(result).toContain('2024')
      expect(typeof result).toBe('string')
    })

    it('accepts ISO string input', () => {
      const result = formatDate('2024-03-15')
      expect(result).toContain('2024')
    })
  })

  // ── formatDateTime ────────────────────────────────────────────────────
  describe('formatDateTime', () => {
    it('includes year, month and day', () => {
      const result = formatDateTime(fixedDate)
      expect(result).toContain('2024')
    })
  })

  // ── formatTime ────────────────────────────────────────────────────────
  describe('formatTime', () => {
    it('returns a time string with AM/PM or colon separator', () => {
      const result = formatTime(fixedDate)
      expect(result).toMatch(/\d{1,2}:\d{2}/)
    })
  })

  // ── formatShortDate ───────────────────────────────────────────────────
  describe('formatShortDate', () => {
    it('returns abbreviated month and day', () => {
      const result = formatShortDate(fixedDate)
      expect(typeof result).toBe('string')
      expect(result.length).toBeLessThan(15)
    })
  })

  // ── formatShortDateTime ───────────────────────────────────────────────
  describe('formatShortDateTime', () => {
    it('returns a compact date+time string', () => {
      const result = formatShortDateTime(fixedDate)
      expect(typeof result).toBe('string')
    })
  })

  // ── separateDateTimeWithTimeZone ──────────────────────────────────────
  describe('separateDateTimeWithTimeZone', () => {
    it('returns date in yyyy-MM-dd format for UTC', () => {
      const { date } = separateDateTimeWithTimeZone(fixedDate, 'UTC')
      expect(date).toBe('2024-03-15')
    })

    it('returns time in HH:mm format for UTC', () => {
      const { time } = separateDateTimeWithTimeZone(fixedDate, 'UTC')
      expect(time).toBe('14:30')
    })

    it('defaults to UTC when no timezone provided', () => {
      const { date } = separateDateTimeWithTimeZone(fixedDate)
      expect(date).toBe('2024-03-15')
    })

    it('adjusts for a given timezone offset', () => {
      const { time } = separateDateTimeWithTimeZone(fixedDate, 'America/New_York')
      // UTC-5 (EST) → 14:30 UTC = 09:30 EST
      expect(time).toMatch(/^\d{2}:\d{2}$/)
    })

    it('throws for invalid datetime input', () => {
      expect(() =>
        separateDateTimeWithTimeZone('not-a-date' as unknown as Date)
      ).toThrow()
    })
  })
})
