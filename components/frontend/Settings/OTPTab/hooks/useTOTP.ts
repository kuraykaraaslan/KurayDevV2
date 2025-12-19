import { useState } from 'react';
import axiosInstance from '@/libs/axios';
import { toast } from 'react-toastify';
import { OTPMethodEnum } from '@/types/UserSecurityTypes';
import { SafeUserSecurity } from '@/types/UserSecurityTypes';

export function useTOTP(userSecurity: SafeUserSecurity, onUserSecurityUpdate: (updated: SafeUserSecurity) => void) {
  
  /* ============ STATE ============ */
  const [totpModalOpen, setTotpModalOpen] = useState(false);
  const [totpOtpauthUrl, setTotpOtpauthUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [totpLoadingSetup, setTotpLoadingSetup] = useState(false);
  const [totpVerifying, setTotpVerifying] = useState(false);

  /* ============ TOTP HANDLERS ============ */
  const openTotpSetup = async () => {
    setTotpModalOpen(true);
    setTotpCode('');
    setTotpOtpauthUrl(null);
    await startTotpSetup();
  };

  const closeTotpModal = () => {
    setTotpModalOpen(false);
  };

  const startTotpSetup = async () => {
    try {
      setTotpLoadingSetup(true);
      const res = await axiosInstance.post('/api/auth/totp/setup');
      setTotpOtpauthUrl(res.data.otpauthUrl);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'TOTP kurulumu başlatılamadı');
      setTotpModalOpen(false);
    } finally {
      setTotpLoadingSetup(false);
    }
  };

  const verifyTotpEnable = async () => {
    if (!totpCode) return;

    try {
      setTotpVerifying(true);
      const verifyRes = await axiosInstance.post('/api/auth/totp/enable', { otpToken: totpCode });

      if (!verifyRes.data?.success) {
        toast.error('TOTP doğrulanamadı');
        return;
      }

      const updated = {
        ...userSecurity,
        otpMethods: [...new Set([...userSecurity.otpMethods, OTPMethodEnum.Enum.TOTP_APP])],
      };

      onUserSecurityUpdate(updated);

      toast.success('TOTP etkinleştirildi');
      closeTotpModal();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'TOTP etkinleştirilemedi');
    } finally {
      setTotpVerifying(false);
    }
  };

  const disableTOTP = async () => {
    try {
      setTotpVerifying(true);

      const updated = {
        ...userSecurity,
        otpMethods: userSecurity.otpMethods.filter(m => m !== OTPMethodEnum.Enum.TOTP_APP),
      };

      onUserSecurityUpdate(updated);

      toast.success('TOTP devre dışı bırakıldı');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'TOTP devre dışı bırakılamadı');
    } finally {
      setTotpVerifying(false);
    }
  };

  return {
    // State
    totpModalOpen,
    totpOtpauthUrl,
    totpCode,
    totpLoadingSetup,
    totpVerifying,

    // Handlers
    openTotpSetup,
    closeTotpModal,
    startTotpSetup,
    verifyTotpEnable,
    disableTOTP,
    setTotpCode,
  };
}
