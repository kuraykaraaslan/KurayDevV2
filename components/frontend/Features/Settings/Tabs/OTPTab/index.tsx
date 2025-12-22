'use client';

import { useEffect, useState } from 'react';
import { OTPMethodEnum } from '@/types/UserSecurityTypes';
import { SafeUserSecurity, SafeUserSecurityDefault } from '@/types/UserSecurityTypes';
import axiosInstance from '@/libs/axios';
import { useTranslation } from 'react-i18next';

import OTPMethodCard from './partials/OTPMethodCard';
import OTPConfirmModal from './partials/OTPConfirmModal';
import TOTPSetupModal from './partials/TOTPSetupModal';
import { useOTP } from './hooks/useOTP';
import { useTOTP } from './hooks/useTOTP';

export default function OTPTab() {
  const { t } = useTranslation();
  const [userSecurity, setUserSecurity] = useState<SafeUserSecurity>(SafeUserSecurityDefault);

  /* ============ FETCH USER SECURITY ============ */
  useEffect(() => {
    const fetchUserSecurity = async () => {
      try {
        const res = await axiosInstance.get('/api/auth/me/security');
        setUserSecurity(res.data.userSecurity);
      } catch (err) {
        console.error('Kullanıcı güvenliği alınamadı', err);
      }
    };

    fetchUserSecurity();
  }, []);

  const otp = useOTP(userSecurity, setUserSecurity);
  const totp = useTOTP(userSecurity, setUserSecurity);

  const handleCardClick = async (method: typeof OTPMethodEnum.Enum[keyof typeof OTPMethodEnum.Enum]) => {
    if (method === OTPMethodEnum.Enum.TOTP_APP) {
      const enabled = userSecurity.otpMethods.includes(method);
      if (!enabled) {
        await totp.openTotpSetup();
      } else {
        // Open disable modal to verify TOTP code
        totp.openTotpDisableModal();
      }
      return;
    }

    // Email/SMS flow
    otp.openModalForMethod(method);
  };

  return (
    <>
      <div className="bg-base-100 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-bold">{t('frontend.settings.otp')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(OTPMethodEnum.Enum).map(method => (
            <OTPMethodCard
              key={method}
              method={method}
              enabled={userSecurity.otpMethods.includes(method)}
              onClick={() => handleCardClick(method)}
            />
          ))}
        </div>
      </div>

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
      />

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

      <OTPConfirmModal
        open={totp.totpDisableModalOpen}
        otpSent={true}
        otpCode={totp.totpDisableCode}
        sendingOtp={false}
        verifying={totp.totpVerifying}
        otpInputRef={undefined as any}
        onSendOtp={() => {}}
        onVerify={totp.disableTOTP}
        onChangeCode={totp.setTotpDisableCode}
        onClose={totp.closeTotpDisableModal}
      />
    </>
  );
}

