'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import axiosInstance from '@/libs/axios'
import useGlobalStore from '@/libs/zustand'
import { UserPreferences, UserPreferencesDefault } from '@/types/user/UserTypes'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import DynamicToggle from '@/components/admin/UI/Forms/DynamicToggle'
import { useTranslation } from 'react-i18next'

export default function NotificationsTab() {
  const { user, setUser } = useGlobalStore()
  const { t } = useTranslation()

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
        toast.success(t('settings.notifications_tab.toast_success'))
      })
      .catch((err) => {
        toast.error(t('settings.notifications_tab.toast_error'))
        console.error(err)
      })
      .finally(() => {
        setSaving(false)
      })
  }

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">
      <FormHeader title={t('settings.notifications_tab.title')} titleClassName="text-lg" />
      <p className="text-sm text-base-content/70 -mt-4">{t('settings.notifications_tab.description')}</p>

      <DynamicToggle
        label={t('settings.notifications_tab.email_notifications_label')}
        description={t('settings.notifications_tab.email_notifications_description')}
        checked={preferences.emailNotifications ?? true}
        onChange={(checked) => setPrefs((p) => ({ ...p, emailNotifications: checked }))}
      />

      <DynamicToggle
        label={t('settings.notifications_tab.sms_notifications_label')}
        description={t('settings.notifications_tab.sms_notifications_description')}
        checked={preferences.smsNotifications ?? false}
        onChange={(checked) => setPrefs((p) => ({ ...p, smsNotifications: checked }))}
      />

      <DynamicToggle
        label={t('settings.notifications_tab.push_notifications_label')}
        description={t('settings.notifications_tab.push_notifications_description')}
        checked={preferences.pushNotifications ?? true}
        onChange={(checked) => setPrefs((p) => ({ ...p, pushNotifications: checked }))}
      />

      <DynamicToggle
        label={t('settings.notifications_tab.newsletter_label')}
        description={t('settings.notifications_tab.newsletter_description')}
        checked={preferences.newsletter ?? true}
        onChange={(checked) => setPrefs((p) => ({ ...p, newsletter: checked }))}
      />

      <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full">
        {saving ? t('settings.notifications_tab.saving') : t('settings.notifications_tab.save')}
      </button>
    </div>
  )
}
