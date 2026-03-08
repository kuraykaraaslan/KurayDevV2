'use client'

import { useEffect, useState, useCallback } from 'react'
import { startRegistration } from '@simplewebauthn/browser'
import { useTranslation } from 'react-i18next'

interface PasskeyInfo {
  credentialId: string
  label?: string
  createdAt: string
  lastUsedAt?: string | null
  transports?: string[]
}

/**
 * PasskeyManager — shown inside the user settings / security page.
 * Allows listing, registering and removing passkeys.
 */
export default function PasskeyManager() {
  const { t } = useTranslation()
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([])
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchPasskeys = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/passkey', { credentials: 'include' })
      if (res.ok) {
        const data = (await res.json()) as { passkeys: PasskeyInfo[] }
        setPasskeys(data.passkeys)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchPasskeys()
  }, [fetchPasskeys])

  const handleRegister = async () => {
    if (!window.PublicKeyCredential) {
      setError(t('auth.passkey.not_supported'))
      return
    }

    setRegLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // 1. Get creation options
      const optRes = await fetch('/api/auth/passkey/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include',
      })

      if (!optRes.ok) {
        const { message } = (await optRes.json()) as { message: string }
        throw new Error(message)
      }

      const { options } = (await optRes.json()) as { options: Record<string, unknown> }

      // 2. Prompt the browser authenticator
      const registrationResponse = await startRegistration({ optionsJSON: options as unknown as Parameters<typeof startRegistration>[0]['optionsJSON'] })

      // 3. Verify on the server
      const verifyRes = await fetch('/api/auth/passkey/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: registrationResponse, label: label || undefined }),
        credentials: 'include',
      })

      if (!verifyRes.ok) {
        const { message } = (await verifyRes.json()) as { message: string }
        throw new Error(message)
      }

      setSuccess(t('auth.passkey.register_success'))
      setLabel('')
      await fetchPasskeys()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.passkey.register_failed')
      if (!msg.includes('cancel') && msg !== 'NotAllowedError') {
        setError(msg)
      }
    } finally {
      setRegLoading(false)
    }
  }

  const handleDelete = async (credentialId: string) => {
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/auth/passkey', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId }),
        credentials: 'include',
      })

      if (!res.ok) {
        const { message } = (await res.json()) as { message: string }
        throw new Error(message)
      }

      setSuccess(t('auth.passkey.delete_success'))
      await fetchPasskeys()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.passkey.delete_failed'))
    }
  }

  return (
    <section aria-labelledby="passkey-heading" className="flex flex-col gap-4">
      <h2 id="passkey-heading" className="text-lg font-semibold">
        {t('auth.passkey.manage_title')}
      </h2>

      {/* Registration form */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('auth.passkey.label_placeholder')}
          maxLength={64}
          className="input input-bordered flex-1"
          aria-label={t('auth.passkey.label_placeholder')}
        />
        <button
          type="button"
          onClick={handleRegister}
          disabled={regLoading}
          className="btn btn-primary gap-2"
        >
          {regLoading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : null}
          {t('auth.passkey.register_button')}
        </button>
      </div>

      {/* Feedback */}
      {error && <p role="alert" className="text-error text-sm">{error}</p>}
      {success && <p role="status" className="text-success text-sm">{success}</p>}

      {/* Passkey list */}
      {loading ? (
        <span className="loading loading-spinner loading-md" />
      ) : passkeys.length === 0 ? (
        <p className="text-base-content/60 text-sm">{t('auth.passkey.no_passkeys')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {passkeys.map((pk) => (
            <li
              key={pk.credentialId}
              className="flex items-center justify-between rounded-lg border border-base-300 px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-sm">{pk.label ?? pk.credentialId.slice(0, 12) + '…'}</span>
                <span className="text-xs text-base-content/50">
                  {t('auth.passkey.created_at')}: {new Date(pk.createdAt).toLocaleDateString()}
                  {pk.lastUsedAt
                    ? ` · ${t('auth.passkey.last_used')}: ${new Date(pk.lastUsedAt).toLocaleDateString()}`
                    : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(pk.credentialId)}
                className="btn btn-ghost btn-sm text-error"
                aria-label={`${t('auth.passkey.delete_button')} ${pk.label ?? pk.credentialId}`}
              >
                {t('auth.passkey.delete_button')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
