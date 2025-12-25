'use client';

import axiosInstance from '@/libs/axios';
import { ChangeEvent, useEffect, useState, useCallback } from 'react';
import { useTranslation } from "react-i18next";

export interface DynamicSelectOption {
    value: string;
    label: string;
}

interface DynamicSelectProps<T = any> {
    endpoint: string;
    dataKey: string;
    valueKey: keyof T | string;
    labelKey: keyof T | string | ((item: T) => string);
    pageSize?: number;
    selectedValue: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

const DynamicSelect = <T,>({
    endpoint,
    dataKey,
    valueKey,
    labelKey,
    pageSize = 100,
    selectedValue,
    onValueChange,
    placeholder,
    className = "select select-bordered w-full",
    disabled = false,
}: DynamicSelectProps<T>) => {
    const { t } = useTranslation();
    const [options, setOptions] = useState<DynamicSelectOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getLabel = useCallback((item: T): string => {
        if (typeof labelKey === 'function') {
            return labelKey(item);
        }
        return (item as any)[labelKey];
    }, [labelKey]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const url = `${endpoint}?pageSize=${pageSize}`;
                    
                const response = await axiosInstance.get(url);
                const data = response.data[dataKey];
                
                if (Array.isArray(data)) {
                    const mappedOptions = data.map((item: T) => ({
                        value: (item as any)[valueKey],
                        label: getLabel(item),
                    }));
                    setOptions(mappedOptions);
                }
            } catch (err) {
                setError(t('admin.selects.error_loading'));
                console.error('DynamicSelect fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [endpoint, dataKey, valueKey, pageSize, getLabel, t]);

    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
        onValueChange(e.target.value);
    };

    const defaultPlaceholder = placeholder || t('admin.selects.select_option');

    return (
        <div>
            <select
                value={selectedValue}
                onChange={handleChange}
                className={className}
                disabled={disabled || loading}
            >
                <option value="">
                    {loading ? t('admin.selects.loading') : defaultPlaceholder}
                </option>
                {error && <option disabled>{error}</option>}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default DynamicSelect;
