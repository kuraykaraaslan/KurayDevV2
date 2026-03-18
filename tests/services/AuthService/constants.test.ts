/**
 * constants.test.ts
 *
 * Tests for throw guards in services/AuthService/constants.ts.
 * Each guard requires jest.isolateModules() so the module cache is reset
 * and the throw branch can be exercised with modified env vars.
 */

describe('AuthService constants — throw guards', () => {
  const ORIGINAL_ENV = { ...process.env }

  afterEach(() => {
    // Restore env after each test
    process.env = { ...ORIGINAL_ENV }
  })

  // ── Guard: missing JWT secrets ───────────────────────────────────────
  describe('Missing JWT secrets guard (line 10-12)', () => {
    it('throws when ACCESS_TOKEN_SECRET is absent', () => {
      expect(() => {
        jest.isolateModules(() => {
          delete process.env.ACCESS_TOKEN_SECRET
          // REFRESH_TOKEN_SECRET must be present so only the first guard fires
          process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret'
          require('@/services/AuthService/constants')
        })
      }).toThrow('Missing JWT secrets in environment variables.')
    })

    it('throws when REFRESH_TOKEN_SECRET is absent', () => {
      expect(() => {
        jest.isolateModules(() => {
          process.env.ACCESS_TOKEN_SECRET = 'test-access-secret'
          delete process.env.REFRESH_TOKEN_SECRET
          require('@/services/AuthService/constants')
        })
      }).toThrow('Missing JWT secrets in environment variables.')
    })

    it('throws when both JWT secrets are absent', () => {
      expect(() => {
        jest.isolateModules(() => {
          delete process.env.ACCESS_TOKEN_SECRET
          delete process.env.REFRESH_TOKEN_SECRET
          require('@/services/AuthService/constants')
        })
      }).toThrow('Missing JWT secrets in environment variables.')
    })

    it('does NOT throw when both JWT secrets are present', () => {
      expect(() => {
        jest.isolateModules(() => {
          process.env.ACCESS_TOKEN_SECRET = 'test-access-secret'
          process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret'
          require('@/services/AuthService/constants')
        })
      }).not.toThrow()
    })
  })

  // ── Guard: invalid SESSION_EXPIRY_MS ─────────────────────────────────
  describe('Invalid SESSION_EXPIRY_MS guard (line 21-23)', () => {
    it('throws when SESSION_EXPIRY_MS is not a valid number string', () => {
      expect(() => {
        jest.isolateModules(() => {
          process.env.ACCESS_TOKEN_SECRET = 'test-access-secret'
          process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret'
          process.env.SESSION_EXPIRY_MS = 'not-a-number'
          require('@/services/AuthService/constants')
        })
      }).toThrow('Invalid SESSION_EXPIRY_MS value in environment variables.')
    })

    it('does NOT throw when SESSION_EXPIRY_MS is a valid number string', () => {
      expect(() => {
        jest.isolateModules(() => {
          process.env.ACCESS_TOKEN_SECRET = 'test-access-secret'
          process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret'
          process.env.SESSION_EXPIRY_MS = '604800000'
          require('@/services/AuthService/constants')
        })
      }).not.toThrow()
    })
  })

  // ── Guard: invalid SESSION_REDIS_EXPIRY_MS ───────────────────────────
  describe('Invalid SESSION_REDIS_EXPIRY_MS guard (line 25-27)', () => {
    it('throws when SESSION_REDIS_EXPIRY_MS is not a valid number string', () => {
      expect(() => {
        jest.isolateModules(() => {
          process.env.ACCESS_TOKEN_SECRET = 'test-access-secret'
          process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret'
          process.env.SESSION_EXPIRY_MS = '604800000'
          process.env.SESSION_REDIS_EXPIRY_MS = 'bad-value'
          require('@/services/AuthService/constants')
        })
      }).toThrow('Invalid SESSION_REDIS_EXPIRY_MS value in environment variables.')
    })

    it('does NOT throw when SESSION_REDIS_EXPIRY_MS is a valid number string', () => {
      expect(() => {
        jest.isolateModules(() => {
          process.env.ACCESS_TOKEN_SECRET = 'test-access-secret'
          process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret'
          process.env.SESSION_EXPIRY_MS = '604800000'
          process.env.SESSION_REDIS_EXPIRY_MS = '1800000'
          require('@/services/AuthService/constants')
        })
      }).not.toThrow()
    })
  })
})
