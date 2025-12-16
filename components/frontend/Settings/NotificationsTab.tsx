'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '@/libs/axios';
import useGlobalStore from '@/libs/zustand';
import {
  UserPreferences,
  UserPreferencesDefault,
} from '@/types/UserTypes';
import { set } from 'date-fns';

export default function NotificationsTab() {
  const { user, setUser } = useGlobalStore();

  const [preferences, setPrefs] = useState<UserPreferences>(UserPreferencesDefault);
  const [saving, setSaving] = useState(false);

  // --------------------------------------------------
  // Hydrate preferences when user loads / changes
  // --------------------------------------------------
  useEffect(() => {
    if (!user?.userPreferences) return;

    setPrefs(prev => ({
      ...prev,
      ...user.userPreferences,
    }));
  }, [user?.userPreferences]);

  // --------------------------------------------------
  // Save
  // --------------------------------------------------
  const handleSave = async () => {
    if (!user || saving) return;

    setSaving(true);

    await axiosInstance.put('/api/auth/me/preferences', {
        preferences,
      }).then((res) => {
      setUser({
        ...user,
        userPreferences: res.data.userPreferences,
      });
      toast.success("Tercihler başarıyla güncellendi");
    }).catch((err) => {
      toast.error("Tercihler güncellenirken hata oluştu");
      console.error(err);
    }).finally(() => {
      setSaving(false);
    }); 

  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold">Bildirim Tercihleri</h2>
        <p className="text-sm text-base-content/70">
          Bildirim ve uygulama ayarlarını yönet.
        </p>
      </div>

      {/* Email */}
      <div className="form-control">
        <label className="cursor-pointer label">
          <span className="label-text font-semibold">E-posta Bildirimleri</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={preferences.emailNotifications}
            onChange={e =>
              setPrefs(p => ({ ...p, emailNotifications: e.target.checked }))
            }
          />
        </label>
      </div>

      {/* SMS */}
      <div className="form-control">
        <label className="cursor-pointer label">
          <span className="label-text font-semibold">SMS Bildirimleri</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={preferences.smsNotifications}
            onChange={e =>
              setPrefs(p => ({ ...p, smsNotifications: e.target.checked }))
            }
          />
        </label>
      </div>

      {/* Push */}
      <div className="form-control">
        <label className="cursor-pointer label">
          <span className="label-text font-semibold">Push Bildirimleri</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={preferences.pushNotifications}
            onChange={e =>
              setPrefs(p => ({ ...p, pushNotifications: e.target.checked }))
            }
          />
        </label>
      </div>

      {/* Newsletter */}
      <div className="form-control">
        <label className="cursor-pointer label">
          <span className="label-text font-semibold">Bülten Aboneliği</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={preferences.newsletter}
            onChange={e =>
              setPrefs(p => ({ ...p, newsletter: e.target.checked }))
            }
          />
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn btn-primary w-full"
      >
        {saving ? 'Kaydediliyor…' : 'Kaydet'}
      </button>
    </div>
  );
}
