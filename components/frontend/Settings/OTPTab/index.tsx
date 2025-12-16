'use client';

import { useRef, useState } from 'react';
import { OTPMethodEnum, OTPMethod } from '@/types/UserSecurityTypes';
import axiosInstance from '@/libs/axios';
import useGlobalStore from '@/libs/zustand';
import { toast } from 'react-toastify';

import OTPMethodCard from './partials/OTPMethodCard';
import OTPConfirmModal from './partials/OTPConfirmModal';

export default function OTPTab() {
  const { setUser } = useGlobalStore();

  /* ---------------- STATE ---------------- */
  const [methods, setMethods] = useState<OTPMethod[]>([]);

  const [pendingMethod, setPendingMethod] = useState<OTPMethod | null>(null);
  const [pendingAction, setPendingAction] =
    useState<'enable' | 'disable' | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);

  /* ---------------- OPEN MODAL ---------------- */
  const openModalForMethod = (method: OTPMethod) => {
    const enabled = methods.includes(method);

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

      await axiosInstance.post('/api/auth/send-otp', {
        reason: 'otp-method-change',
        method: pendingMethod,
        action: pendingAction,
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

      const verifyRes = await axiosInstance.post('/api/auth/verify-otp', {
        code: otpCode,
        reason: 'otp-method-change',
        method: pendingMethod,
        action: pendingAction,
      });

      if (!verifyRes.data?.success) {
        toast.error('OTP doğrulanamadı');
        return;
      }

      const updated =
        pendingAction === 'enable'
          ? [...new Set([...methods, pendingMethod])]
          : methods.filter(m => m !== pendingMethod);

      const userRes = await axiosInstance.put('/api/users/me', {
        otpMethods: updated,
      });

      setMethods(updated);
      setUser(userRes.data.user);

      toast.success('2FA ayarı güncellendi');
      setModalOpen(false);
    } catch {
      toast.error('Doğrulama başarısız');
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
              enabled={methods.includes(method)}
              onClick={() => openModalForMethod(method)}
            />
          ))}
        </div>
      </div>

      <OTPConfirmModal
        open={modalOpen}
        method={pendingMethod ?? undefined}
        action={pendingAction ?? undefined}
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
