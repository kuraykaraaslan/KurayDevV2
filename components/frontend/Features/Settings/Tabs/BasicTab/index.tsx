'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import '../../styles/phoneInput.css'
import { useTranslation } from 'react-i18next'

import axiosInstance from '@/libs/axios'
import { useUserStore } from '@/libs/zustand'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import GenericElement from '@/components/admin/UI/Forms/GenericElement'

export default function BasicTab() {
  const { user, setUser } = useUserStore()
  const { t } = useTranslation()

  const [phone, setPhone] = useState(user?.phone || '')

  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await axiosInstance.put('/api/auth/me/basic', {
        phone,
      })

      setUser(res.data.user)
      toast.success(t('settings.basic_tab.toast_success'))
    } catch (err) {
      toast.error(t('settings.basic_tab.toast_error'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">
      <FormHeader title={t('settings.basic_tab.title')} titleClassName="text-lg" />
      <p className="text-sm text-base-content/70 -mt-4">
        {t('settings.basic_tab.description')}
      </p>

      <form className="space-y-6" onSubmit={handleSave}>
        <GenericElement label={t('settings.basic_tab.phone_label')}>
          <PhoneInput
            defaultCountry="TR"
            value={phone}
            onChange={(v) => setPhone(v || '')}
            className="input input-bordered w-full"
            placeholder={t('settings.basic_tab.phone_placeholder')}
          />
          {phone && !isValidPhoneNumber(phone) && (
            <p className="text-error text-sm mt-1">{t('settings.basic_tab.invalid_phone')}</p>
          )}
        </GenericElement>

        <GenericElement label={t('settings.basic_tab.email_label')}>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="input input-bordered w-full bg-base-200 opacity-70"
          />
          <label className="label">
            <span className="label-text-alt">{t('settings.basic_tab.email_note')}</span>
          </label>
        </GenericElement>

        <button disabled={loading} className="btn btn-primary w-full">
          {loading ? t('settings.basic_tab.saving') : t('settings.basic_tab.save')}
        </button>
      </form>
    </div>
  )
}
