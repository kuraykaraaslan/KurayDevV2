import Validator from '@/helpers/Validater'

describe('Validator', () => {
  it('throws on invalid status', () => {
    expect(() => Validator.validateStatus('')).toThrow('INVALID_STATUS')
    expect(() => Validator.validateStatus('foo')).toThrow('INVALID_STATUS')
    expect(() => Validator.validateStatus('ACTIVE')).not.toThrow()
  })

  it('throws on invalid id', () => {
    expect(() => Validator.validateID('')).toThrow('INVALID_ID')
    expect(() => Validator.validateID('abc!')).toThrow('INVALID_ID')
    expect(() => Validator.validateID('abc_123')).not.toThrow()
  })

  it('throws on invalid email', () => {
    expect(() => Validator.validateEmail('not-an-email')).toThrow('INVALID_EMAIL')
    expect(() => Validator.validateEmail('test@example.com')).not.toThrow()
  })

  it('throws on invalid password', () => {
    expect(() => Validator.validatePassword('short')).toThrow('PASSWORD_TOO_SHORT')
    expect(() => Validator.validatePassword('Aa1@abcd')).not.toThrow()
  })

  it('throws on invalid domain', () => {
    expect(() => Validator.validateDomain('')).toThrow('INVALID_DOMAIN')
    expect(() => Validator.validateDomain('kuray.dev')).not.toThrow()
  })
})

// ── Phase 27: comprehensive edge-case coverage ────────────────────────────────

describe('Validator.validateStatus', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts all valid statuses', () => {
    for (const s of ['ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED']) {
      expect(() => Validator.validateStatus(s)).not.toThrow()
    }
  })

  it('rejects lowercase valid status word', () => {
    expect(() => Validator.validateStatus('active')).toThrow('INVALID_STATUS')
  })
})

describe('Validator.validateID', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts hyphens and underscores', () => {
    expect(() => Validator.validateID('some-valid_ID-123')).not.toThrow()
  })

  it('rejects spaces', () => {
    expect(() => Validator.validateID('has space')).toThrow('INVALID_ID')
  })

  it('rejects dots', () => {
    expect(() => Validator.validateID('has.dot')).toThrow('INVALID_ID')
  })
})

describe('Validator.validateEmail', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts subdomain email addresses', () => {
    expect(() => Validator.validateEmail('user@mail.example.org')).not.toThrow()
  })

  it('rejects email with missing domain', () => {
    expect(() => Validator.validateEmail('user@')).toThrow('INVALID_EMAIL')
  })

  it('rejects email with missing @', () => {
    expect(() => Validator.validateEmail('userexample.com')).toThrow('INVALID_EMAIL')
  })

  it('rejects empty string', () => {
    expect(() => Validator.validateEmail('')).toThrow('INVALID_EMAIL')
  })
})

describe('Validator.validatePassword', () => {
  beforeEach(() => jest.clearAllMocks())

  it('does not throw for null (allows empty for password reset)', () => {
    expect(() => Validator.validatePassword(null)).not.toThrow()
  })

  it('throws PASSWORD_TOO_LONG for 51-character password', () => {
    const long = 'Aa1@' + 'a'.repeat(47) // 51 chars total
    expect(() => Validator.validatePassword(long)).toThrow('PASSWORD_TOO_LONG')
  })

  it('throws INVALID_PASSWORD for password missing special character', () => {
    // Has upper, lower, digit but no special char
    expect(() => Validator.validatePassword('Abcdefg1')).toThrow('INVALID_PASSWORD')
  })

  it('throws INVALID_PASSWORD for password missing uppercase', () => {
    expect(() => Validator.validatePassword('abcdefg1@')).toThrow('INVALID_PASSWORD')
  })

  it('accepts valid Turkish character in password', () => {
    expect(() => Validator.validatePassword('Şifre123!')).not.toThrow()
  })
})

