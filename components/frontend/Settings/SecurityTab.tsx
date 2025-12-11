'use client';

import { useState } from 'react';

export default function SecurityTab() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Şifre en az 8 karakter olmalıdır');
      return;
    }

    try {
      // TODO: Implement actual password change API call
      setPasswordSuccess('Şifre başarıyla değiştirildi!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error) {
      setPasswordError('Şifre değiştirilirken bir hata oluştu');
    }
  };

  return (
    <div className="space-y-8">
      {/* Change Password Section */}
      <div className="card bg-base-100 shadow-md border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-lg">Şifreyi Değiştir</h2>
          <p className="text-sm text-base-content/70">
            Hesabınızın güvenliğini korumak için düzenli olarak şifrenizi değiştirin
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4">
            {/* Error Message */}
            {passwordError && (
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
                <span>{passwordError}</span>
              </div>
            )}

            {/* Success Message */}
            {passwordSuccess && (
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
                <span>{passwordSuccess}</span>
              </div>
            )}

            {/* Current Password */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">Mevcut Şifre</span>
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Mevcut şifrenizi girin"
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* New Password */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">Yeni Şifre</span>
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Yeni şifrenizi girin"
                className="input input-bordered w-full"
                required
              />
              <label className="label">
                <span className="label-text-alt">En az 8 karakter</span>
              </label>
            </div>

            {/* Confirm Password */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">Şifreyi Onayla</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Yeni şifrenizi tekrar girin"
                className="input input-bordered w-full"
                required
              />
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn btn-primary w-full">
              Şifreyi Değiştir
            </button>
          </form>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="card bg-base-100 shadow-md border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-lg">İki Faktörlü Kimlik Doğrulama</h2>
          <p className="text-sm text-base-content/70">
            Hesabınıza ek bir güvenlik katmanı ekleyin
          </p>
          <div className="card-actions justify-end mt-4">
            <button className="btn btn-outline">Etkinleştir</button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="card bg-base-100 shadow-md border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-lg">Aktif Oturumlar</h2>
          <p className="text-sm text-base-content/70 mb-4">
            Hesabınızda açık olan tüm oturumları görüntüleyin ve yönetin
          </p>
          <div className="divider my-2"></div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
              <div>
                <p className="font-semibold">Chrome - Linux</p>
                <p className="text-xs text-base-content/70">Son aktivite: Şimdi</p>
              </div>
              <button className="btn btn-sm btn-ghost">Kapat</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
