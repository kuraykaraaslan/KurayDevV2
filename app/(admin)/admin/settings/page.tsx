'use client';

import Tabs from '@/components/common/Layout/Tabs';
import {
    GeneralTab,
    AuthTab,
    EmailTab,
    SmsTab,
    StorageTab,
    AITab,
    SecurityTab
} from '@/components/admin/Settings/Tabs';
import {
    faCog,
    faUserShield,
    faEnvelope,
    faComment,
    faDatabase,
    faRobot,
    faShield
} from '@fortawesome/free-solid-svg-icons';

const Page = () => {
    const tabs = [
        {
            id: 'general',
            label: 'General',
            icon: faCog,
            content: <GeneralTab />
        },
        {
            id: 'auth',
            label: 'Authentication',
            icon: faUserShield,
            content: <AuthTab />
        },
        {
            id: 'email',
            label: 'Email',
            icon: faEnvelope,
            content: <EmailTab />
        },
        {
            id: 'sms',
            label: 'SMS',
            icon: faComment,
            content: <SmsTab />
        },
        {
            id: 'storage',
            label: 'Storage',
            icon: faDatabase,
            content: <StorageTab />
        },
        {
            id: 'ai',
            label: 'AI',
            icon: faRobot,
            content: <AITab />
        },
        {
            id: 'security',
            label: 'Security',
            icon: faShield,
            content: <SecurityTab />
        }
    ];

    return (
        <div className="container mx-auto">
            <div className="flex justify-between md:items-center flex-col md:flex-row mb-6">
                <h1 className="text-3xl font-bold h-16 flex items-center">Settings</h1>
                <div className="flex gap-2">
                    <button className="btn btn-primary" disabled>
                        Save Changes
                    </button>
                </div>
            </div>

            <Tabs
                tabs={tabs}
                defaultTab="general"
                variant="boxed"
                size="md"
                showLabelsOnMobile={false}
            />
        </div>
    );
};

export default Page;
