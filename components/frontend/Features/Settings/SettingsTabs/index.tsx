'use client'

import { useState } from 'react'
import ProfileTab from '../Tabs/ProfileTab'
import SecurityTab from '../Tabs/SecurityTab'
import PreferencesTab from '../Tabs/PreferencesTab'
import OTPTab from '../Tabs/OTPTab'
import BasicTab from '../Tabs/BasicTab'
import NotificationsTab from '../Tabs/NotificationsTab'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faGear,
  faLock,
  faNoteSticky,
  faRing,
  faSms,
  faUser,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTranslation } from 'react-i18next'

interface Tab {
  id: string
  label: string
  icon: IconDefinition
  content: React.ReactNode
}

export default function SettingsTabs() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab['id']>('profile')

  const tabs: Tab[] = [
    {
      id: 'basic',
      label: t('settings.basic'),
      icon: faNoteSticky,
      content: <BasicTab />,
    },
    {
      id: 'profile',
      label: t('settings.profile'),
      icon: faUser,
      content: <ProfileTab />,
    },
    {
      id: 'security',
      label: t('settings.security'),
      icon: faLock,
      content: <SecurityTab />,
    },
    {
      id: 'otp',
      label: t('settings.otp'),
      icon: faSms,
      content: <OTPTab />,
    },
    {
      id: 'preferences',
      label: t('settings.preferences'),
      icon: faGear,
      content: <PreferencesTab />,
    },
    {
      id: 'notifications',
      label: t('settings.notifications'),
      icon: faRing,
      content: <NotificationsTab />,
    },
  ]

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
            <span className="text-lg">
              <FontAwesomeIcon icon={tab.icon} size="lg" />
            </span>
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
        <div className="animate-fade-in">{tabs.find((tab) => tab.id === activeTab)?.content}</div>
      </div>
    </div>
  )
}
