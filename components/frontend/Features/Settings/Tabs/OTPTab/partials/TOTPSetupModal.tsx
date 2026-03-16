'use client'

import { useEffect, useState } from 'react'
import HeadlessModal from '@/components/common/Modal'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheck,
  faCopy,
  faDownload,
} from '@fortawesome/free-solid-svg-icons'

type Props = {
  open: boolean
  otpauthUrl?: string | null
  code: string
  loadingSetup: boolean
  verifying: boolean
  backupCodes?: string[]
  onStartSetup: () => void
  onVerify: () => void
  onChangeCode: (v: string) => void
  onClose: () => void
}

export default function TOTPSetupModal(props: Props) {
  const { t } = useTranslation()
  const {
    open,
    otpauthUrl,
    code,
    loadingSetup,
    verifying,
    backupCodes = [],
    onVerify,
    onChangeCode,
    onClose,
  } = props

  const [acknowledged, setAcknowledged] = useState(false)
  const [copyDone, setCopyDone] = useState(false)

  useEffect(() => {
    if (!open) {
      setAcknowledged(false)
      setCopyDone(false)
    }
  }, [open])

  const isShowingBackupCodes = backupCodes.length > 0
  const step = isShowingBackupCodes ? 3 : otpauthUrl ? 2 : 1

  const qrSrc = otpauthUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=176x176&data=${encodeURIComponent(otpauthUrl)}`
    : null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopyDone(true)
    setAcknowledged(true)
    setTimeout(() => setCopyDone(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
    setAcknowledged(true)
  }

  const stepLabels = [
    t('settings.totp_setup.title'),
    t('settings.totp_setup.enter_code'),
    t('settings.totp_setup.backup_codes_title'),
  ]

  return (
    <HeadlessModal
      open={open}
      onClose={onClose}
      title={
        isShowingBackupCodes
          ? t('settings.totp_setup.backup_codes_title')
          : t('settings.totp_setup.title')
      }
      size={isShowingBackupCodes ? 'md' : 'sm'}
      closeOnBackdrop={false}
      closeOnEsc={false}
    >
      {/* Step progress dots */}
      <div className="flex justify-center items-center gap-2 mb-5">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                  s < step
                    ? 'bg-primary border-primary text-primary-content'
                    : s === step
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-base-300 text-base-content/30 bg-base-100'
                }`}
              >
                {s < step ? (
                  <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                ) : (
                  s
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block whitespace-nowrap ${
                  s === step ? 'text-primary' : s < step ? 'text-base-content/60' : 'text-base-content/30'
                }`}
              >
                {stepLabels[i]}
              </span>
            </div>
            {i < 2 && (
              <div
                className={`w-6 h-0.5 mb-4 rounded-full transition-all duration-300 ${
                  step > s ? 'bg-primary' : 'bg-base-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {/* ═══════════ STEP 3 — BACKUP CODES ═══════════ */}
        {isShowingBackupCodes ? (
          <>
            <div className="alert alert-warning py-3">
              <span className="text-sm">{t('settings.totp_setup.warning')}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((c, idx) => (
                <div
                  key={idx}
                  className="font-mono text-sm text-center py-2.5 px-3 bg-base-200 rounded-lg select-all tracking-widest border border-base-300"
                >
                  {c}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={handleCopy} className="btn btn-outline btn-sm flex-1 gap-2">
                <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                {copyDone ? '✓ Copied!' : t('settings.totp_setup.copy_codes')}
              </button>
              <button onClick={handleDownload} className="btn btn-outline btn-sm flex-1 gap-2">
                <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5" />
                {t('settings.totp_setup.download_codes')}
              </button>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-base-200/60 transition-colors">
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-sm mt-0.5 flex-shrink-0"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              <span className="text-sm text-base-content/70 leading-snug">
                {t('settings.totp_setup.i_have_saved')}
              </span>
            </label>

            <button onClick={onClose} disabled={!acknowledged} className="btn btn-primary w-full">
              Done
            </button>
          </>
        ) : (
          /* ══════════ STEPS 1 & 2 — SETUP & VERIFY ══════════ */
          <>
            {/* Loading spinner while generating QR */}
            {loadingSetup && !otpauthUrl && (
              <div className="flex flex-col items-center gap-3 py-8">
                <span className="loading loading-spinner loading-md text-primary" />
                <p className="text-sm text-base-content/50">Setting up authenticator...</p>
              </div>
            )}

            {otpauthUrl && (
              <>
                {/* QR code */}
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl border-2 border-base-300 shadow-sm inline-block">
                    {qrSrc && (
                      <img
                        src={qrSrc}
                        alt="Authenticator QR"
                        width={176}
                        height={176}
                        className="block"
                      />
                    )}
                  </div>
                </div>

                {/* Manual entry */}
                <details className="group">
                  <summary className="cursor-pointer text-xs text-center text-base-content/40 hover:text-base-content/70 transition-colors list-none">
                    ▸ Can&apos;t scan? Enter secret manually
                  </summary>
                  <div className="mt-2 p-3 bg-base-200 rounded-lg font-mono text-xs break-all select-all text-base-content/60 border border-base-300">
                    {otpauthUrl}
                  </div>
                </details>

                <div className="divider my-0 text-xs text-base-content/40">
                  {t('settings.totp_setup.enter_code')}
                </div>

                <input
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => onChangeCode(e.target.value.replace(/\D/g, ''))}
                  className="input input-bordered w-full text-center text-3xl tracking-[0.6em] font-mono h-14 focus:border-primary"
                  placeholder={t('settings.otp_confirm.code_placeholder')}
                />

                <button
                  onClick={onVerify}
                  disabled={verifying || code.length !== 6}
                  className="btn btn-primary w-full"
                >
                  {verifying ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      {t('settings.otp_confirm.verifying')}
                    </>
                  ) : (
                    t('settings.totp_setup.confirm_setup')
                  )}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </HeadlessModal>
  )
}
