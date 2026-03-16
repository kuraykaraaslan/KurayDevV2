import { createSign, generateKeyPairSync } from 'node:crypto'
import HttpSignatureService from '@/services/ActivityPubService/HttpSignatureService'
import ActorService from '@/services/ActivityPubService/ActorService'
import redis from '@/libs/redis'

const redisMock = redis as jest.Mocked<typeof redis>

describe('HttpSignatureService', () => {
  const method = 'POST'
  const path = '/api/activitypub/inbox'

  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const publicKeyPem = publicKey.export({ type: 'pkcs1', format: 'pem' }).toString()

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
})
