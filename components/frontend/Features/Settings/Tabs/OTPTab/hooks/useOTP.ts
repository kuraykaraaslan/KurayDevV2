import { useRef, useState } from 'react';
import { OTPMethodEnum, OTPMethod, OTPAction } from '@/types/user/UserSecurityTypes';
import { SafeUserSecurity } from '@/types/user/UserSecurityTypes';
import axiosInstance from '@/libs/axios';
import { toast } from 'react-toastify';

export function useOTP(userSecurity: SafeUserSecurity, onUserSecurityUpdate: (updated: SafeUserSecurity) => void) {

  /* ============ STATE ============ */
  const [pendingMethod, setPendingMethod] = useState<OTPMethod | null>(null);
  const [pendingAction, setPendingAction] = useState<OTPAction | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const openModalForMethod = (method: OTPMethod) => {
    const enabled = userSecurity.otpMethods.includes(method);
    setPendingMethod(method);
    setPendingAction(enabled ? 'disable' : 'enable');

    setOtpCode('');
    setOtpSent(false);
    setModalOpen(true);
  };

  const closeOtpModal = () => setModalOpen(false);

  const sendOtp = async () => {
    if (!pendingMethod || !pendingAction) return;
    if (pendingMethod === OTPMethodEnum.Enum.TOTP_APP) return;

    try {
      setSendingOtp(true);
      await axiosInstance.post('/api/auth/me/security/send', {
        method: pendingMethod,
        action: pendingAction
      });
      setOtpSent(true);
      toast.success('Doğrulama kodu gönderildi');
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } catch {
      toast.error('OTP gönderilemedi');
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyAndApply = async () => {
    if (!pendingMethod || !pendingAction) return;

    try {
      setVerifying(true);

      const verifyRes = await axiosInstance.post('/api/auth/me/security/verify', {
        otpToken: otpCode,
        method: pendingMethod,
        action: pendingAction
      });

      if (!verifyRes.data?.success) {
        toast.error('OTP doğrulanamadı');
        return;
      }

      const updated =
        pendingAction === 'enable'
          ? [...new Set([...userSecurity.otpMethods, pendingMethod])]
          : userSecurity.otpMethods.filter(m => m !== pendingMethod);

      onUserSecurityUpdate({ ...userSecurity, otpMethods: updated });

      toast.success('2FA ayarı güncellendi');
      closeOtpModal();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Doğrulama başarısız');
    } finally {
      setVerifying(false);
    }
  };

  /* ============ RETURN STATE & HANDLERS ============ */
  return {
    // Security data
    userSecurity,

    // Email/SMS OTP state
    modalOpen,
    otpCode,
    otpSent,
    sendingOtp,
    verifying,
    otpInputRef,

    // Handlers
    openModalForMethod,
    closeOtpModal,
    sendOtp,
    verifyAndApply,
    setOtpCode,
  };
}
