'use client'

import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'

interface PushWarningBannerProps {
  pushDenied: boolean
  pushLoading: boolean
  onSubscribe: () => void
}

export function PushWarningBanner({ pushDenied, pushLoading, onSubscribe }: PushWarningBannerProps) {
  const { t } = useTranslation()
  return (
    <div className="px-4 py-3 bg-warning/10 border-b border-warning/20">
      <div className="flex items-start gap-2.5">
        <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-warning mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          {pushDenied ? (
            <>
              <p className="text-xs font-semibold text-warning">{t('admin.notifications.push_blocked_title')}</p>
              <p className="text-[11px] text-base-content/60 mt-0.5 leading-snug">
                {t('admin.notifications.push_blocked_description')}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-warning">{t('admin.notifications.push_off_title')}</p>
              <p className="text-[11px] text-base-content/60 mt-0.5 leading-snug">
                {t('admin.notifications.push_off_description')}
              </p>
              <button
                type="button"
                onClick={onSubscribe}
                disabled={pushLoading}
                className="mt-1.5 text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {pushLoading ? t('admin.notifications.enabling') : t('admin.notifications.enable_now')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
