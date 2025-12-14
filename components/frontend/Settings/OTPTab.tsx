'use client';

import { useState, useRef } from 'react';
import { OTPMethod } from '@/types/UserTypes';
import axiosInstance from '@/libs/axios';
import useGlobalStore from '@/libs/zustand';
import { toast } from 'react-toastify';
import HeadlessModal from '@/components/common/Modal';

export default function OTPTab({ initialMethods = [] }) {
  const { setUser } = useGlobalStore();

  const [selected, setSelected] = useState<OTPMethod[]>(initialMethods);
  const [modalOpen, setModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const otpOptions = [
    { method: 'EMAIL', label: "E-mail OTP", icon: "📧" },
    { method: 'SMS', label: "SMS OTP", icon: "📱" },
    { method: 'TOTP_APP', label: "Authenticator", icon: "🔐" },
    { method: 'PUSH_APP', label: "Mobil Onay", icon: "✅" }
  ];

  const toggle = (m: OTPMethod) =>
    setSelected(prev =>
      prev.includes(m)
        ? prev.filter(x => x !== m)
        : [...prev, m]
    );

  const openOtpModal = async () => {
    if (selected.length === 0) return toast.error("En az bir yöntem seçmelisin");

    try {
      setSendingOtp(true);
      await axiosInstance.post('/api/auth/send-otp', {
        reason: "otp-method-change"
      });
      toast.success("Doğrulama kodu gönderildi");
      setModalOpen(true);
    } catch (err) {
      toast.error("OTP gönderilemedi");
    } finally {
      setSendingOtp(false);
    }
  };

  const confirmOtpAndSave = async () => {
    try {
      setVerifying(true);

      // 1) OTP doğrulama
      const verifyRes = await axiosInstance.post('/api/auth/verify-otp', {
        code: otpCode,
        reason: "otp-method-change"
      });

      if (!verifyRes.data?.success)
        return toast.error("OTP kodu doğrulanamadı");

      // 2) OTP methodlarını güncelle
      const userRes = await axiosInstance.put('/api/users/me', {
        otpMethods: selected
      });

      setUser(userRes.data.user);
      toast.success("2FA ayarları güncellendi");

      // modal kapat
      setModalOpen(false);
      setOtpCode('');

    } catch (err) {
      console.error(err);
      toast.error("Doğrulama başarısız");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      {/* MAIN CONTENT */}
      <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">

        <div>
          <h2 className="text-lg font-bold">İki Faktörlü Doğrulama</h2>
          <p className="text-sm text-base-content/70">
            Güvenliğin için yöntem seç.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otpOptions.map(o => (
            <div
              key={o.method}
              onClick={() => toggle(o.method)}
              className={`p-4 rounded-lg border cursor-pointer transition 
              ${selected.includes(o.method)
                ? "border-primary bg-primary/10"
                : "border-base-300 hover:bg-base-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{o.icon}</span>
                <span className="font-semibold">{o.label}</span>
              </div>
            </div>
          ))}
        </div>

        <button
          disabled={sendingOtp}
          onClick={openOtpModal}
          className="btn btn-primary w-full"
        >
          {sendingOtp ? "Kod Gönderiliyor..." : "Kaydet"}
        </button>
      </div>

      {/* OTP MODAL */}
      <HeadlessModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Değişikliği Doğrula"
        description="Güvenlik nedeniyle bir doğrulama kodu girmeniz gerekiyor."
        initialFocusRef={inputRef}
        size="sm"
      >
        <div className="space-y-4">

          {/* OTP Input */}
          <input
            ref={inputRef}
            type="text"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="123456"
            className="input input-bordered w-full text-center text-2xl tracking-widest font-mono"
          />

          {/* Confirm Button */}
          <button
            onClick={confirmOtpAndSave}
            disabled={verifying}
            className="btn btn-primary w-full"
          >
            {verifying ? "Doğrulanıyor..." : "Doğrula ve Kaydet"}
          </button>
        </div>
      </HeadlessModal>
    </>
  );
}
