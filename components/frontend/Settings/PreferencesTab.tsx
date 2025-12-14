'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '@/libs/axios';
import useGlobalStore from '@/libs/zustand';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";

export default function PreferencesTab() {
  const { user, setUser } = useGlobalStore();

  const [prefs, setPrefs] = useState({
    emailNotifications: user?.emailNotifications ?? true,
    smsNotifications: user?.smsNotifications ?? false,
    pushNotifications: user?.pushNotifications ?? true,
    newsletter: user?.newsletter ?? true,
    darkMode: user?.darkMode ?? true,
    language: user?.language ?? 'tr',
  });

  const handleSave = async () => {
    try {
      const res = await axiosInstance.put('/api/users/me', { preferences: prefs });
      setUser(res.data.user);
      toast.success("Tercihler güncellendi");
    } catch (err) {
      toast.error("Bir hata oluştu");
    }
  };

  const toggleRow = (key: string, title: string, desc: string) => (
    <div
      key={key}
      className="flex items-center justify-between p-3 rounded-lg border border-base-300 hover:bg-base-200 transition"
    >
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs opacity-60">{desc}</p>
      </div>

      <input
        type="checkbox"
        className="toggle toggle-primary"
        checked={(prefs as any)[key]}
        onChange={(e) => setPrefs(p => ({ ...p, [key]: e.target.checked }))}
      />
    </div>
  );

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">

      <div>
        <h2 className="text-lg font-bold">Kişisel Tercihler</h2>
        <p className="text-sm text-base-content/70">
          Bildirim ve tercih ayarlarını yönet.
        </p>
      </div>

      {toggleRow("emailNotifications", "E-posta Bildirimleri", "Önemli gelişmeleri al.")}
      {toggleRow("smsNotifications", "SMS Bildirimleri", "Acil durum bildirimi.")}
      {toggleRow("pushNotifications", "Push Bildirimleri", "Tarayıcı bildirimleri.")}
      {toggleRow("newsletter", "Bülten Aboneliği", "Haftalık içerik gönderimi.")}
      {toggleRow("darkMode", "Karanlık Mod", "Daha koyu bir tema.")}

      <div className="form-control w-full pt-2">
        <label className="label">
          <span className="label-text font-semibold flex items-center gap-2">
            <FontAwesomeIcon icon={faGlobe} className="text-primary" />
            Dil Seçimi
          </span>
        </label>
        <select
          className="select select-bordered w-full"
          value={prefs.language}
          onChange={(e) => setPrefs(p => ({ ...p, language: e.target.value }))}
        >
          <option value="tr">Türkçe</option>
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
        </select>
      </div>

      <button onClick={handleSave} className="btn btn-primary w-full">Kaydet</button>
    </div>
  );
}
