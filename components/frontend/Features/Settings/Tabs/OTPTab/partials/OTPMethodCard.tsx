import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope,
  faMobileScreen,
  faShieldHalved,
  faCheck,
} from '@fortawesome/free-solid-svg-icons'
import { OTPMethod } from '@/types/user/UserSecurityTypes'
import { useTranslation } from 'react-i18next'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

const METHOD_META: Record<string, { icon: IconDefinition; title: string; description: string }> = {
  EMAIL: {
    icon: faEnvelope,
    title: 'Email',
    description: 'Receive a one-time code via your email address',
  },
  SMS: {
    icon: faMobileScreen,
    title: 'SMS',
    description: 'Receive a one-time code via text message',
  },
  TOTP_APP: {
    icon: faShieldHalved,
    title: 'Authenticator App',
    description: 'Use Google Authenticator or compatible TOTP app',
  },
}

type Props = {
  method: OTPMethod
  enabled: boolean
  onClick: () => void
}

export default function OTPMethodCard({ method, enabled, onClick }: Props) {
  const { t } = useTranslation()
  const meta = METHOD_META[method] ?? { icon: faShieldHalved, title: method, description: '' }

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick()
      }}
      className={`
        relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary/40
        ${
          enabled
            ? 'border-primary/60 bg-primary/5 shadow-sm'
            : 'border-base-300 bg-base-100 hover:border-base-content/20 hover:bg-base-200/50'
        }
      `}
    >
      <div className="flex items-center gap-4">
        {/* Method icon */}
        <div
          className={`
            w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200
            ${enabled ? 'bg-primary text-primary-content shadow-sm' : 'bg-base-200 text-base-content/50'}
          `}
        >
          <FontAwesomeIcon icon={meta.icon} className="w-5 h-5" />
        </div>

        {/* Title + description */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-base-content leading-tight">{meta.title}</p>
          <p className="text-xs text-base-content/50 mt-0.5 leading-snug">{meta.description}</p>
        </div>

        {/* Status indicator */}
        {enabled ? (
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-primary-content" />
            </div>
            <span className="text-xs font-medium text-primary">
              {t('settings.otp_method_card.active')}
            </span>
          </div>
        ) : (
          <div className="flex-shrink-0">
            <span className="text-xs text-base-content/40">
              {t('settings.otp_method_card.inactive')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
