import { createSign, generateKeyPairSync } from 'node:crypto'
import HttpSignatureService from '@/services/ActivityPubService/HttpSignatureService'
import ActorService from '@/services/ActivityPubService/ActorService'
import redis from '@/libs/redis'

const redisMock = redis as jest.Mocked<typeof redis>

// ── Shared RSA key pair (generated once for the entire suite) ─────────────────
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const publicKeyPem = publicKey.export({ type: 'pkcs1', format: 'pem' }).toString()
const privateKeyPem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString()

describe('HttpSignatureService', () => {
  const method = 'POST'
  const path = '/api/activitypub/inbox'

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(ActorService, 'fetchRemoteActor').mockResolvedValue({
      publicKey: { publicKeyPem },
    } as any)
  })

  const buildValidHeaders = (date: string = new Date().toUTCString()) => {
    const keyId = 'https://remote.example/users/alice#main-key'
    const host = 'localhost'
    const digest = 'SHA-256=ZmFrZQ=='
    const signingString = [
      `(request-target): ${method.toLowerCase()} ${path}`,
      `host: ${host}`,
      `date: ${date}`,
      `digest: ${digest}`,
    ].join('\n')

    const signer = createSign('RSA-SHA256')
    signer.update(signingString)
    const signature = signer.sign(privateKey, 'base64')

    return {
      signature: `keyId="${keyId}",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="${signature}"`,
      host,
      date,
      digest,
    }
  }

  // ── verifyHttpSignature ───────────────────────────────────────────────────

  it('returns false when Signature header is missing', async () => {
    const result = await HttpSignatureService.verifyHttpSignature(method, path, {
      host: 'localhost',
      date: new Date().toUTCString(),
    })

    expect(result).toBe(false)
  })

  it('returns false when required signed headers are missing', async () => {
    const result = await HttpSignatureService.verifyHttpSignature(method, path, {
      signature: 'keyId="a",headers="(request-target) host date digest",signature="abc"',
      host: 'localhost',
      date: new Date().toUTCString(),
      // digest intentionally missing
    })

    expect(result).toBe(false)
  })

  it('returns false when Date header is outside allowed replay window', async () => {
    redisMock.set.mockResolvedValueOnce('OK')
    const oldDate = new Date(Date.now() - 1000 * 60 * 10).toUTCString()
    const headers = buildValidHeaders(oldDate)

    const result = await HttpSignatureService.verifyHttpSignature(method, path, headers)
    expect(result).toBe(false)
  })

  it('returns false for replayed signature payloads', async () => {
    redisMock.set.mockResolvedValueOnce('OK').mockResolvedValueOnce(null)
    const headers = buildValidHeaders()

    const first = await HttpSignatureService.verifyHttpSignature(method, path, headers)
    const second = await HttpSignatureService.verifyHttpSignature(method, path, headers)

    expect(first).toBe(true)
    expect(second).toBe(false)
  })

  it('returns false when Date header is entirely absent from the request', async () => {
    const result = await HttpSignatureService.verifyHttpSignature(method, path, {
      signature: 'keyId="a",headers="date",signature="abc"',
      host: 'localhost',
      // no date header at all
    })
    expect(result).toBe(false)
  })

  it('returns false when Date header value is not a valid date string', async () => {
    const result = await HttpSignatureService.verifyHttpSignature(method, path, {
      signature: 'keyId="a",headers="date",signature="abc"',
      host: 'localhost',
      date: 'not-a-real-date',
    })
    expect(result).toBe(false)
  })

  it('returns false when keyId is missing from Signature header', async () => {
    const result = await HttpSignatureService.verifyHttpSignature(method, path, {
      signature: 'algorithm="rsa-sha256",headers="date",signature="abc"',
      host: 'localhost',
      date: new Date().toUTCString(),
    })
    expect(result).toBe(false)
  })

  it('returns false when signature value is missing from Signature header', async () => {
    const result = await HttpSignatureService.verifyHttpSignature(method, path, {
      signature: 'keyId="https://remote.example/users/alice#main-key",headers="date"',
      host: 'localhost',
      date: new Date().toUTCString(),
    })
    expect(result).toBe(false)
  })

  it('returns false when remote actor fetch throws', async () => {
    redisMock.set.mockResolvedValueOnce('OK')
    jest.spyOn(ActorService, 'fetchRemoteActor').mockRejectedValueOnce(new Error('network error'))
    const headers = buildValidHeaders()

    const result = await HttpSignatureService.verifyHttpSignature(method, path, headers)
    expect(result).toBe(false)
  })

  it('returns false when remote actor has no publicKey', async () => {
    redisMock.set.mockResolvedValueOnce('OK')
    jest.spyOn(ActorService, 'fetchRemoteActor').mockResolvedValueOnce({
      publicKey: { publicKeyPem: '' },
    } as any)
    const headers = buildValidHeaders()

    const result = await HttpSignatureService.verifyHttpSignature(method, path, headers)
    expect(result).toBe(false)
  })

  it('returns false when the signature is cryptographically invalid', async () => {
    redisMock.set.mockResolvedValueOnce('OK')
    const headers = buildValidHeaders()
    // tamper with the signature bytes
    headers.signature = headers.signature.replace(/signature="[^"]*"/, 'signature="aW52YWxpZA=="')

    const result = await HttpSignatureService.verifyHttpSignature(method, path, headers)
    expect(result).toBe(false)
  })

  it('uses replayFallback map when Redis throws', async () => {
    redisMock.set.mockRejectedValue(new Error('redis down'))
    const headers = buildValidHeaders()

    // First call: not a replay (key stored in fallback map)
    const first = await HttpSignatureService.verifyHttpSignature(method, path, headers)
    expect(first).toBe(true)

    // Second call with the same headers: replay detected via in-memory fallback
    const second = await HttpSignatureService.verifyHttpSignature(method, path, headers)
    expect(second).toBe(false)
  })

  it('accepts array header values by using the first element', async () => {
    redisMock.set.mockResolvedValueOnce('OK')
    const date = new Date().toUTCString()
    const keyId = 'https://remote.example/users/alice#main-key'
    const host = 'localhost'
    const digest = 'SHA-256=ZmFrZQ=='
    const signingString = [
      `(request-target): ${method.toLowerCase()} ${path}`,
      `host: ${host}`,
      `date: ${date}`,
      `digest: ${digest}`,
    ].join('\n')

    const signer = createSign('RSA-SHA256')
    signer.update(signingString)
    const signature = signer.sign(privateKey, 'base64')

    // Pass host and date as arrays (as some HTTP frameworks do)
    const result = await HttpSignatureService.verifyHttpSignature(method, path, {
      signature: `keyId="${keyId}",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="${signature}"`,
      host: [host] as any,
      date: [date] as any,
      digest,
    })

    expect(result).toBe(true)
  })

  // ── buildSignedHeaders ────────────────────────────────────────────────────

  describe('buildSignedHeaders', () => {
    const targetUrl = 'https://remote.example/users/bob/inbox'
    const bodyJson = JSON.stringify({ type: 'Follow', actor: 'https://example.com/actor' })

    beforeEach(() => {
      // Provide a real RSA private key via env so getPrivateKey() succeeds.
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
      process.env.ACTIVITYPUB_PRIVATE_KEY = privateKeyPem.replace(/\n/g, '\\n')
    })

    afterEach(() => {
      delete process.env.ACTIVITYPUB_PRIVATE_KEY
    })

    it('returns an object with all required header keys', () => {
      const headers = HttpSignatureService.buildSignedHeaders(targetUrl, bodyJson)

      expect(headers).toHaveProperty('Signature')
      expect(headers).toHaveProperty('Digest')
      expect(headers).toHaveProperty('Date')
      expect(headers).toHaveProperty('Host')
      expect(headers).toHaveProperty('Content-Type', 'application/activity+json')
    })

    it('sets Host to the target URL hostname', () => {
      const headers = HttpSignatureService.buildSignedHeaders(targetUrl, bodyJson)
      expect(headers.Host).toBe('remote.example')
    })

    it('computes a SHA-256 digest of the body', () => {
      const headers = HttpSignatureService.buildSignedHeaders(targetUrl, bodyJson)
      expect(headers.Digest).toMatch(/^SHA-256=/)
      // The digest should be a non-empty base64 string after the prefix
      const b64 = headers.Digest.slice('SHA-256='.length)
      expect(b64.length).toBeGreaterThan(0)
    })

    it('produces a Signature header containing keyId, algorithm, headers, and signature fields', () => {
      const headers = HttpSignatureService.buildSignedHeaders(targetUrl, bodyJson)
      expect(headers.Signature).toContain('keyId=')
      expect(headers.Signature).toContain('algorithm="rsa-sha256"')
      expect(headers.Signature).toContain('headers="(request-target) host date digest"')
      expect(headers.Signature).toContain('signature=')
    })

    it('embeds the correct keyId derived from the site URL', () => {
      const headers = HttpSignatureService.buildSignedHeaders(targetUrl, bodyJson)
      // keyId is built from NEXT_PUBLIC_SITE_URL: https://example.com/api/activitypub/actor#main-key
      expect(headers.Signature).toContain('keyId="https://example.com/api/activitypub/actor#main-key"')
    })

    it('produces a cryptographically valid signature that can be verified', () => {
      const headers = HttpSignatureService.buildSignedHeaders(targetUrl, bodyJson)

      // Re-construct the signing string the same way the service does
      const url = new URL(targetUrl)
      const pathAndQuery = url.pathname + url.search
      const reconstructedSigningString = [
        `(request-target): post ${pathAndQuery}`,
        `host: ${headers.Host}`,
        `date: ${headers.Date}`,
        `digest: ${headers.Digest}`,
      ].join('\n')

      // Extract the raw base64 signature from the Signature header
      const sigMatch = headers.Signature.match(/signature="([^"]+)"/)
      expect(sigMatch).not.toBeNull()
      const rawSignature = sigMatch![1]

      // Verify with the public key
      const { createVerify } = require('node:crypto')
      const verifier = createVerify('RSA-SHA256')
      verifier.update(reconstructedSigningString)
      const valid = verifier.verify(
        publicKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
        rawSignature,
        'base64',
      )
      expect(valid).toBe(true)
    })

    it('handles a URL with a path and query string', () => {
      const urlWithQuery = 'https://remote.example/inbox?foo=bar'
      const headers = HttpSignatureService.buildSignedHeaders(urlWithQuery, bodyJson)

      expect(headers.Signature).toContain('(request-target) host date digest')
      // The signing string should incorporate the path+query; signature must still be present
      expect(headers.Signature).toContain('signature=')
    })

    it('produces a different Digest for different body content', () => {
      const headers1 = HttpSignatureService.buildSignedHeaders(targetUrl, '{"a":1}')
      const headers2 = HttpSignatureService.buildSignedHeaders(targetUrl, '{"a":2}')
      expect(headers1.Digest).not.toBe(headers2.Digest)
    })
  })
})
