'use client'

import { useEffect, useState } from 'react'
import HeadlessModal from '@/components/admin/UI/Modal'
import { useTranslation } from 'react-i18next'

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
    onStartSetup,
    onVerify,
    onChangeCode,
    onClose,
  } = props

  const [acknowledged, setAcknowledged] = useState(false)

  // reset state when modal re-opens
  useEffect(() => {
    if (!open) {
      setAcknowledged(false)
    }
  }, [open])

  const isShowingBackupCodes = backupCodes.length > 0

  const qrSrc = otpauthUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        otpauthUrl
      )}`
    : null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(backupCodes.join('\n'))
    setAcknowledged(true)
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

  return (
    <HeadlessModal
      open={open}
      onClose={onClose}
      title={
        isShowingBackupCodes
          ? t('frontend.settings.totp_setup.backup_codes_title')
          : t('frontend.settings.totp_setup.title')
      }
      size={isShowingBackupCodes ? 'md' : 'sm'}
      closeOnBackdrop={false}
      closeOnEsc={false}
    >
      <div className="space-y-4">
        {/* ================= BACKUP CODES FLOW ================= */}
        {isShowingBackupCodes ? (
          <>
            <div className="alert alert-warning">
              <span>{t('frontend.settings.totp_setup.warning')}</span>
            </div>

            <div className="bg-base-200 p-4 rounded-lg space-y-2">
              {backupCodes.map((c, idx) => (
                <div key={idx} className="font-mono text-sm select-all p-2 bg-base-100 rounded">
                  {c}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={handleCopy} className="btn btn-outline w-full">
                {t('frontend.settings.totp_setup.copy_codes')}
              </button>

              <button onClick={handleDownload} className="btn btn-outline w-full">
                {t('frontend.settings.totp_setup.download_codes')}
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              <span className="text-sm">{t('frontend.settings.totp_setup.i_have_saved')}</span>
            </label>

            <button onClick={onClose} disabled={!acknowledged} className="btn btn-primary w-full">
              OK
            </button>
          </>
        ) : (
          /* ================= SETUP FLOW ================= */
          <>
            {!otpauthUrl && (
              <button
                onClick={onStartSetup}
                disabled={loadingSetup}
                className="btn btn-primary w-full"
              >
                {loadingSetup
                  ? t('frontend.loading')
                  : t('frontend.settings.totp_setup.start_setup')}
              </button>
            )}

            {otpauthUrl && (
              <>
                <div className="flex flex-col items-center gap-3">
                  {qrSrc && (
                    <img
                      src={qrSrc}
                      alt="Authenticator QR"
                      className="rounded border border-base-300"
                      width={180}
                      height={180}
                    />
                  )}

                  <p className="text-sm text-base-content/70 text-center">
                    {t('frontend.settings.totp_setup.enter_code')}
                  </p>

                  <div className="textarea textarea-bordered w-full text-xs break-all select-all">
                    {otpauthUrl}
                  </div>
                </div>

                <div className="divider my-2" />

                <input
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => onChangeCode(e.target.value)}
                  className="input input-bordered w-full text-center text-2xl tracking-widest font-mono"
                  placeholder={t('frontend.settings.otp_confirm.code_placeholder')}
                />

                <button
                  onClick={onVerify}
                  disabled={verifying || code.length !== 6}
                  className="btn btn-primary w-full"
                >
                  {verifying
                    ? t('frontend.settings.otp_confirm.verifying')
                    : t('frontend.settings.totp_setup.confirm_setup')}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </HeadlessModal>
  )
}
