'use client';

import SettingsTabs from '@/components/frontend/Settings/SettingsTabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import useGlobalStore from '@/libs/zustand';

export default function SettingsPage() {
  const { user } = useGlobalStore();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4 pt-32">
      <div className="max-w-screen-xl mx-auto">
        {/* Page Header */}
        <div className="space-y-2 mb-6">
          <h1 className="text-4xl font-bold text-base-content">Ayarlar</h1>
          <p className="text-base-content/70">
            Hesap ayarlarınızı yönetin ve tercihlerinizi özelleştirin
          </p>
        </div>

        {/* User Info Card */}
        <div className="card bg-base-100 shadow-lg border border-base-200 mb-6">
          <div className="card-body">
            <div className="flex items-center gap-4">
              {user.userProfile.profilePicture ? (
                <img
                  src={user?.userProfile.profilePicture}
                  alt={user?.userProfile.name || 'Profil'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-base-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center border border-base-content/20">
                    <FontAwesomeIcon icon={faUser} className="text-3xl text-base-content/50" />
                </div>
              )}
              <div>
                <h2 className="card-title text-xl text-base-content">{user.userProfile.name || 'Kullanıcı'}</h2>
                <p className="text-sm text-base-content/70">{user?.email}</p>
                <p className="text-xs text-base-content/60 mt-1">
                  Üyelik Tarihi: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <SettingsTabs />
      </div>
    </div>
  );
}
