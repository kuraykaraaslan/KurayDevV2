'use client'

import { useState } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'
import { useTranslation } from 'react-i18next'
import type { SafeUser } from '@/types/user/UserTypes'

interface PasskeyLoginButtonProps {
  /** Pre-fill the email so options are scoped to this user's credentials.  */
  email?: string
  /** Called on successful authentication with the resolved user. */
  onSuccess?: (user: SafeUser) => void
}

/**
 * PasskeyLoginButton — displayed on the login page as an alternative to
 * the password form.  Mirrors the SSO login button pattern in style.
 */
export default function PasskeyLoginButton({ email, onSuccess }: PasskeyLoginButtonProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    if (!window.PublicKeyCredential) {
      setError(t('auth.passkey.not_supported'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Get options from the server
      const optRes = await fetch('/api/auth/passkey/authenticate/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      })

      if (!optRes.ok) {
        const { message } = (await optRes.json()) as { message: string }
        throw new Error(message)
      }

      const { options } = (await optRes.json()) as { options: Record<string, unknown> }

      // 2. Prompt the browser authenticator
      const assertionResponse = await startAuthentication({ optionsJSON: options as unknown as Parameters<typeof startAuthentication>[0]['optionsJSON'] })

      // 3. Send assertion to the server for verification
      const verifyRes = await fetch('/api/auth/passkey/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: assertionResponse, email }),
        credentials: 'include',
      })

      if (!verifyRes.ok) {
        const { message } = (await verifyRes.json()) as { message: string }
        throw new Error(message)
      }

      const { user } = (await verifyRes.json()) as { user: SafeUser }
      onSuccess?.(user)
      // Let the caller handle navigation (mirrors SSO callback pattern)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.passkey.auth_failed')
      // Ignore user-cancelled gesture
      if (msg !== 'NotAllowedError' && !msg.includes('cancel')) {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="btn btn-outline btn-primary w-full gap-2"
        aria-label={t('auth.passkey.login_button')}
      >
        {/* Fingerprint / key icon — inline SVG to avoid extra dependency */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path d="M12 11c0-1.1.9-2 2-2s2 .9 2 2v3" />
          <path d="M7 11V9a5 5 0 0 1 9.9-1" />
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <line x1="12" y1="16" x2="12" y2="18" />
        </svg>
        {loading ? <span className="loading loading-spinner loading-sm" /> : t('auth.passkey.login_button')}
      </button>

      {error && (
        <p role="alert" className="text-error text-xs text-center">
          {error}
        </p>
      )}
    </div>
  )
}