describe('Validator.validateDomain', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts domains with hyphens', () => {
    expect(() => Validator.validateDomain('my-domain.example.com')).not.toThrow()
  })

  it('rejects domain with protocol prefix', () => {
    expect(() => Validator.validateDomain('https://kuray.dev')).toThrow('INVALID_DOMAIN')
  })

  it('rejects domain with spaces', () => {
    expect(() => Validator.validateDomain('my domain.com')).toThrow('INVALID_DOMAIN')
  })
})

describe('Validator.validateName', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts simple Latin name', () => {
    expect(() => Validator.validateName('John Doe')).not.toThrow()
  })

  it('accepts Turkish characters in name', () => {
    expect(() => Validator.validateName('Çağrı Güneş')).not.toThrow()
  })

  it('throws for empty name', () => {
    expect(() => Validator.validateName('')).toThrow('INVALID_NAME')
  })

  it('throws for name containing digits', () => {
    expect(() => Validator.validateName('John123')).toThrow('INVALID_NAME')
  })
})

describe('Validator.validateRole', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts USER', () => {
    expect(() => Validator.validateRole('USER')).not.toThrow()
  })

  it('accepts AUTHOR', () => {
    expect(() => Validator.validateRole('AUTHOR')).not.toThrow()
  })

  it('accepts ADMIN', () => {
    expect(() => Validator.validateRole('ADMIN')).not.toThrow()
  })

  it('rejects SUPER_ADMIN (not in Validator role list)', () => {
    expect(() => Validator.validateRole('SUPER_ADMIN')).toThrow('INVALID_ROLE')
  })

  it('rejects empty string', () => {
    expect(() => Validator.validateRole('')).toThrow('INVALID_ROLE')
  })
})

describe('Validator.validateSixDigitCode', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts a valid 6-digit code', () => {
    expect(() => Validator.validateSixDigitCode('123456')).not.toThrow()
  })

  it('throws for 5-digit code', () => {
    expect(() => Validator.validateSixDigitCode('12345')).toThrow('INVALID_CODE')
  })

  it('throws for 7-digit code', () => {
    expect(() => Validator.validateSixDigitCode('1234567')).toThrow('INVALID_CODE')
  })

  it('throws for code with letters', () => {
    expect(() => Validator.validateSixDigitCode('12345a')).toThrow('INVALID_CODE')
  })

  it('throws for empty string', () => {
    expect(() => Validator.validateSixDigitCode('')).toThrow('INVALID_CODE')
  })
})

describe('Validator.validateURL', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts http URL', () => {
    expect(() => Validator.validateURL('http://example.com')).not.toThrow()
  })

  it('accepts https URL', () => {
    expect(() => Validator.validateURL('https://example.com/path?q=1')).not.toThrow()
  })

  it('throws for URL without protocol', () => {
    expect(() => Validator.validateURL('example.com')).toThrow('INVALID_URL')
  })

  it('throws for empty string when allowEmpty=false', () => {
    expect(() => Validator.validateURL('', false)).toThrow('INVALID_URL')
  })

  it('does not throw for undefined when allowEmpty=true', () => {
    expect(() => Validator.validateURL(undefined, true)).not.toThrow()
  })

  it('throws for null when allowEmpty=false', () => {
    expect(() => Validator.validateURL(null, false)).toThrow('INVALID_URL')
  })
})

describe('Validator.validateNaturalNumber', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts zero', () => {
    expect(() => Validator.validateNaturalNumber('0')).not.toThrow()
  })

  it('accepts positive integer string', () => {
    expect(() => Validator.validateNaturalNumber('42')).not.toThrow()
  })

  it('throws for negative number string', () => {
    expect(() => Validator.validateNaturalNumber('-1')).toThrow('INVALID_NUMBER')
  })

  it('throws for decimal number string', () => {
    expect(() => Validator.validateNaturalNumber('3.14')).toThrow('INVALID_NUMBER')
  })

  it('throws for non-numeric string', () => {
    expect(() => Validator.validateNaturalNumber('abc')).toThrow('INVALID_NUMBER')
  })
})
