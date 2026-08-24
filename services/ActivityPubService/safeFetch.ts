import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import Logger from '@/libs/logger'

/**
 * SSRF guard for federation traffic.
 *
 * Every URL we fetch during federation is attacker-supplied: the `keyId` in an
 * incoming Signature header, and the `inbox` advertised by a remote actor
 * document. Both reach us over the unauthenticated inbox endpoint, so without
 * a guard any Fediverse server (or anyone able to POST to /inbox) can make
 * this host issue requests to its own private network — cloud metadata
 * endpoints, internal admin panels, Redis/Postgres over HTTP, and so on.
 */

/** Maximum redirect hops to follow. Each hop is re-validated. */
const MAX_REDIRECTS = 3
/** Per-request timeout. Without this a slow internal host pins a worker. */
const REQUEST_TIMEOUT_MS = 5_000
/** Cap on response bodies we will buffer (1 MiB). */
export const MAX_RESPONSE_BYTES = 1_000_000

/** In development, allow plain http + localhost so the flow can be exercised. */
const isProduction = process.env.NODE_ENV === 'production'

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map((p) => Number(p))
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
}

function inCidr(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask)
}

/** RFC1918 + loopback + link-local + CGNAT + documentation/reserved ranges. */
function isBlockedIPv4(ip: string): boolean {
  return (
    inCidr(ip, '0.0.0.0', 8) ||        // "this network"
    inCidr(ip, '10.0.0.0', 8) ||       // private
    inCidr(ip, '100.64.0.0', 10) ||    // CGNAT
    inCidr(ip, '127.0.0.0', 8) ||      // loopback
    inCidr(ip, '169.254.0.0', 16) ||   // link-local (cloud metadata)
    inCidr(ip, '172.16.0.0', 12) ||    // private
    inCidr(ip, '192.0.0.0', 24) ||     // IETF protocol assignments
    inCidr(ip, '192.0.2.0', 24) ||     // TEST-NET-1
    inCidr(ip, '192.168.0.0', 16) ||   // private
    inCidr(ip, '198.18.0.0', 15) ||    // benchmarking
    inCidr(ip, '198.51.100.0', 24) ||  // TEST-NET-2
    inCidr(ip, '203.0.113.0', 24) ||   // TEST-NET-3
    inCidr(ip, '224.0.0.0', 4) ||      // multicast
    inCidr(ip, '240.0.0.0', 4)         // reserved, incl. 255.255.255.255
  )
}

/**
 * Extracts the embedded IPv4 address from IPv4-mapped (::ffff:a.b.c.d),
 * NAT64 (64:ff9b::/96) and 6to4 (2002::/16) addresses, so those cannot be
 * used to smuggle a private v4 target past the v6 checks.
 */
