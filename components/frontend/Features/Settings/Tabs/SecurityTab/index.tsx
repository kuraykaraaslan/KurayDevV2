'use client'

import { useState } from 'react'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import useGlobalStore from '@/libs/zustand'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import DynamicText from '@/components/admin/UI/Forms/DynamicText'

export default function SecurityTab() {
  const { setUser } = useGlobalStore()
  const [data, setData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (data.newPassword !== data.confirmPassword) return toast.error('Yeni şifreler eşleşmiyor')

    setLoading(true)

    await axiosInstance
      .post('/api/auth/me/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      .then((res) => {
        toast.success('Şifre başarıyla değiştirildi')
        setUser(res.data.user)
        setData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Şifre değiştirilemedi')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">
      <FormHeader title="Şifre Değiştir" titleClassName="text-lg" />
      <p className="text-sm text-base-content/70 -mt-4">Hesap güvenliğini artır.</p>

      <form className="space-y-6" onSubmit={submit}>
        <DynamicText
          label="Mevcut Şifre"
          placeholder="Mevcut şifrenizi girin"
          value={data.currentPassword}
          setValue={(val) => setData((prev) => ({ ...prev, currentPassword: val }))}
        />

        <DynamicText
          label="Yeni Şifre"
          placeholder="Yeni şifrenizi girin"
          value={data.newPassword}
          setValue={(val) => setData((prev) => ({ ...prev, newPassword: val }))}
        />

        <DynamicText
          label="Yeni Şifre (Tekrar)"
          placeholder="Yeni şifrenizi tekrar girin"
          value={data.confirmPassword}
          setValue={(val) => setData((prev) => ({ ...prev, confirmPassword: val }))}
        />

        <button disabled={loading} className="btn btn-primary w-full" type="submit">
          {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
        </button>
      </form>
    </div>
  )
}
