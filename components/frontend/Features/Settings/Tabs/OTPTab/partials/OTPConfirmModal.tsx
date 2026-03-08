import HeadlessModal from '@/components/admin/UI/Modal'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope,
  faMobileScreen,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons'
import { OTPMethod, OTPMethodEnum } from '@/types/user/UserSecurityTypes'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

const METHOD_ICON: Record<string, IconDefinition> = {
  EMAIL: faEnvelope,
  SMS: faMobileScreen,
  TOTP_APP: faShieldHalved,
}

const METHOD_LABEL: Record<string, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  TOTP_APP: 'Authenticator App',
}

type Props = {
  open: boolean
  otpSent: boolean
  otpCode: string
  sendingOtp: boolean
  verifying: boolean
  otpInputRef: React.RefObject<HTMLInputElement>
  onSendOtp: () => void
  onVerify: () => void
  onChangeCode: (v: string) => void
  onClose: () => void
  method?: OTPMethod | null
  availableMethods?: OTPMethod[]
  onMethodChange?: (method: OTPMethod) => void
}

export default function OTPConfirmModal(props: Props) {
  const { t } = useTranslation()
  const {
    open,
    otpSent,
    otpCode,
    sendingOtp,
    verifying,
    otpInputRef,
    onSendOtp,
    onVerify,
    onChangeCode,
    onClose,
    method,
    availableMethods = [],
    onMethodChange,
  } = props

  const isTotp = method === OTPMethodEnum.Enum.TOTP_APP
  const showInput = isTotp || otpSent
  const methodIcon = method ? (METHOD_ICON[method] ?? faShieldHalved) : faShieldHalved
  const methodLabel = method ? (METHOD_LABEL[method] ?? method) : ''

  return (
    <HeadlessModal
      open={open}
      onClose={onClose}
      title={t('settings.otp_confirm.title')}
      size="sm"
      closeOnBackdrop={false}
      closeOnEsc={false}
    >
      <div className="space-y-4">
        {/* Method selector tabs */}
        {availableMethods.length > 1 && onMethodChange && (
          <div className="flex gap-1.5 flex-wrap">
            {availableMethods.map((m) => (
              <button
                key={m}
                onClick={() => onMethodChange(m)}
                className={`btn btn-xs gap-1.5 transition-all ${
                  m === method ? 'btn-primary' : 'btn-ghost border border-base-300'
                }`}
              >
                <FontAwesomeIcon icon={METHOD_ICON[m] ?? faShieldHalved} className="w-3 h-3" />
                {METHOD_LABEL[m] ?? m}
              </button>
            ))}
          </div>
        )}

        {/* Method header */}
        {method && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/70">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={methodIcon} className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-base-content leading-tight">{methodLabel}</p>
              {isTotp && (
                <p className="text-xs text-base-content/50 mt-0.5">
                  {t('settings.otp_confirm.totp_hint')}
                </p>
              )}
              {!isTotp && otpSent && (
                <p className="text-xs text-success mt-0.5">✓ Code sent to your {methodLabel}</p>
              )}
              {!isTotp && !otpSent && (
                <p className="text-xs text-base-content/50 mt-0.5">
                  A verification code will be sent to you
                </p>
              )}
            </div>
          </div>
        )}

        {/* Send step (EMAIL / SMS only) */}
        {!isTotp && !otpSent && (
          <button
            onClick={onSendOtp}
            disabled={sendingOtp}
            className="btn btn-primary w-full"
          >
            {sendingOtp ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                {t('settings.otp_confirm.sending')}
              </>
            ) : (
              t('settings.otp_confirm.send_code')
            )}
          </button>
        )}

        {/* Input step */}
        {showInput && (
          <>
            <input
              ref={otpInputRef}
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otpCode}
              onChange={(e) => onChangeCode(e.target.value.replace(/\D/g, ''))}
              className="input input-bordered w-full text-center text-3xl tracking-[0.6em] font-mono h-14 focus:border-primary"
              placeholder={t('settings.otp_confirm.code_placeholder')}
            />

            <button
              onClick={onVerify}
              disabled={verifying || otpCode.length !== 6}
              className="btn btn-primary w-full"
            >
              {verifying ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  {t('settings.otp_confirm.verifying')}
                </>
              ) : (
                t('settings.otp_confirm.verify')
              )}
            </button>

            {/* Resend link (EMAIL / SMS only) */}
            {!isTotp && otpSent && (
              <div className="text-center">
                <button
                  onClick={onSendOtp}
                  disabled={sendingOtp}
                  className="text-xs text-primary hover:underline underline-offset-2 disabled:opacity-40 disabled:no-underline"
                >
                  {sendingOtp
                    ? t('settings.otp_confirm.sending')
                    : t('settings.otp_confirm.resend')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </HeadlessModal>
  )
}
