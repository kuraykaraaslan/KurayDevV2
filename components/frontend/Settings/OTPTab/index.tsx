'use client';

import { useRef, useState, useEffect } from 'react';
import { OTPMethodEnum, OTPMethod, OTPAction } from '@/types/UserSecurityTypes';
import { SafeUserSecurity, SafeUserSecurityDefault } from '@/types/UserSecurityTypes';
import axiosInstance from '@/libs/axios';
import useGlobalStore from '@/libs/zustand';
import { toast } from 'react-toastify';

import OTPMethodCard from './partials/OTPMethodCard';
import OTPConfirmModal from './partials/OTPConfirmModal';
import TOTPSetupModal from './partials/TOTPSetupModal';

export default function OTPTab() {

  const { user, setUser } = useGlobalStore();

  /* ---------------- STATE ---------------- */
  const [userSecurity, setUserSecurity] = useState<SafeUserSecurity>(
    SafeUserSecurityDefault
  );

  const [pendingMethod, setPendingMethod] = useState<OTPMethod | null>(null);
  const [pendingAction, setPendingAction] = useState<OTPAction | null>(null);

  // Email/SMS modal
  const [modalOpen, setModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // TOTP setup modal
  const [totpModalOpen, setTotpModalOpen] = useState(false);
  const [totpOtpauthUrl, setTotpOtpauthUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [totpLoadingSetup, setTotpLoadingSetup] = useState(false);
  const [totpVerifying, setTotpVerifying] = useState(false);

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


  const openModalForMethod = async (method: OTPMethod) => {
    const enabled = userSecurity.otpMethods.includes(method);
    setPendingMethod(method);
    setPendingAction(enabled ? 'disable' : 'enable');

    // For TOTP enable, use dedicated setup modal
    if (method === OTPMethodEnum.Enum.TOTP_APP && !enabled) {
      setTotpModalOpen(true);
      setTotpCode('');
      setTotpOtpauthUrl(null);
      await startTotpSetup();
      return;
    }

    // Default flow for EMAIL/SMS
    setOtpCode('');
    setOtpSent(false);
    setModalOpen(true);
  };

  /* ---------------- SEND OTP ---------------- */
  const sendOtp = async () => {
    if (!pendingMethod || !pendingAction) return;

    // TOTP has no send step in setup; handled separately
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

  /* ---------------- VERIFY + APPLY ---------------- */
  const verifyAndApply = async () => {
    if (!pendingMethod || !pendingAction) return;

    // TOTP enable is verified via different endpoint
    if (pendingMethod === OTPMethodEnum.Enum.TOTP_APP && pendingAction === 'enable') {
      return verifyTotpEnable();
    }

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

      const userRes = await axiosInstance.put('/api/users/me', {
        otpMethods: updated,
      });

      setUserSecurity(prev => ({ ...prev, otpMethods: updated }));
      setUser(userRes.data.user);

      toast.success('2FA ayarı güncellendi');
      setModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Doğrulama başarısız');
    } finally {
      setVerifying(false);
    }
  };

  /* ---------------- TOTP SETUP ---------------- */
  const startTotpSetup = async () => {
    try {
      setTotpLoadingSetup(true);
      const res = await axiosInstance.post('/api/auth/totp/setup');
      setTotpOtpauthUrl(res.data.otpauthUrl);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'TOTP kurulumu başlatılamadı');
    } finally {
      setTotpLoadingSetup(false);
    }
  };

  const verifyTotpEnable = async () => {
    try {
      setTotpVerifying(true);
      const verifyRes = await axiosInstance.post('/api/auth/totp/enable', { otpToken: totpCode });
      if (!verifyRes.data?.success) {
        toast.error('TOTP doğrulanamadı');
        return;
      }
      const updated = [...new Set([...userSecurity.otpMethods, OTPMethodEnum.Enum.TOTP_APP])];

      const userRes = await axiosInstance.put('/api/users/me', {
        otpMethods: updated,
      });

      setUserSecurity(prev => ({ ...prev, otpMethods: updated }));
      setUser(userRes.data.user);

      toast.success('TOTP etkinleştirildi');
      setTotpModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'TOTP etkinleştirilemedi');
    } finally {
      setTotpVerifying(false);
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <>
      <div className="bg-base-100 rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-bold">İki Faktörlü Doğrulama</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(OTPMethodEnum.Enum).map(method => (
            <OTPMethodCard
              key={method}
              method={method}
              enabled={userSecurity.otpMethods.includes(method)}
              onClick={() => openModalForMethod(method)}
            />
          ))}
        </div>
      </div>

      <OTPConfirmModal
        open={modalOpen}
        otpSent={otpSent}
        otpCode={otpCode}
        sendingOtp={sendingOtp}
        verifying={verifying}
        otpInputRef={otpInputRef as React.RefObject<HTMLInputElement>}
        onSendOtp={sendOtp}
        onVerify={verifyAndApply}
        onChangeCode={setOtpCode}
        onClose={() => setModalOpen(false)}
      />

      <TOTPSetupModal
        open={totpModalOpen}
        otpauthUrl={totpOtpauthUrl}
        code={totpCode}
        loadingSetup={totpLoadingSetup}
        verifying={totpVerifying}
        onStartSetup={startTotpSetup}
        onVerify={verifyTotpEnable}
        onChangeCode={setTotpCode}
        onClose={() => setTotpModalOpen(false)}
      />
    </>
  );
}
