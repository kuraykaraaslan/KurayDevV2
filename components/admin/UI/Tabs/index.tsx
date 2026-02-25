'use client';

import { useState } from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export interface Tab {
    id: string;
    label: string;
    icon?: IconDefinition;
    content: React.ReactNode;
    disabled?: boolean;
}

export interface TabsProps {
    tabs: Tab[];
    defaultTab?: string;
    onChange?: (tabId: string) => void;
    className?: string;
    tabsClassName?: string;
    contentClassName?: string;
    variant?: 'underline' | 'boxed' | 'lifted';
    size?: 'sm' | 'md' | 'lg';
    showLabelsOnMobile?: boolean;
}

export default function Tabs({
    tabs,
    defaultTab,
    onChange,
    className = '',
    tabsClassName = '',
    contentClassName = '',
    variant = 'underline',
    size = 'md',
    showLabelsOnMobile = false,
}: TabsProps) {
    const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id || '');

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
        onChange?.(tabId);
    };

    const sizeClasses = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-3 text-base',
        lg: 'px-5 py-4 text-lg',
    };

    const iconSizes = {
        sm: 'sm' as const,
        md: 'lg' as const,
        lg: 'xl' as const,
    };

    const getVariantClasses = (isActive: boolean) => {
        switch (variant) {
            case 'boxed':
                return isActive
                    ? 'bg-primary text-primary-content rounded-lg'
                    : 'text-base-content/60 hover:text-base-content/80 hover:bg-base-200 rounded-lg';
            case 'lifted':
                return isActive
                    ? 'bg-base-100 text-primary border-t-2 border-x border-primary rounded-t-lg -mb-px'
                    : 'text-base-content/60 hover:text-base-content/80 bg-base-200 rounded-t-lg';
            case 'underline':
            default:
                return isActive
                    ? 'text-primary'
                    : 'text-base-content/60 hover:text-base-content/80';
        }
    };

    const getContainerClasses = () => {
        switch (variant) {
            case 'boxed':
                return 'flex gap-2 p-1 bg-base-200 rounded-xl overflow-x-auto scrollbar-thin scrollbar-thumb-base-300';
            case 'lifted':
                return 'flex gap-1 border-b border-base-300 overflow-x-auto scrollbar-thin scrollbar-thumb-base-300';
            case 'underline':
            default:
                return 'flex gap-2 border-b border-base-300 overflow-x-auto scrollbar-thin scrollbar-thumb-base-300';
        }
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Tabs Navigation */}
            <div className={`${getContainerClasses()} ${tabsClassName}`}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => !tab.disabled && handleTabClick(tab.id)}
                        disabled={tab.disabled}
                        className={`flex items-center gap-2 ${sizeClasses[size]} font-medium transition-all duration-200 relative whitespace-nowrap flex-shrink-0 ${getVariantClasses(activeTab === tab.id)} ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {tab.icon && (
                            <span className="text-lg">
                                <FontAwesomeIcon icon={tab.icon} size={iconSizes[size]} />
                            </span>
                        )}
                        <span className={showLabelsOnMobile ? '' : 'hidden sm:inline'}>
                            {tab.label}
                        </span>

                        {/* Active indicator for underline variant */}
                        {variant === 'underline' && activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary/70" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className={`mt-4 ${contentClassName}`}>
                <div className="animate-fade-in">
                    {tabs.find((tab) => tab.id === activeTab)?.content}
                </div>
            </div>
        </div>
    );
}

export { Tabs };
