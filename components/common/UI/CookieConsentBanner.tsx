'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@/libs/i18n/Link'
import { useCookieConsentStore } from '@/libs/zustand/useCookieConsentStore'

interface Props {
  privacyPolicyHref?: string
}

export default function CookieConsentBanner({ privacyPolicyHref = '/privacy-policy' }: Props) {
  const { t } = useTranslation()
  const { status, accept, decline } = useCookieConsentStore()
  const [mounted, setMounted] = useState(false)

  // Prevent SSR mismatch — only render after hydration
  useEffect(() => {
    setMounted(true)
  }, []) // mount-only: intentional

  if (!mounted || status !== undefined) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t('cookieConsent.title')}
      className="fixed bottom-0 left-0 right-0 z-[9998] p-4 md:p-6 animate-[slideUp_0.3s_ease-out]"
    >
      <div className="max-w-4xl mx-auto bg-base-200 border border-base-300 rounded-2xl shadow-2xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Icon + Text */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base-content text-sm md:text-base mb-1">
              {t('cookieConsent.title')}
            </p>
            <p className="text-base-content/70 text-xs md:text-sm leading-relaxed">
              {t('cookieConsent.message')}{' '}
              <Link
                href={privacyPolicyHref}
                className="text-primary underline underline-offset-2 hover:text-primary-focus transition-colors"
              >
                {t('cookieConsent.privacy_policy')}
              </Link>
              .
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-row items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={decline}
              className="btn btn-ghost btn-sm"
            >
              {t('cookieConsent.decline')}
            </button>
            <button
              type="button"
              onClick={accept}
              className="btn btn-primary btn-sm"
            >
              {t('cookieConsent.accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
