jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    compare: jest.fn(),
  },
}))

import FieldValidater from '@/utils/FieldValidater'

describe('FieldValidater', () => {
  it('validates email', () => {
    expect(FieldValidater.isEmail('test@example.com')).toBe(true)
    expect(FieldValidater.isEmail('invalid')).toBe(false)
  })

  it('validates password', () => {
    expect(FieldValidater.isPassword('Aa1@abcd')).toBe(true)
    expect(FieldValidater.isPassword('short')).toBe(false)
  })

  it('sanitizes string', () => {
    expect(FieldValidater.sanitizeString('abc!@#')).toBe('abc')
    expect(FieldValidater.sanitizeString('')).toBeUndefined()
  })

  it('validates domain', () => {
    expect(FieldValidater.isDomain('kuray.dev')).toBe(true)
    expect(FieldValidater.isDomain('http://kuray.dev')).toBe(false)
  })

  it('validates boolean', () => {
    expect(FieldValidater.isBoolean(true)).toBe(true)
    expect(FieldValidater.isBoolean(undefined)).toBe(false)
  })
})

// ── Phase 27 boundary / edge-case additions ───────────────────────────────────

describe('FieldValidater.isEmail – boundary cases', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns true for a valid subdomain email', () => {
    expect(FieldValidater.isEmail('user@mail.sub.example.co.uk')).toBe(true)
  })

  it('returns false for email missing TLD', () => {
    expect(FieldValidater.isEmail('user@nodot')).toBe(false)
  })

  it('returns false for email with single-char TLD', () => {
    expect(FieldValidater.isEmail('user@example.c')).toBe(false)
  })

  it('returns true for a 2-char TLD', () => {
    expect(FieldValidater.isEmail('user@example.de')).toBe(true)
  })

  it('returns false for null', () => {
    expect(FieldValidater.isEmail(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(FieldValidater.isEmail(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(FieldValidater.isEmail('')).toBe(false)
  })

  it('returns false for email with spaces', () => {
    expect(FieldValidater.isEmail('user name@example.com')).toBe(false)
  })

  it('returns false for email with double @', () => {
    expect(FieldValidater.isEmail('user@@example.com')).toBe(false)
  })
})

describe('FieldValidater.isPhone – international format edge cases', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns true for a valid E.164 number', () => {
    expect(FieldValidater.isPhone('+905551234567')).toBe(true)
  })

  it('returns true for a UK number', () => {
    expect(FieldValidater.isPhone('+447911123456')).toBe(true)
  })

  it('returns false for number without leading +', () => {
    expect(FieldValidater.isPhone('905551234567')).toBe(false)
  })

  it('returns false for number with letters', () => {
    expect(FieldValidater.isPhone('+90abc1234567')).toBe(false)
  })

  it('returns false for null', () => {
    expect(FieldValidater.isPhone(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(FieldValidater.isPhone(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(FieldValidater.isPhone('')).toBe(false)
  })

  it('returns false for + alone', () => {
    // The regex requires at least one digit after +
    expect(FieldValidater.isPhone('+')).toBe(false)
  })
})

describe('FieldValidater.sanitizeString – boundary values', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns undefined for null', () => {
    expect(FieldValidater.sanitizeString(null)).toBeUndefined()
  })

  it('returns undefined for undefined', () => {
    expect(FieldValidater.sanitizeString(undefined)).toBeUndefined()
  })

  it('strips all special characters leaving only alphanumeric, - and _', () => {
    expect(FieldValidater.sanitizeString('hello world! @2024')).toBe('helloworld2024')
  })

  it('preserves hyphens and underscores', () => {
    expect(FieldValidater.sanitizeString('my-slug_123')).toBe('my-slug_123')
  })

  it('returns empty string for input of only special chars (non-empty source)', () => {
    // sanitizeString returns empty string '' rather than undefined for strings
    // that become empty after stripping — the implementation returns the stripped value
    const result = FieldValidater.sanitizeString('!!!###$$$')
    expect(result).toBe('')
  })
})

describe('FieldValidater.isBoolean – boundary values', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns true for false (boolean)', () => {
    expect(FieldValidater.isBoolean(false)).toBe(true)
  })

  it('returns false for null', () => {
    expect(FieldValidater.isBoolean(null)).toBe(false)
  })
})

