'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import axiosInstance from '@/libs/axios'
import useGlobalStore from '@/libs/zustand'
import { UserPreferences, UserPreferencesDefault } from '@/types/user/UserTypes'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import DynamicToggle from '@/components/admin/UI/Forms/DynamicToggle'

export default function NotificationsTab() {
  const { user, setUser } = useGlobalStore()

  const [preferences, setPrefs] = useState<UserPreferences>(
    user?.userPreferences || UserPreferencesDefault
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!user || saving) return

    setSaving(true)

    await axiosInstance
      .put('/api/auth/me/preferences', {
        preferences,
      })
      .then((res) => {
        setUser({
          ...user,
          userPreferences: res.data.userPreferences,
        })
        toast.success('Tercihler başarıyla güncellendi')
      })
      .catch((err) => {
        toast.error('Tercihler güncellenirken hata oluştu')
        console.error(err)
      })
      .finally(() => {
        setSaving(false)
      })
  }

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">
      <FormHeader title="Bildirim Tercihleri" titleClassName="text-lg" />
      <p className="text-sm text-base-content/70 -mt-4">Bildirim ve uygulama ayarlarını yönet.</p>

      <DynamicToggle
        label="E-posta Bildirimleri"
        description="Önemli güncellemeler ve duyurular için e-posta al"
        checked={preferences.emailNotifications ?? true}
        onChange={(checked) => setPrefs((p) => ({ ...p, emailNotifications: checked }))}
      />

      <DynamicToggle
        label="SMS Bildirimleri"
        description="Kritik uyarılar için SMS bildirimleri al"
        checked={preferences.smsNotifications ?? false}
        onChange={(checked) => setPrefs((p) => ({ ...p, smsNotifications: checked }))}
      />

      <DynamicToggle
        label="Push Bildirimleri"
        description="Tarayıcı üzerinden anlık bildirimler al"
        checked={preferences.pushNotifications ?? true}
        onChange={(checked) => setPrefs((p) => ({ ...p, pushNotifications: checked }))}
      />

      <DynamicToggle
        label="Bülten Aboneliği"
        description="Haftalık haber bülteni ve güncellemeler al"
        checked={preferences.newsletter ?? true}
        onChange={(checked) => setPrefs((p) => ({ ...p, newsletter: checked }))}
      />

      <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full">
        {saving ? 'Kaydediliyor…' : 'Kaydet'}
      </button>
    </div>
  )
}
