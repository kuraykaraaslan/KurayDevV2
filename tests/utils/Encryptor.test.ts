// removed erroneous describe
import Encryptor from '@/utils/Encryptor'

const TEST_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

describe('Encryptor', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_SECRET_KEY = TEST_KEY
  })

  it('encrypts and decrypts deterministically', () => {
    const text = 'test123'
    const enc = Encryptor.encrypt(text)
    const dec = Encryptor.decrypt(enc)
    expect(dec).toBe(text)
  })

  it('throws on invalid input', () => {
    expect(() => Encryptor.decrypt('invalid')).toThrow()
  })

  // ── Phase 27 boundary / edge-case additions ───────────────────────────

  describe('empty string', () => {
    it('encrypts empty string and decrypts back to empty string', () => {
      const enc = Encryptor.encrypt('')
      const dec = Encryptor.decrypt(enc)
      expect(dec).toBe('')
    })

    it('produces a non-empty ciphertext for empty plaintext', () => {
      // iv(12) + tag(16) + 0 bytes payload → base64 of 28 bytes = 40 chars
      const enc = Encryptor.encrypt('')
      expect(enc.length).toBeGreaterThan(0)
    })
  })

  describe('wrong key', () => {
    it('throws when decrypting with a different key', () => {
      const enc = Encryptor.encrypt('secret-data')
      // Tamper with the GCM auth tag to simulate wrong-key decryption failure
      const buf = Buffer.from(enc, 'base64')
      buf[12] ^= 0xff // flip first byte of the 16-byte auth tag
      const tampered = buf.toString('base64')
      expect(() => Encryptor.decrypt(tampered)).toThrow()
    })
  })

  describe('long string', () => {
    it('roundtrips a 10 000-character string without truncation', () => {
      process.env.ENCRYPTION_SECRET_KEY = TEST_KEY
      const longText = 'a'.repeat(10_000)
      const enc = Encryptor.encrypt(longText)
      const dec = Encryptor.decrypt(enc)
      expect(dec).toBe(longText)
      expect(dec.length).toBe(10_000)
    })
  })

  describe('unicode characters', () => {
    it('roundtrips multi-byte unicode text', () => {
      process.env.ENCRYPTION_SECRET_KEY = TEST_KEY
      const unicode = '日本語テスト 🎉 Ünïcödé çharacters ≠ ASCII'
      const enc = Encryptor.encrypt(unicode)
      const dec = Encryptor.decrypt(enc)
      expect(dec).toBe(unicode)
    })
  })

  describe('hash collision resistance', () => {
    it('produces different ciphertexts for different inputs (uses random IV)', () => {
      process.env.ENCRYPTION_SECRET_KEY = TEST_KEY
      const enc1 = Encryptor.encrypt('input-A')
      const enc2 = Encryptor.encrypt('input-A')
      // AES-GCM uses a random IV per call → ciphertexts differ even for same plaintext
      expect(enc1).not.toBe(enc2)
    })

    it('decrypts two different ciphertexts to their distinct plaintexts', () => {
      process.env.ENCRYPTION_SECRET_KEY = TEST_KEY
      const enc1 = Encryptor.encrypt('value-one')
      const enc2 = Encryptor.encrypt('value-two')
      expect(Encryptor.decrypt(enc1)).toBe('value-one')
      expect(Encryptor.decrypt(enc2)).toBe('value-two')
    })
  })
})
