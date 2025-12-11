'use client';

import { useEffect, useState } from 'react';
import { SafeUser, UpdateUser } from '@/types/UserTypes';
import SettingsTabs from '@/components/frontend/Settings/SettingsTabs';

export default function SettingsPage() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call to get current user
        // const response = await fetch('/api/users/me');
        // const data = await response.json();
        // setUser(data);

        // Mock user data for now
        setUser({
          userId: '1',
          email: 'user@example.com',
          name: 'John Doe',
          phone: '+90 (500) 123-4567',
          profilePicture: '',
          userRole: 'USER',
          createdAt: new Date(),
          updatedAt: new Date(),
          otpMethods: [],
        });
      } catch (err) {
        setError('Kullanıcı bilgileri yüklenemedi');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSave = async (data: UpdateUser) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/users/me', {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      // const updatedUser = await response.json();
      // setUser(updatedUser);

      // Mock update for now
      setUser((prev) => (prev ? { ...prev, ...data } : null));
    } catch (err) {
      console.error('Kullanıcı bilgileri güncellenirken hata oluştu:', err);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="alert alert-error max-w-md">
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
              d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m2-2l2 2"
            />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4 pt-32">
      <div className="max-w-screen-xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-base-content">Ayarlar</h1>
          <p className="text-base-content/70">
            Hesap ayarlarınızı yönetin ve tercihlerinizi özelleştirin
          </p>
        </div>

        {/* User Info Card */}
        <div className="card bg-gradient-to-r from-base-300 to-base-200 shadow-lg border border-base-300">
          <div className="card-body">
            <div className="flex items-center gap-4">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name || 'Profil'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-base-content/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center border border-base-content/20">
                  <span className="text-2xl">👤</span>
                </div>
              )}
              <div>
                <h2 className="card-title text-xl text-base-content">{user?.name || 'Kullanıcı'}</h2>
                <p className="text-sm text-base-content/70">{user?.email}</p>
                <p className="text-xs text-base-content/60 mt-1">
                  Üyelik Tarihi: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <SettingsTabs user={user} onSave={handleSave} />
      </div>
    </div>
  );
}
