'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import axiosInstance from '@/libs/axios'
import useGlobalStore from '@/libs/zustand'
import { UserProfile, UserProfileDefault } from '@/types/user/UserProfileTypes'
import DynamicText from '@/components/admin/UI/Forms/DynamicText'
import DynamicToggle from '@/components/admin/UI/Forms/DynamicToggle'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import SocialLinksInput from './partials/SocialLinksInput'
import ImageLoad from '@/components/common/UI/Images/ImageLoad'

export default function ProfileTab() {
  const { user, setUser } = useGlobalStore()

  const [userProfile, setUserProfile] = useState<UserProfile>(
    user?.userProfile || UserProfileDefault
  )
  const [saving, setSaving] = useState(false)

  const handleUsernameChange = (val: string) => {
    // lowercase, sadece a-z 0-9 ve _ karakterlerine izin ver
    const sanitized = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUserProfile({ ...userProfile, username: sanitized || null })
  }

  const handleSave = async () => {
    if (!user || saving) return

    setSaving(true)

    await axiosInstance
      .put('/api/auth/me/profile', {
        userProfile,
      })
      .then((res) => {
        setUser({
          ...user,
          userProfile: res.data.userProfile,
        })
        toast.success('Profil başarıyla güncellendi')
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Profil güncellenirken hata oluştu')
      })
      .finally(() => {
        setSaving(false)
      })
  }

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">
      <FormHeader title="Profil Ayarları" titleClassName="text-lg" />
      <p className="text-sm text-base-content/70 -mt-4">
        Profilini düzenle ve sosyal medya bağlantılarını ekle.
      </p>

      <DynamicText
        label="İsim"
        placeholder="Adınız Soyadınız"
        value={userProfile.name || ''}
        setValue={(val) => setUserProfile({ ...userProfile, name: val })}
      />

      {/* Username */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold">Kullanıcı Adı</span>
          {userProfile.username && (
            <span className="label-text-alt text-base-content/40 font-mono">
              /users/{userProfile.username}
            </span>
          )}
        </label>
        <div className="input input-bordered flex items-center gap-1">
          <span className="text-base-content/40 select-none text-sm">@</span>
          <input
            type="text"
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="kullanici_adi"
            value={userProfile.username || ''}
            onChange={(e) => handleUsernameChange(e.target.value)}
            maxLength={32}
          />
        </div>
        <label className="label">
          <span className="label-text-alt text-base-content/40">
            Sadece küçük harf, rakam ve alt çizgi (_). Boş bırakılırsa kullanıcı ID kullanılır.
          </span>
        </label>
      </div>

      <DynamicText
        label="Biyografi"
        placeholder="Kendinizi kısaca tanıtın..."
        value={userProfile.biography || ''}
        setValue={(val) => setUserProfile({ ...userProfile, biography: val })}
        isTextarea
      />

      <ImageLoad
        label="Profil Fotoğrafı"
        image={userProfile.profilePicture || ''}
        setImage={(val) => setUserProfile({ ...userProfile, profilePicture: val })}
        uploadFolder="users"
        toast={toast}
        aspect={1}
        width={256}
        height={256}
      />

      <ImageLoad
        label="Kapak Fotoğrafı"
        image={userProfile.headerImage || ''}
        setImage={(val) => setUserProfile({ ...userProfile, headerImage: val })}
        uploadFolder="users"
        toast={toast}
        aspect={16 / 5}
        width={384}
        height={120}
      />

      <SocialLinksInput
        value={userProfile.socialLinks || []}
        onChange={(links) => setUserProfile({ ...userProfile, socialLinks: links })}
      />

      {/* Gizlilik */}
      <div className="border-t border-base-300 pt-4">
        <p className="text-sm font-semibold mb-3">Gizlilik</p>
        <DynamicToggle
          label="Profili arama motorlarından gizle"
          description="Açık olduğunda profil sayfan Google ve diğer arama motorları tarafından indexlenmez."
          checked={userProfile.hideProfileFromIndex ?? true}
          onChange={(val) => setUserProfile({ ...userProfile, hideProfileFromIndex: val })}
        />
      </div>

      <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full">
        {saving ? 'Kaydediliyor...' : 'Profili Kaydet'}
      </button>
    </div>
  )
}
