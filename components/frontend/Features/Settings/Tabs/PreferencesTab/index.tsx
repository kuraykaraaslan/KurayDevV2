'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import axiosInstance from '@/libs/axios'
import useGlobalStore from '@/libs/zustand'
import {
  UserPreferences,
  ThemeEnum,
  LanguageEnum,
  UserPreferencesDefault,
} from '@/types/user/UserTypes'
import * as countriesAndTimezones from 'countries-and-timezones'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import DynamicSelect from '@/components/admin/UI/Forms/DynamicSelect'

export default function PreferencesTab() {
  const { user, setUser } = useGlobalStore()

  const [userPreferences, setUserPreferences] = useState<UserPreferences>(
    user?.userPreferences || UserPreferencesDefault
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!user || saving) return

    setSaving(true)

    await axiosInstance
      .put('/api/auth/me/preferences', {
        userPreferences,
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

  const languageOptions = LanguageEnum.options.map((lang) => ({
    value: lang,
    label: lang.toUpperCase(),
  }))

  const themeOptions = ThemeEnum.options.map((theme) => ({
    value: theme,
    label: theme.toUpperCase(),
  }))

  const timezoneOptions = Object.entries(countriesAndTimezones.getAllTimezones()).map(
    ([tz, info]) => ({
      value: tz,
      label: `(GMT${info.utcOffsetStr}) ${info.name}`,
    })
  )

  const dateFormatOptions = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  ]

  const timeFormatOptions = [
    { value: '24H', label: '24 Saat' },
    { value: '12H', label: '12 Saat' },
  ]

  const firstDayOptions = [
    { value: 'MON', label: 'Pazartesi' },
    { value: 'SUN', label: 'Pazar' },
  ]

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-4">
      <FormHeader title="Kişisel Tercihler" titleClassName="text-lg" />
      <p className="text-sm text-base-content/70 -mt-2">Bildirim ve uygulama ayarlarını yönet.</p>

      <DynamicSelect
        label="Dil"
        options={languageOptions}
        selectedValue={userPreferences.language || 'EN'}
        onValueChange={(val) =>
          setUserPreferences({ ...userPreferences, language: val as UserPreferences['language'] })
        }
        searchable={false}
      />

      <DynamicSelect
        label="Tema"
        options={themeOptions}
        selectedValue={userPreferences.theme || 'SYSTEM'}
        onValueChange={(val) =>
          setUserPreferences({ ...userPreferences, theme: val as UserPreferences['theme'] })
        }
        searchable={false}
      />

      <DynamicSelect
        label="Zaman Dilimi"
        options={timezoneOptions}
        selectedValue={userPreferences.timezone || 'UTC'}
        onValueChange={(val) => setUserPreferences({ ...userPreferences, timezone: val })}
        searchable
      />

      <DynamicSelect
        label="Tarih Formatı"
        options={dateFormatOptions}
        selectedValue={userPreferences.dateFormat || 'DD/MM/YYYY'}
        onValueChange={(val) =>
          setUserPreferences({
            ...userPreferences,
            dateFormat: val as UserPreferences['dateFormat'],
          })
        }
        searchable={false}
      />

      <DynamicSelect
        label="Saat Formatı"
        options={timeFormatOptions}
        selectedValue={userPreferences.timeFormat || '24H'}
        onValueChange={(val) =>
          setUserPreferences({
            ...userPreferences,
            timeFormat: val as UserPreferences['timeFormat'],
          })
        }
        searchable={false}
      />

      <DynamicSelect
        label="Haftanın İlk Günü"
        options={firstDayOptions}
        selectedValue={userPreferences.firstDayOfWeek || 'MON'}
        onValueChange={(val) =>
          setUserPreferences({
            ...userPreferences,
            firstDayOfWeek: val as UserPreferences['firstDayOfWeek'],
          })
        }
        searchable={false}
      />

      <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full">
        {saving ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  )
}
