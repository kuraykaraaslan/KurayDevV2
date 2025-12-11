'use client';

import { useState } from 'react';

export default function PreferencesTab() {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    newsletter: true,
    darkMode: true,
    language: 'tr',
  });
  const [successMessage, setSuccessMessage] = useState('');

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement actual preferences save API call
      setSuccessMessage('Tercihler başarıyla kaydedildi!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Tercihler kaydedilirken hata oluştu:', error);
    }
  };

  return (
    <div className="space-y-6">
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
        {/* Notifications Section */}
        <div className="card bg-base-100 shadow-md border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Bildirimler</h2>

            {/* Email Notifications */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={() => handleToggle('emailNotifications')}
                  className="checkbox checkbox-primary"
                />
                <div>
                  <span className="label-text font-semibold">E-mail Bildirimleri</span>
                  <p className="text-xs text-base-content/70">Önemli güncellemeler için e-mail alın</p>
                </div>
              </label>
            </div>

            {/* SMS Notifications */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  checked={preferences.smsNotifications}
                  onChange={() => handleToggle('smsNotifications')}
                  className="checkbox checkbox-primary"
                />
                <div>
                  <span className="label-text font-semibold">SMS Bildirimleri</span>
                  <p className="text-xs text-base-content/70">Acil güncellemeler için SMS alın</p>
                </div>
              </label>
            </div>

            {/* Push Notifications */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={() => handleToggle('pushNotifications')}
                  className="checkbox checkbox-primary"
                />
                <div>
                  <span className="label-text font-semibold">Push Bildirimleri</span>
                  <p className="text-xs text-base-content/70">Tarayıcı bildirimleri alın</p>
                </div>
              </label>
            </div>

            {/* Newsletter */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  checked={preferences.newsletter}
                  onChange={() => handleToggle('newsletter')}
                  className="checkbox checkbox-primary"
                />
                <div>
                  <span className="label-text font-semibold">Bülten Aboneliği</span>
                  <p className="text-xs text-base-content/70">Haftalık blog güncellemelerini alın</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Display Section */}
        <div className="card bg-base-100 shadow-md border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Görüntüleme</h2>

            {/* Dark Mode */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  checked={preferences.darkMode}
                  onChange={() => handleToggle('darkMode')}
                  className="checkbox checkbox-primary"
                />
                <div>
                  <span className="label-text font-semibold">Koyu Mod</span>
                  <p className="text-xs text-base-content/70">Koyu tema kullanın</p>
                </div>
              </label>
            </div>

            {/* Language Selection */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">Dil</span>
              </label>
              <select
                name="language"
                value={preferences.language}
                onChange={handleSelectChange}
                className="select select-bordered w-full"
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button type="submit" className="btn btn-primary w-full">
          Tercihleri Kaydet
        </button>
      </form>
    </div>
  );
}
