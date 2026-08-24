import { createHash, createSign, createVerify, timingSafeEqual } from 'node:crypto'
import Logger from '@/libs/logger'
import redisInstance from '@/libs/redis'
import { getKeyId, getPrivateKey } from './config'
import ActorService from './ActorService'

export default class HttpSignatureService {
  private static readonly SIGNATURE_MAX_SKEW_SECONDS = 60 * 5
  private static readonly REPLAY_TTL_SECONDS = 60 * 5
  private static replayFallback = new Map<string, number>()

  private static getHeaderValue(
    headers: Record<string, string | string[] | undefined>,
    name: string
  ): string | undefined {
    const lowered = name.toLowerCase()

    for (const [key, rawValue] of Object.entries(headers)) {
      if (key.toLowerCase() !== lowered) continue
      if (Array.isArray(rawValue)) return rawValue[0]
      return rawValue
    }

    return undefined
  }

  /** Length-safe constant-time string comparison. */
  private static timingSafeEquals(a: string, b: string): boolean {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  }

  private static async isReplay(replayKey: string): Promise<boolean> {
    try {
      const result = await redisInstance.set(replayKey, '1', 'EX', this.REPLAY_TTL_SECONDS, 'NX')
      return result !== 'OK'
    } catch {
      const now = Date.now()

      for (const [key, expiresAt] of this.replayFallback.entries()) {
        if (expiresAt <= now) this.replayFallback.delete(key)
      }

      const existingExpiry = this.replayFallback.get(replayKey)
      if (existingExpiry && existingExpiry > now) {
        return true
      }

      this.replayFallback.set(replayKey, now + this.REPLAY_TTL_SECONDS * 1000)
      return false
    }
  }

  /**
   * Signs an outgoing POST request with an RSA-SHA256 HTTP Signature.
   * Returns the headers to merge into the fetch call.
   */
  static buildSignedHeaders(targetUrl: string, bodyJson: string): Record<string, string> {
    const url = new URL(targetUrl)
    const date = new Date().toUTCString()
    const digest = `SHA-256=${createHash('sha256').update(bodyJson).digest('base64')}`
    const path = url.pathname + url.search

    const signingString = [
      `(request-target): post ${path}`,
      `host: ${url.host}`,
      `date: ${date}`,
      `digest: ${digest}`,
    ].join('\n')

    const signer = createSign('RSA-SHA256')
    signer.update(signingString)
    const signature = signer.sign(getPrivateKey(), 'base64')

    const signatureHeader = [
      `keyId="${getKeyId()}"`,
      `algorithm="rsa-sha256"`,
      `headers="(request-target) host date digest"`,
      `signature="${signature}"`,
    ].join(',')

    return {
      Host: url.host,
      Date: date,
      Digest: digest,
      Signature: signatureHeader,
      'Content-Type': 'application/activity+json',
    }
  }

