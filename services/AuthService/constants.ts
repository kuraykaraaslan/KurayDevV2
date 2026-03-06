// ── JWT / Token constants ───────────────────────────────────────────
export const APPLICATION_DOMAIN = process.env.NEXT_PUBLIC_APPLICATION_DOMAIN || 'kuray.dev'
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET
export const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '1h'
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET
export const REFRESH_TOKEN_EXPIRES_IN: string | number = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
/** Seconds before a refresh token becomes valid (prevents immediate reuse). */
export const REFRESH_TOKEN_NOT_BEFORE = 5

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error('Missing JWT secrets in environment variables.')
}

// ── Bcrypt constants ────────────────────────────────────────────────
export const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10')

// ── Session constants ───────────────────────────────────────────────
export const SESSION_EXPIRY_MS = parseInt(process.env.SESSION_EXPIRY_MS || `${1000 * 60 * 60 * 24 * 7}`)   // 7 days
export const SESSION_REDIS_EXPIRY_MS = parseInt(process.env.SESSION_REDIS_EXPIRY_MS || `${1000 * 60 * 30}`) // 30 min

if (isNaN(SESSION_EXPIRY_MS)) {
  throw new Error('Invalid SESSION_EXPIRY_MS value in environment variables.')
}

if (isNaN(SESSION_REDIS_EXPIRY_MS)) {
  throw new Error('Invalid SESSION_REDIS_EXPIRY_MS value in environment variables.')
}

// ── OTP constants ───────────────────────────────────────────────────
export const OTP_EXPIRY_SECONDS = parseInt(process.env.OTP_EXPIRY_SECONDS || '600')   // 10 min
export const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6')
export const OTP_RATE_LIMIT_SECONDS = parseInt(process.env.OTP_RATE_LIMIT_SECONDS || '60')
export const OTP_RATE_LIMIT_MAX = 5

// ── TOTP constants ──────────────────────────────────────────────────
export const TOTP_STEP_SECONDS = parseInt(process.env.TOTP_STEP_SECONDS || '30')
export const TOTP_WINDOW = parseInt(process.env.TOTP_WINDOW || '1')
export const TOTP_DIGITS = parseInt(process.env.OTP_LENGTH || '6')
export const TOTP_SETUP_EXPIRY_SECONDS = parseInt(process.env.TOTP_SETUP_EXPIRY_SECONDS || '600')
export const TOTP_ISSUER = process.env.TOTP_ISSUER || 'Relatia'

// ── Password reset constants ────────────────────────────────────────
export const RESET_TOKEN_EXPIRY_SECONDS = parseInt(process.env.RESET_TOKEN_EXPIRY_SECONDS || '3600') // 1 hour
export const RESET_TOKEN_LENGTH = Math.max(4, parseInt(process.env.RESET_TOKEN_LENGTH || '6'))
export const RESET_RATE_LIMIT_MAX = 5
export const RESET_RATE_WINDOW_SECONDS = 60

// ── API Key constants ───────────────────────────────────────────────
export const API_KEY_REDIS_TTL_SECONDS = parseInt(process.env.API_KEY_REDIS_TTL_SECONDS || '300') // 5 min

// ── Redis key patterns ──────────────────────────────────────────────
export const SESSION_CACHE_KEY = (userId: string, tokenHash: string) => `auth:session:${userId}:${tokenHash}`
export const API_KEY_CACHE_KEY = (keyHash: string) => `auth:apikey:${keyHash}`
export const OTP_KEY = (action: string, sessionId: string, method: string) => `auth:otp:${action}:${sessionId}:${method}`
export const OTP_RATE_KEY = (sessionId: string, method: string) => `auth:otp:rate:${sessionId}:${method}`
export const OTP_CODE_KEY = (sessionId: string, method: string, action: string) => `auth:otp:code:${sessionId}:${method}:${action}`
export const TOTP_KEY = (action: string, sessionId: string) => `auth:totp:${action}:${sessionId}`
export const RESET_PASSWORD_KEY = (email: string) => `auth:reset-password:${email.toLowerCase()}`
export const RESET_PASSWORD_RATE_KEY = (email: string) => `auth:reset-password-rate:${email.toLowerCase()}`
