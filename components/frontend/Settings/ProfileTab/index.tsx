'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';

import axiosInstance from '@/libs/axios';
import useGlobalStore from '@/libs/zustand';
import ImageLoad from '@/components/common/ImageLoad';
import { SocialLinks } from '@/types/UserProfileTypes';
import SocialLinksInput from './partials/SocialLinksInput';

export default function ProfileTab() {
  const { user, setUser } = useGlobalStore();

  const [name, setName] = useState(user?.name || '');
  const [biography, setBiography] = useState(user?.userProfile.biography || '');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(user?.userProfile.socialLinks || []);
  const [profilePicture, setProfilePicture] = useState(user?.userProfile.profilePicture || '');
  const [headerImage, setHeaderImage] = useState(user?.userProfile.headerImage || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axiosInstance.put('/api/users/me', {
        name,
        profilePicture,
      });

      setUser(res.data.user);
      toast.success("Profil başarıyla güncellendi");
    } catch (err) {
      toast.error("Profil güncellenirken hata oluştu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm p-6 space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold">Profil Bilgileri</h2>
        <p className="text-sm text-base-content/70">
          Buradan profil bilgilerini güncelleyebilirsin.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSave}>

        {/* Name */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold">Ad</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tam adınızı girin"
            className="input input-bordered w-full"
            required
          />
        </div>
        {/* Biography */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold">Biyografi</span>
          </label>
          <textarea
            value={biography}
            onChange={e => setBiography(e.target.value)}
            placeholder="Kendiniz hakkında kısa bir bilgi yazın"
            className="textarea textarea-bordered w-full"
            rows={4}
          />
        </div>

        { /* Social Links */}
        <SocialLinksInput
          value={socialLinks}
          onChange={setSocialLinks}
        />

        {/* Profile Image */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold">Profil Fotoğrafı</span>
          </label>

          <ImageLoad
            setImage={setProfilePicture}
            image={profilePicture}
            uploadFolder="users"
            toast={toast}
          />
        </div>

        {/* Header Image */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold">Başlık Resmi</span>
          </label>

          <ImageLoad
            setImage={setHeaderImage}
            image={headerImage}
            uploadFolder="users"
            toast={toast}
          />
        </div>

        {/* Save Button */}
        <button disabled={loading} className="btn btn-primary w-full">
          {loading ? "Kaydediliyor..." : "Profili Kaydet"}
        </button>
      </form>

    </div>
  );
}