  /**
   * Verifies an incoming HTTP Signature from a remote ActivityPub server.
   * Returns true if valid, false otherwise. Logs warnings but never throws.
   *
   * `body` and `actor` are required rather than optional: without them a valid
   * signature proves only that *someone* with *some* key signed *something*.
   * The body must be bound to the signature via Digest, and the key must be
   * bound to the actor the activity claims to come from.
   */
  static async verifyHttpSignature(
    method: string,
    path: string,
    headers: Record<string, string | string[] | undefined>,
    request: { body: string; actor: string }
  ): Promise<boolean> {
    const signatureHeader = this.getHeaderValue(headers, 'signature')
    if (!signatureHeader) {
      Logger.warn('[ActivityPub] Missing Signature header')
      return false
    }

    const parts: Record<string, string> = {}
    for (const part of signatureHeader.split(',')) {
      const eq = part.indexOf('=')
      if (eq === -1) continue
      const k = part.slice(0, eq).trim()
      const v = part.slice(eq + 1).trim().replace(/^"(.*)"$/, '$1')
      parts[k] = v
    }

    const { keyId, headers: signedHeaders = 'date', signature } = parts
    if (!keyId || !signature) {
      Logger.warn('[ActivityPub] Signature header missing keyId or signature')
      return false
    }

    // The signed-header list is chosen by the sender and defaults to `date`
    // alone. A signature covering only the date says nothing about the method,
    // the path or the body, so require the headers that bind them.
    const coveredHeaders = new Set(
      signedHeaders.split(' ').map((h) => h.trim().toLowerCase()).filter(Boolean)
    )
    for (const required of ['(request-target)', 'host', 'date', 'digest']) {
      if (!coveredHeaders.has(required)) {
        Logger.warn(`[ActivityPub] Signature does not cover required header: ${required}`)
        return false
      }
    }

    // Bind the signature to the body. Without this the signed headers can be
    // lifted from one request and replayed with different content.
    const digestHeader = this.getHeaderValue(headers, 'digest')
    if (!digestHeader) {
      Logger.warn('[ActivityPub] Missing Digest header')
      return false
    }

    const expectedDigest = `SHA-256=${createHash('sha256').update(request.body).digest('base64')}`
    if (!this.timingSafeEquals(digestHeader.trim(), expectedDigest)) {
      Logger.warn('[ActivityPub] Digest header does not match request body')
      return false
    }

    const dateHeader = this.getHeaderValue(headers, 'date')
    if (!dateHeader) {
      Logger.warn('[ActivityPub] Missing Date header')
      return false
    }

    const dateMillis = Date.parse(dateHeader)
    if (Number.isNaN(dateMillis)) {
      Logger.warn('[ActivityPub] Invalid Date header')
      return false
    }

    const skewSeconds = Math.abs(Date.now() - dateMillis) / 1000
    if (skewSeconds > this.SIGNATURE_MAX_SKEW_SECONDS) {
      Logger.warn('[ActivityPub] Date header outside allowed skew window')
      return false
    }

    const replayFingerprint = createHash('sha256')
      .update(`${keyId}|${signature}|${method.toUpperCase()}|${path}|${dateHeader}`)
      .digest('hex')

    const replayKey = `activitypub:replay:${replayFingerprint}`
    if (await this.isReplay(replayKey)) {
      Logger.warn(`[ActivityPub] Replay detected for keyId: ${keyId}`)
      return false
    }

    let publicKeyPem: string
    try {
      const actor = await ActorService.fetchRemoteActor(keyId.split('#')[0])
      publicKeyPem = actor.publicKey?.publicKeyPem ?? ''
      if (!publicKeyPem) {
        Logger.warn(`[ActivityPub] Remote actor has no publicKey: ${keyId}`)
        return false
      }

      // Bind the key to the actor the activity claims to come from. Anyone can
      // generate a key pair and sign correctly; without this check they could
      // sign as themselves while setting `actor` to somebody else's URL and we
      // would act on it — deleting that actor's follower record, undoing their
      // follow, and so on.
      const keyOwner = actor.publicKey?.owner ?? actor.id
      if (keyOwner !== request.actor && actor.id !== request.actor) {
        Logger.warn(
          `[ActivityPub] Signing key ${keyId} (owner ${keyOwner}) does not match activity actor ${request.actor}`
        )
        return false
      }
    } catch (err) {
      Logger.warn(`[ActivityPub] Failed to fetch remote actor for signature verification: ${keyId} — ${String(err)}`)
      return false
    }

    const headerNames = signedHeaders.split(' ').map((h) => h.trim()).filter(Boolean)
    const signingParts: string[] = []

    for (const h of headerNames) {
      if (h === '(request-target)') {
        signingParts.push(`(request-target): ${method.toLowerCase()} ${path}`)
        continue
      }

      const value = this.getHeaderValue(headers, h)
      if (!value) {
        Logger.warn(`[ActivityPub] Missing signed header value: ${h}`)
        return false
      }

      signingParts.push(`${h}: ${value}`)
    }

    try {
      const verifier = createVerify('RSA-SHA256')
      verifier.update(signingParts.join('\n'))
      return verifier.verify(publicKeyPem, signature, 'base64')
    } catch {
      Logger.warn(`[ActivityPub] Signature verification threw for keyId: ${keyId}`)
      return false
    }
  }
}
