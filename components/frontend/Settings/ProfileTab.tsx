'use client';

import { useState } from 'react';
import { SafeUser, UpdateUser } from '@/types/UserTypes';

interface ProfileTabProps {
  user: SafeUser | null;
  onSave: (data: UpdateUser) => Promise<void>;
}

export default function ProfileTab({ user, onSave }: ProfileTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateUser>({
    name: user?.name || '',
    phone: user?.phone || '',
    profilePicture: user?.profilePicture || '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
      setSuccessMessage('Profil başarıyla güncellendi!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Profil güncellenirken hata oluştu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Name Field */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold">Ad</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            placeholder="Adınız"
            className="input input-bordered w-full"
          />
        </div>

        {/* Phone Field */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold">Telefon</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            placeholder="+90 (500) 123-4567"
            className="input input-bordered w-full"
          />
        </div>

        {/* Profile Picture URL */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold">Profil Resmi URL'si</span>
          </label>
          <input
            type="url"
            name="profilePicture"
            value={formData.profilePicture || ''}
            onChange={handleChange}
            placeholder="https://example.com/profile.jpg"
            className="input input-bordered w-full"
          />
        </div>

        {/* Current Email (Read-only) */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text font-semibold">E-mail Adresi</span>
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="input input-bordered w-full bg-base-200"
          />
          <label className="label">
            <span className="label-text-alt">E-mail adresiniz değiştirilemez</span>
          </label>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full"
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner"></span>
              Kaydediliyor...
            </>
          ) : (
            'Değişiklikleri Kaydet'
          )}
        </button>
      </form>
    </div>
  );
}
