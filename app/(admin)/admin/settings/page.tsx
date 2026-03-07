'use client'
import { useState, useEffect } from 'react'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import { Setting } from '@/types/common/SettingTypes'
import Tabs, { Tab } from '@/components/admin/UI/Tabs'
import Form from '@/components/admin/UI/Forms/Form'
import DynamicToggle from '@/components/admin/UI/Forms/DynamicToggle'
import DynamicText from '@/components/admin/UI/Forms/DynamicText'
import DynamicCommaSeperatedText from '@/components/admin/UI/Forms/DynamicCommaSeperatedText'
import SectionCard from '@/components/admin/UI/SectionCard'
import {
  faGear,
  faShieldHalved,
  faBell,
  faGlobe,
  faSlidersH,
  faUserShield,
  faLockOpen,
  faServer,
  faBellSlash,
  faEnvelope,
  faRobot,
} from '@fortawesome/free-solid-svg-icons'

const Page = () => {
  const { t } = useTranslation()
  const [defaultSettings, _setDefaultSettings] = useState<Pick<Setting, 'key' | 'value'>[]>([
    { key: 'ALLOW_REGISTRATION', value: 'true' },
    { key: 'MAINTENANCE_MODE', value: 'false' },
    { key: 'SITE_NAME', value: '' },
    { key: 'SITE_DESCRIPTION', value: '' },
    { key: 'REQUIRE_EMAIL_VERIFICATION', value: 'false' },
    { key: 'MAX_LOGIN_ATTEMPTS', value: '5' },
    { key: 'SESSION_TIMEOUT', value: '60' },
    { key: 'ALLOWED_DOMAINS', value: '' },
    { key: 'ENABLE_EMAIL_NOTIFICATIONS', value: 'false' },
    { key: 'ADMIN_EMAIL', value: '' },
    { key: 'EMAIL_FROM_NAME', value: '' },
    { key: 'NOTIFY_ON_REGISTRATION', value: 'false' },
    { key: 'CHATBOT_SYSTEM_PROMPT', value: '' },
    { key: 'CHATBOT_MAX_TOKENS', value: '1000' },
  ])

  const [settings, setSettings] = useState<Pick<Setting, 'key' | 'value'>[]>([])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    await axiosInstance
      .get('/api/settings')
      .then((res) => {
        const incomingSettings = res.data.settings as Pick<Setting, 'key' | 'value'>[]
        const mergedSettings = defaultSettings.map((ds) => {
          const existingSetting = incomingSettings.find((s) => s.key === ds.key)
          return existingSetting ? existingSetting : ds
        })
        setSettings(mergedSettings)
      })
      .catch((error) => {
        console.error(error)
      })
  }

  const updateSettings = async () => {
    await axiosInstance
      .post('/api/settings', { settings })
      .then((res) => {
        setSettings(res.data.settings)
      })
      .catch((error) => {
        console.error(error)
      })
  }

  const getSetting = (key: string) => settings.find((s) => s.key === key)?.value ?? ''

  const updateSetting = (key: string, value: string) =>
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)))

  const tabs: Tab[] = [
    {
      id: 'general',
      label: t('admin.admin_settings.tab_general'),
      icon: faGear,
      content: (
        <Form
          actions={[{ label: t('admin.admin_settings.save_changes'), onClick: updateSettings, className: 'btn-primary' }]}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard
              icon={faGlobe}
              title={t('admin.admin_settings.site_info_title')}
              description={t('admin.admin_settings.site_info_description')}
            >
              <DynamicText
                label={t('admin.admin_settings.site_name_label')}
                value={getSetting('SITE_NAME')}
                setValue={(v) => updateSetting('SITE_NAME', v)}
                placeholder={t('admin.admin_settings.site_name_placeholder')}
              />
              <DynamicText
                label={t('admin.admin_settings.site_description_label')}
                value={getSetting('SITE_DESCRIPTION')}
                setValue={(v) => updateSetting('SITE_DESCRIPTION', v)}
                isTextarea
              />
            </SectionCard>

            <SectionCard
              icon={faSlidersH}
              title={t('admin.admin_settings.site_behavior_title')}
              description={t('admin.admin_settings.site_behavior_description')}
            >
              <DynamicToggle
                label={t('admin.admin_settings.allow_registration_label')}
                description={t('admin.admin_settings.allow_registration_description')}
                checked={getSetting('ALLOW_REGISTRATION') === 'true'}
                onChange={(v) => updateSetting('ALLOW_REGISTRATION', v ? 'true' : 'false')}
              />
              <DynamicToggle
                label={t('admin.admin_settings.maintenance_mode_label')}
                description={t('admin.admin_settings.maintenance_mode_description')}
                checked={getSetting('MAINTENANCE_MODE') === 'true'}
                onChange={(v) => updateSetting('MAINTENANCE_MODE', v ? 'true' : 'false')}
              />
            </SectionCard>
          </div>
        </Form>
      ),
    },
    {
      id: 'security',
      label: t('admin.admin_settings.tab_security'),
      icon: faShieldHalved,
      content: (
        <Form
          actions={[{ label: t('admin.admin_settings.save_changes'), onClick: updateSettings, className: 'btn-primary' }]}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard
              icon={faUserShield}
              title={t('admin.admin_settings.account_security_title')}
              description={t('admin.admin_settings.account_security_description')}
            >
              <DynamicToggle
                label={t('admin.admin_settings.email_verification_label')}
                description={t('admin.admin_settings.email_verification_description')}
                checked={getSetting('REQUIRE_EMAIL_VERIFICATION') === 'true'}
                onChange={(v) => updateSetting('REQUIRE_EMAIL_VERIFICATION', v ? 'true' : 'false')}
              />
            </SectionCard>

            <SectionCard
              icon={faLockOpen}
              title={t('admin.admin_settings.login_limits_title')}
              description={t('admin.admin_settings.login_limits_description')}
            >
              <DynamicText
                label={t('admin.admin_settings.max_login_attempts_label')}
                value={getSetting('MAX_LOGIN_ATTEMPTS')}
                setValue={(v) => updateSetting('MAX_LOGIN_ATTEMPTS', v)}
                placeholder="5"
              />
              <DynamicText
                label={t('admin.admin_settings.session_timeout_label')}
                value={getSetting('SESSION_TIMEOUT')}
                setValue={(v) => updateSetting('SESSION_TIMEOUT', v)}
                placeholder="60"
              />
            </SectionCard>

            <div className="lg:col-span-2">
              <SectionCard
                icon={faServer}
                title={t('admin.admin_settings.domain_restrictions_title')}
                description={t('admin.admin_settings.domain_restrictions_description')}
              >
                <DynamicCommaSeperatedText
                  label={t('admin.admin_settings.allowed_domains_label')}
                  values={
                    getSetting('ALLOWED_DOMAINS')
                      ? getSetting('ALLOWED_DOMAINS').split(',').filter(Boolean)
                      : []
                  }
                  setValues={(v) => updateSetting('ALLOWED_DOMAINS', v.join(','))}
                  placeholder={t('admin.admin_settings.allowed_domains_placeholder')}
                />
              </SectionCard>
            </div>
          </div>
        </Form>
      ),
    },
    {
      id: 'notifications',
      label: t('admin.admin_settings.tab_notifications'),
      icon: faBell,
      content: (
        <Form
          actions={[{ label: t('admin.admin_settings.save_changes'), onClick: updateSettings, className: 'btn-primary' }]}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard
              icon={faBellSlash}
              title={t('admin.admin_settings.notification_prefs_title')}
              description={t('admin.admin_settings.notification_prefs_description')}
            >
              <DynamicToggle
                label={t('admin.admin_settings.email_notifications_label')}
                description={t('admin.admin_settings.email_notifications_description')}
                checked={getSetting('ENABLE_EMAIL_NOTIFICATIONS') === 'true'}
                onChange={(v) => updateSetting('ENABLE_EMAIL_NOTIFICATIONS', v ? 'true' : 'false')}
              />
              <DynamicToggle
                label={t('admin.admin_settings.notify_on_registration_label')}
                description={t('admin.admin_settings.notify_on_registration_description')}
                checked={getSetting('NOTIFY_ON_REGISTRATION') === 'true'}
                onChange={(v) => updateSetting('NOTIFY_ON_REGISTRATION', v ? 'true' : 'false')}
              />
            </SectionCard>

            <SectionCard
              icon={faEnvelope}
              title={t('admin.admin_settings.email_settings_title')}
              description={t('admin.admin_settings.email_settings_description')}
            >
              <DynamicText
                label={t('admin.admin_settings.admin_email_label')}
                value={getSetting('ADMIN_EMAIL')}
                setValue={(v) => updateSetting('ADMIN_EMAIL', v)}
                placeholder="admin@example.com"
              />
              <DynamicText
                label={t('admin.admin_settings.sender_name_label')}
                value={getSetting('EMAIL_FROM_NAME')}
                setValue={(v) => updateSetting('EMAIL_FROM_NAME', v)}
                placeholder={t('admin.admin_settings.sender_name_placeholder')}
              />
            </SectionCard>
          </div>
        </Form>
      ),
    },
    {
      id: 'chatbot',
      label: t('admin.admin_settings.tab_chatbot'),
      icon: faRobot,
      content: (
        <Form
          actions={[{ label: t('admin.admin_settings.save_changes'), onClick: updateSettings, className: 'btn-primary' }]}
        >
          <div className="grid grid-cols-1 gap-4">
            <SectionCard
              icon={faRobot}
              title={t('admin.admin_settings.chatbot_settings_title')}
              description={t('admin.admin_settings.chatbot_settings_description')}
            >
              <DynamicText
                label={t('admin.admin_settings.system_prompt_label')}
                value={getSetting('CHATBOT_SYSTEM_PROMPT')}
                setValue={(v) => updateSetting('CHATBOT_SYSTEM_PROMPT', v)}
                isTextarea
                placeholder={t('admin.admin_settings.system_prompt_placeholder')}
              />
              <DynamicText
                label={t('admin.admin_settings.max_tokens_label')}
                value={getSetting('CHATBOT_MAX_TOKENS')}
                setValue={(v) => updateSetting('CHATBOT_MAX_TOKENS', v)}
                placeholder="1000"
              />
            </SectionCard>
          </div>
        </Form>
      ),
    },
  ]

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-2">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.admin_settings.title')}</h1>
          <p className="text-sm text-base-content/50 mt-1">{t('admin.admin_settings.description')}</p>
        </div>
      </div>

      {settings.length === 0 ? (
        <div className="flex justify-center items-center h-[400px]">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      ) : (
        <div className="bg-base-200 mt-4 rounded-xl min-h-[400px] p-5">
          <Tabs
            tabs={tabs}
            variant="boxed"
            size="md"
            defaultTab="general"
            contentClassName="pt-2"
          />
        </div>
      )}
    </div>
  )
}

export default Page
