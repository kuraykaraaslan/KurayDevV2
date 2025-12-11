'use client';

import { useState } from 'react';
import { SafeUser, UpdateUser, OTPMethod } from '@/types/UserTypes';
import ProfileTab from './ProfileTab';
import SecurityTab from './SecurityTab';
import PreferencesTab from './PreferencesTab';
import OTPTab from './OTPTab';

interface SettingsTabsProps {
  user: SafeUser | null;
  onSave: (data: UpdateUser) => Promise<void>;
}

type TabType = 'profile' | 'security' | 'otp' | 'preferences';

export default function SettingsTabs({ user, onSave }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const handleOTPSave = async (methods: OTPMethod[]) => {
    // TODO: Implement actual OTP save API call
    console.log('OTP methods saved:', methods);
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    {
      id: 'profile',
      label: 'Profil',
      icon: '👤',
    },
    {
      id: 'security',
      label: 'Güvenlik',
      icon: '🔒',
    },
    {
      id: 'otp',
      label: '2FA',
      icon: '🔐',
    },
    {
      id: 'preferences',
      label: 'Tercihler',
      icon: '⚙️',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="tabs tabs-lifted border-b border-base-300">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab gap-2 font-semibold transition-all ${
              activeTab === tab.id
                ? 'tab-active bg-base-100 border-base-300 text-primary'
                : 'bg-base-200 hover:bg-base-300'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-base-100 rounded-b-lg shadow-md p-6">
        {activeTab === 'profile' && <ProfileTab user={user} onSave={onSave} />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'otp' && <OTPTab initialMethods={user?.otpMethods || []} onSave={handleOTPSave} />}
        {activeTab === 'preferences' && <PreferencesTab />}
      </div>
    </div>
  );
}
