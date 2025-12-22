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
} from '@/types/user/UserTypes';
import * as countriesAndTimezones from 'countries-and-timezones';

/*
const UserPreferencesSchema = z.object({
  theme: ThemeEnum.optional().default('SYSTEM'),
  language: LanguageEnum.optional().default('EN'),
  emailNotifications: z.boolean().optional().default(true),
  smsNotifications: z.boolean().optional().default(false),
  pushNotifications: z.boolean().optional().default(true),
  newsletter: z.boolean().optional().default(true),

  timezone: string;           // "Europe/Istanbul"
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  timeFormat: '24H' | '12H';
  firstDayOfWeek: 'MON' | 'SUN';
});*/


export default function PreferencesTab() {
   const { user, setUser } = useGlobalStore();

  const [userPreferences, setUserPreferences] = useState<UserPreferences>(user?.userPreferences || UserPreferencesDefault);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || saving) return;

    setSaving(true);

    await axiosInstance.put('/api/auth/me/preferences', {
        userPreferences,
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

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-4">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold">Kişisel Tercihler</h2>
        <p className="text-sm text-base-content/70">
          Bildirim ve uygulama ayarlarını yönet.
        </p>
      </div>

      {/* Language Dropdown */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold flex items-center gap-2">
            <FontAwesomeIcon icon={faGlobe} className="text-primary" />
            Dil
          </span>
        </label>

        <select
          className="select select-bordered select-primary w-full"
          value={userPreferences.language}
          onChange={(e) =>
            setUserPreferences({ ...userPreferences, language: e.target.value as any })
          }
        >
          {LanguageEnum.options.map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Theme Dropdown */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold flex items-center gap-2">
            <FontAwesomeIcon icon={faMoon} className="text-primary" />
            Tema
          </span>
        </label>

        <select
          className="select select-bordered select-primary w-full"
          value={userPreferences.theme}
          onChange={(e) =>
            setUserPreferences({ ...userPreferences, theme: e.target.value as any })
          }
        >
          {ThemeEnum.options.map((theme) => (
            <option key={theme} value={theme}>
              {theme.toUpperCase()}
            </option>
          ))}
        </select>
      </div>


      { /* TiMEZONE */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold">Zaman Dilimi</span>
        </label>
        <select
          className="select select-bordered select-primary w-full"
          value={userPreferences.timezone}
          onChange={(e) =>
            setUserPreferences({ ...userPreferences, timezone: e.target.value })
          }
        >
          {Object.entries(countriesAndTimezones.getAllTimezones()).map(
            ([tz, info]) => (
              <option key={tz} value={tz}>
                {`(GMT${info.utcOffsetStr}) ${info.name}`}
              </option>
            )
          )}
        </select>
      </div>

      {/* Date Format Dropdown */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold">Tarih Formatı</span>
        </label>

        <select
          className="select select-bordered select-primary w-full"
          value={userPreferences.dateFormat}
          onChange={(e) =>
            setUserPreferences({ ...userPreferences, dateFormat: e.target.value as any })
          }
        >
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
        </select>
      </div>

      {/* Time Format Dropdown */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold">Saat Formatı</span>
        </label>

        <select
          className="select select-bordered select-primary w-full"
          value={userPreferences.timeFormat}
          onChange={(e) =>
            setUserPreferences({ ...userPreferences, timeFormat: e.target.value as any })
          }
        >
          <option value="24H">24 Saat</option>
          <option value="12H">12 Saat</option>
        </select>
      </div>

      {/* First Day of Week Dropdown */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold">Haftanın İlk Günü</span>
        </label>

        <select
          className="select select-bordered select-primary w-full"
          value={userPreferences.firstDayOfWeek}
          onChange={(e) =>
            setUserPreferences({ ...userPreferences, firstDayOfWeek: e.target.value as any })
          }
        >
          <option value="MON">Pazartesi</option>
          <option value="SUN">Pazar</option>
        </select>
      </div>


      <button onClick={handleSave} className="btn btn-primary w-full">
        Kaydet
      </button>
    </div>
  );
}