describe('FieldValidater.isVerificationToken', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns true for a 6-digit token', () => {
    expect(FieldValidater.isVerificationToken('123456')).toBe(true)
  })

  it('returns false for a 5-digit token', () => {
    expect(FieldValidater.isVerificationToken('12345')).toBe(false)
  })

  it('returns false for a 7-digit token', () => {
    expect(FieldValidater.isVerificationToken('1234567')).toBe(false)
  })

  it('returns false for token with letters', () => {
    expect(FieldValidater.isVerificationToken('12345a')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(FieldValidater.isVerificationToken('')).toBe(false)
  })
})

describe('FieldValidater.isRole', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns true for USER', () => {
    expect(FieldValidater.isRole('USER')).toBe(true)
  })

  it('returns true for ADMIN', () => {
    expect(FieldValidater.isRole('ADMIN')).toBe(true)
  })

  it('returns true for SUPER_ADMIN', () => {
    expect(FieldValidater.isRole('SUPER_ADMIN')).toBe(true)
  })

  it('returns false for lowercase role', () => {
    expect(FieldValidater.isRole('admin')).toBe(false)
  })

  it('returns false for unknown role', () => {
    expect(FieldValidater.isRole('OWNER')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(FieldValidater.isRole('')).toBe(false)
  })
})

describe('FieldValidater.isCUID', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns true for a 25-char string', () => {
    expect(FieldValidater.isCUID('c'.repeat(25))).toBe(true)
  })

  it('returns false for a 24-char string', () => {
    expect(FieldValidater.isCUID('c'.repeat(24))).toBe(false)
  })

  it('returns false for a 26-char string', () => {
    expect(FieldValidater.isCUID('c'.repeat(26))).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(FieldValidater.isCUID('')).toBe(false)
  })

  it('returns false for null', () => {
    expect(FieldValidater.isCUID(null)).toBe(false)
  })
})

describe('FieldValidater.validateWithRegex', () => {
  it('returns false for null/undefined/empty values', () => {
    expect(FieldValidater.validateWithRegex(null, /a/)).toBe(false)
    expect(FieldValidater.validateWithRegex(undefined, /a/)).toBe(false)
    expect(FieldValidater.validateWithRegex('', /a/)).toBe(false)
  })

  it('validates using the provided regex', () => {
    expect(FieldValidater.validateWithRegex('abc', /^a/)).toBe(true)
    expect(FieldValidater.validateWithRegex('xbc', /^a/)).toBe(false)
  })
})

describe('FieldValidater.comparePasswords', () => {
  const bcrypt = require('bcrypt').default

  beforeEach(() => jest.clearAllMocks())

  it('delegates to bcrypt.compare and returns its result', async () => {
    bcrypt.compare.mockResolvedValueOnce(true)

    const ok = await FieldValidater.comparePasswords('hashed', 'plain')
    expect(ok).toBe(true)
    expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hashed')
  })
})

describe('FieldValidater.validateBody', () => {
  class Model {
    name: string = ''
    age: string | undefined = undefined
  }

  it('returns false when required fields are missing', () => {
    expect(FieldValidater.validateBody({ name: 'x' }, Model)).toBe(false)
  })

  it('returns false when body has extra fields', () => {
    expect(FieldValidater.validateBody({ name: 'x', age: '1', extra: 'nope' }, Model)).toBe(false)
  })

  it('returns true when body matches model keys', () => {
    expect(FieldValidater.validateBody({ name: 'x', age: '1' }, Model)).toBe(true)
  })
})

describe('FieldValidater misc validators', () => {
  it('validates tenant roles/status and name/number', () => {
    expect(FieldValidater.isTenantUserRole('ADMIN')).toBe(true)
    expect(FieldValidater.isTenantUserRole('OWNER')).toBe(false)

    expect(FieldValidater.isTenantUserStatus('ACTIVE')).toBe(true)
    expect(FieldValidater.isTenantUserStatus('DISABLED')).toBe(false)

    expect(FieldValidater.isTenantStatus('INACTIVE')).toBe(true)
    expect(FieldValidater.isTenantStatus('PENDING')).toBe(false)

    expect(FieldValidater.isName('kuray')).toBe(false)
    expect(FieldValidater.isName('kuray.dev')).toBe(true)

    expect(FieldValidater.isNumber('123')).toBe(true)
    expect(FieldValidater.isNumber('12a')).toBe(false)
  })
})
