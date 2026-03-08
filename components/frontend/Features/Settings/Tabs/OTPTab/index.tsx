'use client'

import { useEffect, useState } from 'react'
import { OTPMethodEnum } from '@/types/user/UserSecurityTypes'
import { SafeUserSecurity, SafeUserSecurityDefault } from '@/types/user/UserSecurityTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons'

import OTPMethodCard from './partials/OTPMethodCard'
import OTPConfirmModal from './partials/OTPConfirmModal'
import TOTPSetupModal from './partials/TOTPSetupModal'
import { useOTP } from './hooks/useOTP'
import { useTOTP } from './hooks/useTOTP'

export default function OTPTab() {
  const { t } = useTranslation()
  const [userSecurity, setUserSecurity] = useState<SafeUserSecurity>(SafeUserSecurityDefault)
  const [loading, setLoading] = useState(true)

  /* ============ FETCH USER SECURITY ============ */
  useEffect(() => {
    const fetchUserSecurity = async () => {
      try {
        const res = await axiosInstance.get('/api/auth/me/security')
        setUserSecurity(res.data.userSecurity)
      } catch (err) {
        console.error('Kullanıcı güvenliği alınamadı', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserSecurity()
  }, [])

  const otp = useOTP(userSecurity, setUserSecurity)
  const totp = useTOTP(userSecurity, setUserSecurity)

  const handleCardClick = async (
    method: (typeof OTPMethodEnum.Enum)[keyof typeof OTPMethodEnum.Enum]
  ) => {
    if (method === OTPMethodEnum.Enum.TOTP_APP) {
      const enabled = userSecurity.otpMethods.includes(method)
      if (!enabled) {
        await totp.openTotpSetup()
      } else {
        totp.openTotpDisableModal()
      }
      return
    }

    otp.openModalForMethod(method)
  }

  const enabledCount = userSecurity.otpMethods.length

  return (
    <>
      <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">
        {/* 2FA Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faShieldHalved} className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-base-content">{t('settings.otp')}</h2>
              {!loading && (
                <span
                  className={`badge badge-sm ${
                    enabledCount > 0 ? 'badge-primary' : 'badge-ghost border border-base-300'
                  }`}
                >
                  {enabledCount > 0 ? `${enabledCount} active` : 'Not configured'}
                </span>
              )}
            </div>
            <p className="text-sm text-base-content/50 mt-0.5">
              Enable verification methods to add an extra layer of security to your account.
            </p>
          </div>
        </div>

        {/* Method cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-base-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(OTPMethodEnum.Enum).map((method) => (
              <OTPMethodCard
                key={method}
                method={method}
                enabled={userSecurity.otpMethods.includes(method)}
                onClick={() => handleCardClick(method)}
              />
            ))}
          </div>
        )}
      </div>

      {/* EMAIL / SMS OTP modal */}
      <OTPConfirmModal
        open={otp.modalOpen}
        otpSent={otp.otpSent}
        otpCode={otp.otpCode}
        sendingOtp={otp.sendingOtp}
        verifying={otp.verifying}
        otpInputRef={otp.otpInputRef as React.RefObject<HTMLInputElement>}
        onSendOtp={otp.sendOtp}
        onVerify={otp.verifyAndApply}
        onChangeCode={otp.setOtpCode}
        onClose={otp.closeOtpModal}
        method={otp.pendingMethod}
      />

      {/* TOTP setup modal */}
      <TOTPSetupModal
        open={totp.totpModalOpen}
        otpauthUrl={totp.totpOtpauthUrl}
        code={totp.totpCode}
        loadingSetup={totp.totpLoadingSetup}
        verifying={totp.totpVerifying}
        backupCodes={totp.totpBackupCodes}
        onStartSetup={totp.startTotpSetup}
        onVerify={totp.verifyTotpEnable}
        onChangeCode={totp.setTotpCode}
        onClose={totp.closeTotpModal}
      />

      {/* TOTP disable modal */}
      <OTPConfirmModal
        open={totp.totpDisableModalOpen}
        otpSent={true}
        otpCode={totp.totpDisableCode}
        sendingOtp={false}
        verifying={totp.totpVerifying}
        otpInputRef={undefined as unknown as React.RefObject<HTMLInputElement>}
        onSendOtp={() => {}}
        onVerify={totp.disableTOTP}
        onChangeCode={totp.setTotpDisableCode}
        onClose={totp.closeTotpDisableModal}
        method={OTPMethodEnum.Enum.TOTP_APP}
      />
    </>
  )
}
