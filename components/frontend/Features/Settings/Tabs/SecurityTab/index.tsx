'use client'

import { useState } from 'react'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import useGlobalStore from '@/libs/zustand'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import DynamicText from '@/components/admin/UI/Forms/DynamicText'
import PasskeyManager from '@/components/auth/PasskeyManager'
import { useTranslation } from 'react-i18next'

export default function SecurityTab() {
  const { setUser } = useGlobalStore()
  const { t } = useTranslation()
  const [data, setData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (data.newPassword !== data.confirmPassword) return toast.error(t('settings.security_tab.passwords_not_match'))

    setLoading(true)

    await axiosInstance
      .post('/api/auth/me/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      .then((res) => {
        toast.success(t('settings.security_tab.toast_success'))
        setUser(res.data.user)
        setData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || t('settings.security_tab.toast_error'))
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">
      <FormHeader title={t('settings.security_tab.title')} titleClassName="text-lg" />
      <p className="text-sm text-base-content/70 -mt-4">{t('settings.security_tab.description')}</p>

      <form className="space-y-6" onSubmit={submit}>
        <DynamicText
          label={t('settings.security_tab.current_password')}
          placeholder={t('settings.security_tab.current_password_placeholder')}
          value={data.currentPassword}
          setValue={(val) => setData((prev) => ({ ...prev, currentPassword: val }))}
        />

        <DynamicText
          label={t('settings.security_tab.new_password')}
          placeholder={t('settings.security_tab.new_password_placeholder')}
          value={data.newPassword}
          setValue={(val) => setData((prev) => ({ ...prev, newPassword: val }))}
        />

        <DynamicText
          label={t('settings.security_tab.confirm_password')}
          placeholder={t('settings.security_tab.confirm_password_placeholder')}
          value={data.confirmPassword}
          setValue={(val) => setData((prev) => ({ ...prev, confirmPassword: val }))}
        />

        <button disabled={loading} className="btn btn-primary w-full" type="submit">
          {loading ? t('settings.security_tab.changing') : t('settings.security_tab.save')}
        </button>
      </form>

      <div className="divider" />

      <PasskeyManager />
    </div>
  )
}
