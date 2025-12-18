'use client';

import { useRef, useState, useEffect } from 'react';
import { OTPMethodEnum, OTPMethod, OTPAction } from '@/types/UserSecurityTypes';
import { SafeUserSecurity, SafeUserSecurityDefault } from '@/types/UserSecurityTypes';
import axiosInstance from '@/libs/axios';
import useGlobalStore from '@/libs/zustand';
import { toast } from 'react-toastify';

import OTPMethodCard from './partials/OTPMethodCard';
import OTPConfirmModal from './partials/OTPConfirmModal';

export default function OTPTab() {

  const { user, setUser } = useGlobalStore();

  /* ---------------- STATE ---------------- */
  const [userSecurity, setUserSecurity] = useState<SafeUserSecurity>(
    SafeUserSecurityDefault
  );

  const [pendingMethod, setPendingMethod] = useState<OTPMethod | null>(null);
  const [pendingAction, setPendingAction] = useState<OTPAction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);

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


  const openModalForMethod = (method: OTPMethod) => {
    const enabled = userSecurity.otpMethods.includes(method);
    setPendingMethod(method);
    setPendingAction(enabled ? 'disable' : 'enable');
    setOtpCode('');
    setOtpSent(false);
    setModalOpen(true);
  };

  /* ---------------- SEND OTP ---------------- */
  const sendOtp = async () => {
    if (!pendingMethod || !pendingAction) return;

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
    </>
  );
}
