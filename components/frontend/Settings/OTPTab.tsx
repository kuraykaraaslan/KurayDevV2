'use client';

import { useState } from 'react';
import { OTPMethod } from '@/types/UserTypes';

interface OTPTabProps {
  initialMethods: OTPMethod[];
  onSave: (methods: OTPMethod[]) => Promise<void>;
}

export default function OTPTab({ initialMethods = [], onSave }: OTPTabProps) {
  const [selectedMethods, setSelectedMethods] = useState<OTPMethod[]>(initialMethods);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showTotpSetup, setShowTotpSetup] = useState(false);

  const otpOptions: { method: OTPMethod; label: string; description: string; icon: string }[] = [
    {
      method: 'EMAIL',
      label: 'E-mail ile OTP',
      description: 'Gelen kutunuza gönderilen kodu kullanın',
      icon: '📧',
    },
    {
      method: 'SMS',
      label: 'SMS ile OTP',
      description: 'Telefonunuza gönderilen kodu kullanın',
      icon: '📱',
    },
    {
      method: 'TOTP_APP',
      label: 'Authenticator Uygulaması',
      description: 'Google Authenticator veya benzer uygulamaları kullanın',
      icon: '🔐',
    },
    {
      method: 'PUSH_APP',
      label: 'Mobil Uygulama Onayı',
      description: 'Telefonunuzdaki uygulamada onay yapın',
      icon: '✅',
    },
  ];

  const toggleMethod = (method: OTPMethod) => {
    setSelectedMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
    if (method === 'TOTP_APP') {
      setShowTotpSetup(!showTotpSetup);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (selectedMethods.length === 0) {
      setErrorMessage('En az bir OTP yöntemi seçmelisiniz');
      return;
    }

    try {
      setIsLoading(true);
      await onSave(selectedMethods);
      setSuccessMessage('OTP ayarları başarıyla kaydedildi!');
      setShowTotpSetup(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('OTP ayarları kaydedilirken hata oluştu');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {errorMessage && (
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m2-2l2 2"
            />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="alert alert-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* OTP Methods Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">İki Faktörlü Kimlik Doğrulama Yöntemleri</h3>
            <p className="text-sm text-base-content/70">
              Hesabınızı korumak için aşağıdaki yöntemlerden birini veya birkaçını kullanın
            </p>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {otpOptions.map((option) => (
              <div
                key={option.method}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMethods.includes(option.method)
                    ? 'border-primary bg-primary/5'
                    : 'border-base-300 hover:border-primary/50 bg-base-100'
                }`}
                onClick={() => toggleMethod(option.method)}
              >
                <label className="cursor-pointer flex gap-3 items-start">
                  <input
                    type="checkbox"
                    checked={selectedMethods.includes(option.method)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleMethod(option.method);
                    }}
                    className="checkbox checkbox-primary checkbox-sm mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{option.icon}</span>
                      <span className="font-semibold">{option.label}</span>
                    </div>
                    <p className="text-xs text-base-content/60 mt-1">{option.description}</p>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* TOTP Setup Section */}
        {showTotpSetup && selectedMethods.includes('TOTP_APP') && (
          <div className="card bg-base-100 border border-warning/50 shadow-md">
            <div className="card-body">
              <h3 className="card-title text-base flex items-center gap-2">
                <span className="text-xl">🔐</span>
                Authenticator Uygulaması Kurulumu
              </h3>
              <p className="text-sm text-base-content/70">
                QR kodunu Google Authenticator, Microsoft Authenticator veya Authy gibi bir uygulamada tarayın.
              </p>

              {/* QR Code Placeholder */}
              <div className="flex justify-center my-4">
                <div className="w-48 h-48 bg-base-200 rounded-lg flex items-center justify-center border-2 border-dashed border-warning/50">
                  <div className="text-center">
                    <p className="text-sm font-semibold">QR Kod</p>
                    <p className="text-xs text-base-content/50 mt-1">(Burada görüntülenecek)</p>
                  </div>
                </div>
              </div>

              {/* Manual Entry Code */}
              <div className="space-y-2">
                <p className="text-sm font-semibold">QR kodu okuyamadığınız durumda manuel giriş kodu:</p>
                <div className="bg-base-200 p-3 rounded-lg flex items-center justify-between">
                  <code className="font-mono text-sm">XXXX XXXX XXXX XXXX</code>
                  <button type="button" className="btn btn-sm btn-ghost">
                    📋
                  </button>
                </div>
              </div>

              {/* Verification Code Input */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Doğrulama Kodunu Girin</span>
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  className="input input-bordered w-full text-center font-mono text-2xl tracking-widest"
                />
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline btn-warning w-full"
              >
                Doğrulamayı Kapat
              </button>
            </div>
          </div>
        )}

        {/* SMS Setup Section */}
        {selectedMethods.includes('SMS') && (
          <div className="card bg-base-100 border border-info/50 shadow-md">
            <div className="card-body">
              <h3 className="card-title text-base flex items-center gap-2">
                <span className="text-xl">📱</span>
                SMS Doğrulama
              </h3>
              <p className="text-sm text-base-content/70 mb-4">
                SMS ile OTP alabilmek için telefon numaranızı doğrulamanız gerekir.
              </p>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold">Telefon Numarası</span>
                </label>
                <input
                  type="tel"
                  placeholder="+90 (500) 123-4567"
                  className="input input-bordered w-full"
                />
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline btn-info w-full"
              >
                Doğrulama Kodu Gönder
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>
            İki faktörlü kimlik doğrulamayı etkinleştirerek hesabınızı daha güvenli hale getirin
          </span>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full"
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner"></span>
              Kaydediliyor...
            </>
          ) : (
            'OTP Ayarlarını Kaydet'
          )}
        </button>
      </form>
    </div>
  );
}
