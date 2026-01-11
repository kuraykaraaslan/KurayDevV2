'use client';

import ProfileTab from '../Tabs/ProfileTab';
import SecurityTab from '../Tabs/SecurityTab';
import PreferencesTab from '../Tabs/PreferencesTab';
import OTPTab from '../Tabs/OTPTab';
import BasicTab from '../Tabs/BasicTab';
import NotificationsTab from '../Tabs/NotificationsTab';
import { faGear, faLock, faNoteSticky, faRing, faSms, faUser } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import Tabs, { Tab } from '@/components/common/Layout/Tabs';

export default function SettingsTabs() {
    const { t } = useTranslation();

    const tabs: Tab[] = [
        {
            id: 'basic',
            label: t('frontend.settings.basic'),
            icon: faNoteSticky,
            content: <BasicTab />,
        },
        {
            id: 'profile',
            label: t('frontend.settings.profile'),
            icon: faUser,
            content: <ProfileTab />,
        },
        {
            id: 'security',
            label: t('frontend.settings.security'),
            icon: faLock,
            content: <SecurityTab />,
        },
        {
            id: 'otp',
            label: t('frontend.settings.otp'),
            icon: faSms,
            content: <OTPTab />,
        },
        {
            id: 'preferences',
            label: t('frontend.settings.preferences'),
            icon: faGear,
            content: <PreferencesTab />,
        },
        {
            id: 'notifications',
            label: t('frontend.settings.notifications'),
            icon: faRing,
            content: <NotificationsTab />,
        },
    ];

    return (
        <Tabs
            tabs={tabs}
            defaultTab="profile"
            variant="underline"
            size="md"
            tabsClassName="px-4 sm:px-0"
        />
    );
}
