'use client';

import { useState } from 'react';
import ProfileTab from './ProfileTab';
import SecurityTab from './SecurityTab';
import PreferencesTab from './PreferencesTab';
import OTPTab from './OTPTab';


type TabType = 'profile' | 'security' | 'otp' | 'preferences';

export default function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

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
    <div className="w-full">
      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-base-300 px-4 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-all duration-200 relative ${
              activeTab === tab.id
                ? 'text-primary'
                : 'text-base-content/60 hover:text-base-content/80'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="hidden sm:inline text-sm">{tab.label}</span>
            
            {/* Active indicator */}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary/70" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        <div className="animate-fade-in">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'otp' && <OTPTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
        </div>
      </div>
    </div>
  );
}
