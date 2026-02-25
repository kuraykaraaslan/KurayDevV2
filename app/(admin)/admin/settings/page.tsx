'use client'
import { useState, useEffect } from 'react'
import axiosInstance from '@/libs/axios'
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
} from '@fortawesome/free-solid-svg-icons'

const Page = () => {
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
      label: 'Genel',
      icon: faGear,
      content: (
        <Form
          actions={[{ label: 'Değişiklikleri Kaydet', onClick: updateSettings, className: 'btn-primary' }]}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard
              icon={faGlobe}
              title="Site Bilgileri"
              description="Sitenizin genel kimlik bilgilerini düzenleyin"
            >
              <DynamicText
                label="Site Adı"
                value={getSetting('SITE_NAME')}
                setValue={(v) => updateSetting('SITE_NAME', v)}
                placeholder="Sitenizin adını girin"
              />
              <DynamicText
                label="Site Açıklaması"
                value={getSetting('SITE_DESCRIPTION')}
                setValue={(v) => updateSetting('SITE_DESCRIPTION', v)}
                isTextarea
              />
            </SectionCard>

            <SectionCard
              icon={faSlidersH}
              title="Site Davranışı"
              description="Sitenizin genel işleyiş tercihlerini ayarlayın"
            >
              <DynamicToggle
                label="Kayıt İzni"
                description="Yeni kullanıcıların sisteme kaydolmasına izin ver"
                checked={getSetting('ALLOW_REGISTRATION') === 'true'}
                onChange={(v) => updateSetting('ALLOW_REGISTRATION', v ? 'true' : 'false')}
              />
              <DynamicToggle
                label="Bakım Modu"
                description="Siteyi bakım moduna al, ziyaretçilere bakım sayfası gösterilir"
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
      label: 'Güvenlik',
      icon: faShieldHalved,
      content: (
        <Form
          actions={[{ label: 'Değişiklikleri Kaydet', onClick: updateSettings, className: 'btn-primary' }]}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard
              icon={faUserShield}
              title="Hesap Güvenliği"
              description="Kullanıcı hesaplarına ilişkin güvenlik kuralları"
            >
              <DynamicToggle
                label="E-posta Doğrulama Zorunluluğu"
                description="Kayıt sonrası e-posta adresi doğrulanmadan giriş yapılamasın"
                checked={getSetting('REQUIRE_EMAIL_VERIFICATION') === 'true'}
                onChange={(v) => updateSetting('REQUIRE_EMAIL_VERIFICATION', v ? 'true' : 'false')}
              />
            </SectionCard>

            <SectionCard
              icon={faLockOpen}
              title="Giriş Sınırlamaları"
              description="Başarısız giriş denemelerine karşı koruma ayarları"
            >
              <DynamicText
                label="Maksimum Giriş Denemesi"
                value={getSetting('MAX_LOGIN_ATTEMPTS')}
                setValue={(v) => updateSetting('MAX_LOGIN_ATTEMPTS', v)}
                placeholder="5"
              />
              <DynamicText
                label="Oturum Zaman Aşımı (dakika)"
                value={getSetting('SESSION_TIMEOUT')}
                setValue={(v) => updateSetting('SESSION_TIMEOUT', v)}
                placeholder="60"
              />
            </SectionCard>

            <div className="lg:col-span-2">
              <SectionCard
                icon={faServer}
                title="Domain Kısıtlamaları"
                description="Yalnızca belirtilen domain'lerden kayıt yapılmasına izin ver. Boş bırakılırsa kısıtlama uygulanmaz."
              >
                <DynamicCommaSeperatedText
                  label="İzin Verilen E-posta Domain'leri"
                  values={
                    getSetting('ALLOWED_DOMAINS')
                      ? getSetting('ALLOWED_DOMAINS').split(',').filter(Boolean)
                      : []
                  }
                  setValues={(v) => updateSetting('ALLOWED_DOMAINS', v.join(','))}
                  placeholder="örn: example.com, company.org"
                />
              </SectionCard>
            </div>
          </div>
        </Form>
      ),
    },
    {
      id: 'notifications',
      label: 'Bildirimler',
      icon: faBell,
      content: (
        <Form
          actions={[{ label: 'Değişiklikleri Kaydet', onClick: updateSettings, className: 'btn-primary' }]}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard
              icon={faBellSlash}
              title="Bildirim Tercihleri"
              description="Hangi durumlarda bildirim gönderileceğini seçin"
            >
              <DynamicToggle
                label="E-posta Bildirimleri"
                description="Sistem genelinde e-posta bildirimlerini etkinleştir"
                checked={getSetting('ENABLE_EMAIL_NOTIFICATIONS') === 'true'}
                onChange={(v) => updateSetting('ENABLE_EMAIL_NOTIFICATIONS', v ? 'true' : 'false')}
              />
              <DynamicToggle
                label="Yeni Kayıt Bildirimi"
                description="Yeni kullanıcı kaydında admin'e bildirim gönderilsin"
                checked={getSetting('NOTIFY_ON_REGISTRATION') === 'true'}
                onChange={(v) => updateSetting('NOTIFY_ON_REGISTRATION', v ? 'true' : 'false')}
              />
            </SectionCard>

            <SectionCard
              icon={faEnvelope}
              title="E-posta Ayarları"
              description="Gönderilen e-postalarda kullanılacak bilgiler"
            >
              <DynamicText
                label="Admin E-posta Adresi"
                value={getSetting('ADMIN_EMAIL')}
                setValue={(v) => updateSetting('ADMIN_EMAIL', v)}
                placeholder="admin@example.com"
              />
              <DynamicText
                label="Gönderici Adı"
                value={getSetting('EMAIL_FROM_NAME')}
                setValue={(v) => updateSetting('EMAIL_FROM_NAME', v)}
                placeholder="Site Yönetimi"
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
          <h1 className="text-3xl font-bold">Ayarlar</h1>
          <p className="text-sm text-base-content/50 mt-1">Sistem genelindeki yapılandırma seçenekleri</p>
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
