import { createHash, createSign, createVerify } from 'node:crypto'
import Logger from '@/libs/logger'
import { getKeyId, getPrivateKey } from './config'
import ActorService from './ActorService'

export default class HttpSignatureService {
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
   */
  static async verifyHttpSignature(
    method: string,
    path: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<boolean> {
    const signatureHeader = headers['signature']
    if (!signatureHeader || typeof signatureHeader !== 'string') {
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

    let publicKeyPem: string
    try {
      const actor = await ActorService.fetchRemoteActor(keyId.split('#')[0])
      publicKeyPem = actor.publicKey?.publicKeyPem ?? ''
      if (!publicKeyPem) {
        Logger.warn(`[ActivityPub] Remote actor has no publicKey: ${keyId}`)
        return false
      }
    } catch (err) {
      Logger.warn(`[ActivityPub] Failed to fetch remote actor for signature verification: ${keyId} — ${String(err)}`)
      return false
    }

    const signingParts = signedHeaders.split(' ').map((h) => {
      if (h === '(request-target)') return `(request-target): ${method.toLowerCase()} ${path}`
      const v = headers[h.toLowerCase()]
      return `${h}: ${Array.isArray(v) ? v[0] : (v ?? '')}`
    })

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
