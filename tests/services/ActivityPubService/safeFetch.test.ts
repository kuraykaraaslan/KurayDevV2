import { lookup as dnsLookup } from 'node:dns/promises'
import {
  isBlockedAddress,
  assertSafeFederationUrl,
  safeFederationFetch,
  readCappedText,
  MAX_RESPONSE_BYTES,
} from '@/services/ActivityPubService/safeFetch'

const lookupMock = dnsLookup as unknown as jest.Mock

/** Resolves every hostname to a routable public address. */
const resolvePublic = () => lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])

describe('safeFetch — federation SSRF guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resolvePublic()
  })

  describe('isBlockedAddress', () => {
    it.each([
      ['169.254.169.254', 'cloud metadata'],
      ['127.0.0.1', 'loopback'],
      ['10.1.2.3', 'RFC1918 /8'],
      ['172.16.0.1', 'RFC1918 /12'],
      ['192.168.1.1', 'RFC1918 /16'],
      ['0.0.0.0', 'this network'],
      ['100.64.0.1', 'CGNAT'],
      ['198.18.0.1', 'benchmarking'],
      ['224.0.0.1', 'multicast'],
      ['255.255.255.255', 'broadcast'],
      ['::1', 'IPv6 loopback'],
      ['fd00::1', 'IPv6 unique local'],
      ['fe80::1', 'IPv6 link local'],
      ['::ffff:169.254.169.254', 'IPv4-mapped metadata'],
      ['64:ff9b::169.254.169.254', 'NAT64 metadata'],
    ])('blocks %s (%s)', (ip) => {
      expect(isBlockedAddress(ip)).toBe(true)
    })

    it.each([['93.184.216.34'], ['8.8.8.8'], ['2606:2800:220:1:248:1893:25c8:1946']])(
      'allows public address %s',
      (ip) => {
        expect(isBlockedAddress(ip)).toBe(false)
      }
    )

    it('refuses anything that is not a parseable address', () => {
      expect(isBlockedAddress('not-an-ip')).toBe(true)
    })
  })

  describe('assertSafeFederationUrl', () => {
    it('rejects an unparseable URL', async () => {
      await expect(assertSafeFederationUrl('not a url')).rejects.toThrow('unparseable')
    })

    it('rejects non-http protocols', async () => {
      await expect(assertSafeFederationUrl('file:///etc/passwd')).rejects.toThrow('protocol')
    })

    it('rejects URLs carrying embedded credentials', async () => {
      await expect(
        assertSafeFederationUrl('https://user:pass@remote.example/actor')
      ).rejects.toThrow('embedded credentials')
    })

    it('rejects a literal cloud-metadata address without resolving DNS', async () => {
      await expect(
        assertSafeFederationUrl('http://169.254.169.254/latest/meta-data/')
      ).rejects.toThrow('non-public address')
      expect(lookupMock).not.toHaveBeenCalled()
    })

    it('rejects a hostname that resolves to a private address', async () => {
      lookupMock.mockResolvedValue([{ address: '127.0.0.1', family: 4 }])
      await expect(assertSafeFederationUrl('https://evil.example/actor')).rejects.toThrow(
        'resolves to non-public'
      )
    })

    it('rejects when any one of several resolved addresses is private', async () => {
      lookupMock.mockResolvedValue([
        { address: '93.184.216.34', family: 4 },
        { address: '10.0.0.5', family: 4 },
      ])
      await expect(assertSafeFederationUrl('https://split.example/actor')).rejects.toThrow(
        'resolves to non-public'
      )
    })

    it('rejects when DNS resolution fails', async () => {
      lookupMock.mockRejectedValue(new Error('ENOTFOUND'))
      await expect(assertSafeFederationUrl('https://nx.example/actor')).rejects.toThrow(
        'DNS resolution failed'
      )
    })

    it('accepts a public https URL', async () => {
      const url = await assertSafeFederationUrl('https://remote.example/users/alice')
      expect(url.hostname).toBe('remote.example')
    })
  })

  describe('safeFederationFetch', () => {
    const originalFetch = global.fetch
    afterAll(() => {
      global.fetch = originalFetch
    })

    const response = (over: Record<string, unknown> = {}) => ({
      ok: true,
      status: 200,
      headers: { get: jest.fn().mockReturnValue(null) },
      body: null,
      text: jest.fn().mockResolvedValue(''),
      ...over,
    })

    it('re-validates the target of a redirect', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(
          response({
            status: 302,
            headers: { get: jest.fn().mockReturnValue('http://169.254.169.254/') },
          })
        )
        .mockResolvedValueOnce(response()) as any

      await expect(safeFederationFetch('https://remote.example/actor')).rejects.toThrow(
        'non-public address'
      )
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('follows a redirect to another public host', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(
          response({
            status: 301,
            headers: { get: jest.fn().mockReturnValue('https://other.example/actor') },
          })
        )
        .mockResolvedValueOnce(response({ status: 200 })) as any

      const res = await safeFederationFetch('https://remote.example/actor')
      expect(res.status).toBe(200)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('refuses to redirect a POST', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        response({
          status: 302,
          headers: { get: jest.fn().mockReturnValue('https://other.example/inbox') },
        })
      ) as any

      await expect(
        safeFederationFetch('https://remote.example/inbox', { method: 'POST', body: '{}' })
      ).rejects.toThrow('Refusing to follow redirect')
    })

    it('gives up after too many redirects', async () => {
      global.fetch = jest.fn().mockResolvedValue(
        response({
          status: 302,
          headers: { get: jest.fn().mockReturnValue('https://loop.example/actor') },
        })
      ) as any

      await expect(safeFederationFetch('https://remote.example/actor')).rejects.toThrow(
        'Too many federation redirects'
      )
    })

    it('sends an abort signal and disables automatic redirects', async () => {
      global.fetch = jest.fn().mockResolvedValue(response()) as any

      await safeFederationFetch('https://remote.example/actor')

      expect(global.fetch).toHaveBeenCalledWith(
        new URL('https://remote.example/actor'),
        expect.objectContaining({ redirect: 'manual', signal: expect.anything() })
      )
    })
  })

  describe('readCappedText', () => {
    it('rejects a body whose declared Content-Length is over the cap', async () => {
      const res = {
        headers: { get: jest.fn().mockReturnValue(String(MAX_RESPONSE_BYTES + 1)) },
        body: null,
        text: jest.fn(),
      } as unknown as Response

      await expect(readCappedText(res)).rejects.toThrow('too large')
      expect(res.text).not.toHaveBeenCalled()
    })

    it('rejects a streamed body that exceeds the cap mid-flight', async () => {
      const chunk = new Uint8Array(200_000)
      const cancel = jest.fn()
      let reads = 0

      const res = {
        headers: { get: jest.fn().mockReturnValue(null) },
        body: {
          getReader: () => ({
            read: async () => {
              reads++
              return { done: false, value: chunk }
            },
            cancel,
          }),
        },
      } as unknown as Response

      await expect(readCappedText(res)).rejects.toThrow('too large')
      expect(cancel).toHaveBeenCalled()
      // Stopped as soon as the cap was crossed rather than reading forever.
      expect(reads).toBeLessThanOrEqual(MAX_RESPONSE_BYTES / chunk.byteLength + 1)
    })

    it('returns the decoded body when it is within the cap', async () => {
      const res = {
        headers: { get: jest.fn().mockReturnValue(null) },
        body: null,
        text: jest.fn().mockResolvedValue('{"id":"https://remote.example/actor"}'),
      } as unknown as Response

      await expect(readCappedText(res)).resolves.toBe('{"id":"https://remote.example/actor"}')
    })
  })
})
