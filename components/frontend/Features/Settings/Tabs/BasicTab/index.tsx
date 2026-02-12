'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import '../../styles/phoneInput.css'

import axiosInstance from '@/libs/axios'
import useGlobalStore from '@/libs/zustand'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import GenericElement from '@/components/admin/UI/Forms/GenericElement'

export default function BasicTab() {
  const { user, setUser } = useGlobalStore()

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
      toast.success('Profil başarıyla güncellendi')
    } catch (err) {
      toast.error('Profil güncellenirken hata oluştu')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">
      <FormHeader title="Profil Bilgileri" titleClassName="text-lg" />
      <p className="text-sm text-base-content/70 -mt-4">
        Buradan profil bilgilerini güncelleyebilirsin.
      </p>

      <form className="space-y-6" onSubmit={handleSave}>
        <GenericElement label="Telefon">
          <PhoneInput
            defaultCountry="TR"
            value={phone}
            onChange={(v) => setPhone(v || '')}
            className="input input-bordered w-full"
            placeholder="+90 5XX XXX XX XX"
          />
          {phone && !isValidPhoneNumber(phone) && (
            <p className="text-error text-sm mt-1">Geçersiz telefon numarası</p>
          )}
        </GenericElement>

        <GenericElement label="E-mail Adresi">
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="input input-bordered w-full bg-base-200 opacity-70"
          />
          <label className="label">
            <span className="label-text-alt">E-mail adresi değiştirilemez</span>
          </label>
        </GenericElement>

        <button disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Kaydediliyor...' : 'Profili Kaydet'}
        </button>
      </form>
    </div>
  )
}