function embeddedIPv4(ip: string): string | null {
  const lower = ip.toLowerCase()

  const mapped = lower.match(/^(?:::ffff:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return mapped[1]

  const hexMapped = lower.match(/^(?:::ffff:|64:ff9b::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (hexMapped) {
    const hi = parseInt(hexMapped[1], 16)
    const lo = parseInt(hexMapped[2], 16)
    return `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`
  }

  const sixToFour = lower.match(/^2002:([0-9a-f]{1,4}):([0-9a-f]{1,4}):/)
  if (sixToFour) {
    const hi = parseInt(sixToFour[1], 16)
    const lo = parseInt(sixToFour[2], 16)
    return `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`
  }

  return null
}

function isBlockedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase().split('%')[0] // strip zone index

  const embedded = embeddedIPv4(lower)
  if (embedded) return isBlockedIPv4(embedded)

  if (lower === '::' || lower === '::1') return true

  const head = parseInt(lower.split(':')[0] || '0', 16)
  if ((head & 0xfe00) === 0xfc00) return true // fc00::/7  unique local
  if ((head & 0xffc0) === 0xfe80) return true // fe80::/10 link local
  if ((head & 0xff00) === 0xff00) return true // ff00::/8  multicast

  return false
}

/** True when the literal IP address must not be reached. */
export function isBlockedAddress(ip: string): boolean {
  const version = isIP(ip)
  if (version === 4) return isBlockedIPv4(ip)
  if (version === 6) return isBlockedIPv6(ip)
  return true // not a parseable address — refuse rather than guess
}

/**
 * Validates scheme and destination address of a federation URL.
 * Throws when the URL must not be fetched.
 *
 * Note on TOCTOU: we resolve the hostname here, but `fetch` resolves it again
 * when it connects, so a DNS-rebinding attacker with a very short TTL could in
 * principle race the two lookups. Closing that fully requires pinning the
 * connection to the validated address, which Node's global fetch does not
 * expose. This check still removes the entire class of "hostname that simply
 * points at 169.254.169.254" attacks, which is what is actually reachable here.
 */
export async function assertSafeFederationUrl(rawUrl: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error(`Blocked federation URL (unparseable): ${rawUrl}`)
  }

  const allowedProtocols = isProduction ? ['https:'] : ['https:', 'http:']
  if (!allowedProtocols.includes(url.protocol)) {
    throw new Error(`Blocked federation URL (protocol ${url.protocol}): ${rawUrl}`)
  }

  // Credentials in the URL are never legitimate here and confuse origin checks.
  if (url.username || url.password) {
    throw new Error(`Blocked federation URL (embedded credentials): ${rawUrl}`)
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '')

  if (isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw new Error(`Blocked federation URL (non-public address ${hostname}): ${rawUrl}`)
    }
    return url
  }

  if (!isProduction && (hostname === 'localhost' || hostname.endsWith('.localhost'))) {
    return url
  }

  let addresses: Array<{ address: string }>
  try {
    addresses = await lookup(hostname, { all: true })
  } catch {
    throw new Error(`Blocked federation URL (DNS resolution failed): ${rawUrl}`)
  }

  if (!addresses.length) {
    throw new Error(`Blocked federation URL (no addresses): ${rawUrl}`)
  }

  // Every resolved address must be public — a host with one public and one
  // private A record must not be reachable.
  for (const { address } of addresses) {
    if (isBlockedAddress(address)) {
      throw new Error(`Blocked federation URL (resolves to non-public ${address}): ${rawUrl}`)
    }
  }

  return url
}

/**
 * fetch() for federation traffic: SSRF-checked, timed out, and with redirects
 * followed manually so each hop is validated too (a public host redirecting to
 * http://169.254.169.254/ would otherwise walk straight past the first check).
 */
export async function safeFederationFetch(
  rawUrl: string,
  init: RequestInit = {}
): Promise<Response> {
  let currentUrl = rawUrl

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertSafeFederationUrl(currentUrl)

    const res = await fetch(url, {
      ...init,
      redirect: 'manual',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    const isRedirect = res.status >= 300 && res.status < 400
    if (!isRedirect) return res

    const location = res.headers.get('location')
    if (!location) return res

    const next = new URL(location, url).toString()
    Logger.info(`[ActivityPub] Following federation redirect: ${currentUrl} -> ${next}`)
    currentUrl = next

    // A redirect chain must not silently turn a POST into a replayed POST
    // against a different host, so only bodyless requests may be redirected.
    if (init.method && init.method.toUpperCase() !== 'GET') {
      throw new Error(`Refusing to follow redirect for ${init.method} request: ${rawUrl}`)
    }
  }

  throw new Error(`Too many federation redirects: ${rawUrl}`)
}

/**
 * Reads a response body as text, refusing anything over MAX_RESPONSE_BYTES.
 * The body is streamed rather than buffered whole, so a remote server cannot
 * exhaust memory by advertising a small Content-Length and then sending more.
 */
export async function readCappedText(res: Response): Promise<string> {
  const declared = Number(res.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) {
    throw new Error(`Federation response too large: ${declared} bytes`)
  }

  const reader = res.body?.getReader()
  if (!reader) return res.text()

  const chunks: Uint8Array[] = []
  let total = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue

    total += value.byteLength
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel()
      throw new Error(`Federation response too large: over ${MAX_RESPONSE_BYTES} bytes`)
    }
    chunks.push(value)
  }

  return new TextDecoder().decode(Buffer.concat(chunks))
}
