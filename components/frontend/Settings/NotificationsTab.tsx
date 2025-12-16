'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '@/libs/axios';
import useGlobalStore from '@/libs/zustand';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faMoon } from '@fortawesome/free-solid-svg-icons';
import {
  UserPreferences,
  ThemeEnum,
  LanguageEnum,
  UserPreferencesDefault,
} from '@/types/UserTypes';

/*
const UserPreferencesSchema = z.object({
  theme: ThemeEnum.optional().default('SYSTEM'),
  language: LanguageEnum.optional().default('EN'),
  emailNotifications: z.boolean().optional().default(true),
  smsNotifications: z.boolean().optional().default(false),
  pushNotifications: z.boolean().optional().default(true),
  newsletter: z.boolean().optional().default(true),
});*/


export default function NotificationsTab() {
  const { setUser } = useGlobalStore();
  const [preferences, setPrefs] = useState<UserPreferences>(UserPreferencesDefault);

  const handleSave = async () => {
    try {
      const res = await axiosInstance.put('/api/users/me', { preferences });
      setUser(res.data.user);
      toast.success('Tercihler güncellendi');
    } catch {
      toast.error('Bir hata oluştu');
    }
  };

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold">Bildirim Tercihleri</h2>
        <p className="text-sm text-base-content/70">
          Bildirim ve uygulama ayarlarını yönet.
        </p>
      </div>

      { /* Notification toggles */ }
      <div className="form-control">
        <label className="cursor-pointer label">
          <span className="label-text font-semibold">E-posta Bildirimleri</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={preferences.emailNotifications}
            onChange={(e) =>
              setPrefs({ ...preferences, emailNotifications: e.target.checked })
            }
          />
        </label>
      </div>

      <div className="form-control">
        <label className="cursor-pointer label">
          <span className="label-text font-semibold">SMS Bildirimleri</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={preferences.smsNotifications}
            onChange={(e) =>
              setPrefs({ ...preferences, smsNotifications: e.target.checked })
            }
          />
        </label>
      </div>

      <div className="form-control">
        <label className="cursor-pointer label">
          <span className="label-text font-semibold">Push Bildirimleri</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={preferences.pushNotifications}
            onChange={(e) =>
              setPrefs({ ...preferences, pushNotifications: e.target.checked })
            }
          />
        </label>
      </div>

      <div className="form-control">
        <label className="cursor-pointer label">
          <span className="label-text font-semibold">Bülten Aboneliği</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={preferences.newsletter}
            onChange={(e) =>
              setPrefs({ ...preferences, newsletter: e.target.checked })
            }
          />
        </label>
      </div>

      <button onClick={handleSave} className="btn btn-primary w-full">
        Kaydet
      </button>
    </div>
  );
}
