'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import axiosInstance from '@/libs/axios'
import { useUserStore } from '@/libs/zustand'
import { UserPreferences, UserPreferencesDefault } from '@/types/user/UserTypes'
import FormHeader from '@/components/common/Forms/FormHeader'
import DynamicToggle from '@/components/common/Forms/DynamicToggle'
import { useTranslation } from 'react-i18next'

export default function NotificationsTab() {
  const { user, setUser } = useUserStore()
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

  const newsletterTopics = preferences.newsletterTopics ?? {
    blogDigest: true,
    announcements: true,
    events: true,
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

      {/* Newsletter Topic Preferences — shown only when newsletter is enabled */}
      {(preferences.newsletter ?? true) && (
        <div className="border border-base-300 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-base-content">
            {t('settings.notifications_tab.newsletter_topics_title')}
          </p>
          <p className="text-xs text-base-content/60">
            {t('settings.notifications_tab.newsletter_topics_description')}
          </p>

          <DynamicToggle
            label={t('settings.notifications_tab.topic_blog_digest_label')}
            description={t('settings.notifications_tab.topic_blog_digest_description')}
            checked={newsletterTopics.blogDigest}
            onChange={(checked) =>
              setPrefs((p) => ({
                ...p,
                newsletterTopics: { ...newsletterTopics, blogDigest: checked },
              }))
            }
          />

          <DynamicToggle
            label={t('settings.notifications_tab.topic_announcements_label')}
            description={t('settings.notifications_tab.topic_announcements_description')}
            checked={newsletterTopics.announcements}
            onChange={(checked) =>
              setPrefs((p) => ({
                ...p,
                newsletterTopics: { ...newsletterTopics, announcements: checked },
              }))
            }
          />

          <DynamicToggle
            label={t('settings.notifications_tab.topic_events_label')}
            description={t('settings.notifications_tab.topic_events_description')}
            checked={newsletterTopics.events}
            onChange={(checked) =>
              setPrefs((p) => ({
                ...p,
                newsletterTopics: { ...newsletterTopics, events: checked },
              }))
            }
          />
        </div>
      )}

      <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full">
        {saving ? t('settings.notifications_tab.saving') : t('settings.notifications_tab.save')}
      </button>
    </div>
  )
}
