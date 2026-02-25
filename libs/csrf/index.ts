import { NextResponse } from 'next/server'

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.ACCESS_TOKEN_SECRET
if (!CSRF_SECRET) {
  throw new Error(
    'CSRF_SECRET or ACCESS_TOKEN_SECRET environment variable must be set. '
    + 'Application cannot start without a secure CSRF secret.'
  )
}
const CSRF_TOKEN_EXPIRY = 60 * 60 // 1 hour (in seconds)
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Web Crypto API ile HMAC-SHA256 imza oluştur (Edge Runtime uyumlu)
 */
async function createHmacSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(data)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Rastgele bytes oluştur (Edge Runtime uyumlu)
 */
function generateRandomBytes(length: number): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Base64url encode (Edge Runtime uyumlu)
 */
function base64urlEncode(str: string): string {
  if (!str) return ''
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str)
  // Chunk-based conversion to avoid stack overflow
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Base64url decode (Edge Runtime uyumlu)
 */
function base64urlDecode(str: string): string {
  if (!str) return ''
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  try {
    return atob(padded)
  } catch {
    return ''
  }
}

/**
 * Timing-safe string comparison (Edge Runtime uyumlu)
 */
function timingSafeEqual(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * CSRF Token Service
 * Double Submit Cookie Pattern (Edge Runtime uyumlu)
 */
export default class CSRFService {
  /**
   * CSRF token oluştur
   * @param sessionId - Kullanıcının session ID'si (opsiyonel, anonymous kullanıcılar için boş olabilir)
   * @returns CSRF token
   */
  static async generateToken(sessionId?: string): Promise<string> {
    const timestamp = Date.now()
    const randomBytes = generateRandomBytes(32)
    const data = `${sessionId || 'anonymous'}-${timestamp}-${randomBytes}`

    // HMAC ile imzala
    const signature = await createHmacSignature(data, CSRF_SECRET)

    // Token format: data.signature
    return base64urlEncode(`${data}.${signature}`)
  }

  /**
   * CSRF token'ı doğrula
   * @param token - Doğrulanacak token
   * @param sessionId - Kullanıcının session ID'si
   * @returns Token geçerli mi
   */
  static async verifyToken(token: string, sessionId?: string): Promise<boolean> {
    try {
      if (!token) return false

      // Base64url decode
      const decoded = base64urlDecode(token)
      const parts = decoded.split('.')

      if (parts.length !== 2) return false

      const [data, signature] = parts
      const dataParts = data.split('-')

      if (dataParts.length < 3) return false

      const [tokenSessionId, timestamp] = dataParts

      // Session ID check (if provided)
      if (sessionId && tokenSessionId !== sessionId && tokenSessionId !== 'anonymous') {
        return false
      }

      // Timestamp check - is the token expired?
      const tokenAge = Date.now() - parseInt(timestamp)
      if (tokenAge > CSRF_TOKEN_EXPIRY * 1000) {
        return false
      }

      // Signature verification
      const expectedSignature = await createHmacSignature(data, CSRF_SECRET)

      return timingSafeEqual(signature, expectedSignature)
    } catch {
      return false
    }
  }

  /**
   * Request'ten CSRF token'ı al
   * @param request - Next.js request objesi
   * @returns CSRF token veya null
   */
  static getTokenFromRequest(request: NextRequest): string | null {
    // First try from header
    const headerToken = request.headers.get(CSRF_HEADER_NAME)
    if (headerToken) return headerToken

    // Sonra cookie'den dene
    const cookieToken = (request as any).cookies?.get(CSRF_COOKIE_NAME)?.value
    return cookieToken || null
  }

  /**
   * Response'a CSRF cookie ekle
   * @param response - Next.js response objesi
   * @param token - CSRF token
   * @returns Güncellenmiş response
   */
  static setTokenCookie(response: NextResponse, token: string): NextResponse {
    const isProduction = process.env.NODE_ENV === 'production'

    response.cookies.set(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // false so JavaScript can read it
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: CSRF_TOKEN_EXPIRY,
    })

    return response
  }

  /**
   * CSRF doğrulama middleware helper
   * @param request - Next.js request objesi
   * @param sessionId - Kullanıcının session ID'si
   * @returns Hata mesajı veya null (geçerli ise)
   */
  static async validateRequest(
    request: NextRequest,
    sessionId?: string
  ): Promise<{ valid: boolean; error?: string }> {
    // GET, HEAD, OPTIONS requests don't require CSRF validation
    const safeMethods = ['GET', 'HEAD', 'OPTIONS']
    if (safeMethods.includes(request.method)) {
      return { valid: true }
    }

    // Cookie'deki token
    const cookieToken = (request as any).cookies?.get(CSRF_COOKIE_NAME)?.value

    // Header'daki token
    const headerToken = request.headers.get(CSRF_HEADER_NAME)

    // Double Submit Cookie Pattern: Both tokens must be present and match
    if (!cookieToken || !headerToken) {
      return {
        valid: false,
        error: 'CSRF token missing. Include both cookie and X-CSRF-Token header.',
      }
    }

    if (cookieToken !== headerToken) {
      return {
        valid: false,
        error: 'CSRF token mismatch.',
      }
    }

    // Token signature verification
    const isValid = await this.verifyToken(cookieToken, sessionId)
    if (!isValid) {
      return {
        valid: false,
        error: 'Invalid or expired CSRF token.',
      }
    }

    return { valid: true }
  }

  /**
   * CSRF cookie ve header isimlerini döndür
   */
  static get cookieName(): string {
    return CSRF_COOKIE_NAME
  }

  static get headerName(): string {
    return CSRF_HEADER_NAME
  }

  static get tokenExpiry(): number {
    return CSRF_TOKEN_EXPIRY
  }
}

/**
 * CSRF koruması gerektirmeyen route'lar
 * - Public API'ler
 * - Webhook'lar
 * - SSO callback'leri
 */
export const CSRF_EXEMPT_ROUTES = [
  '/api/auth/callback', // SSO callbacks
  '/api/cron', // Cron jobs (secret ile korunuyor)
  '/api/webhook', // Webhooks
  '/api/status', // Health check
  '/api/auth/csrf', // CSRF token endpoint
]

/**
 * Route'un CSRF korumasından muaf olup olmadığını kontrol et
 */
export function isCSRFExempt(pathname: string): boolean {
  return CSRF_EXEMPT_ROUTES.some((route) => pathname.startsWith(route))
}
