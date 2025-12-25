'use client';

import axiosInstance from '@/libs/axios';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from "react-i18next";

export interface DynamicSelectOption {
    value: string;
    label: string;
}

interface DynamicSelectProps<T = any> {
    endpoint: string;
    dataKey: string;
    valueKey: keyof T | string;
    labelKey: keyof T | string | Array<keyof T | string> | ((item: T) => string);
    searchKey?: string;
    pageSize?: number;
    selectedValue: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    disabled?: boolean;
    enabled?: boolean;
    disabledError?: string;
    searchable?: boolean;
    debounceMs?: number;
}

const DynamicSelect = <T,>({
    endpoint,
    dataKey,
    valueKey,
    labelKey,
    searchKey = 'search',
    pageSize = 100,
    selectedValue,
    onValueChange,
    placeholder,
    searchPlaceholder,
    className = "",
    disabled = false,
    disabledError,
    searchable = true,
    debounceMs = 300,
}: DynamicSelectProps<T>) => {
    const { t } = useTranslation();
    const [options, setOptions] = useState<DynamicSelectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const getLabel = useCallback((item: T): string => {
        if (typeof labelKey === 'function') {
            return labelKey(item);
        }
        if (Array.isArray(labelKey)) {
            for (const key of labelKey) {
                const val = (item as any)[key];
                if (val !== undefined && val !== null && val !== '') {
                    return val;
                }
            }
            return '';
        }
        return (item as any)[labelKey];
    }, [labelKey]);

    // Debounce search term
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        
        debounceTimer.current = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, debounceMs);

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [searchTerm, debounceMs]);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const params = new URLSearchParams();
                params.append('pageSize', String(pageSize));
                
                if (debouncedSearch.trim()) {
                    params.append(searchKey, debouncedSearch.trim());
                }
                
                const url = `${endpoint}?${params.toString()}`;
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

        if (isOpen) {
            fetchData();
        }
    }, [endpoint, dataKey, valueKey, pageSize, searchKey, debouncedSearch, getLabel, t, isOpen]);

    // Initial load for selected value display
    useEffect(() => {
        if (selectedValue && options.length === 0 && !isOpen) {
            const fetchInitial = async () => {
                try {
                    const url = `${endpoint}?pageSize=${pageSize}`;
                    const response = await axiosInstance.get(url);
                    const data = response.data[dataKey];

                    console.log("DynamicSelect initial fetch data:", data);
                    
                    if (Array.isArray(data)) {
                        const mappedOptions = data.map((item: T) => ({
                            value: (item as any)[valueKey],
                            label: getLabel(item),
                        }));
                        setOptions(mappedOptions);
                    }
                } catch (err) {
                    console.error('DynamicSelect initial fetch error:', err);
                }
            };
            fetchInitial();
        }
    }, [selectedValue]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (value: string) => {
        onValueChange(value);
        setIsOpen(false);
        setSearchTerm('');
    };

    const selectedLabel = options.find(opt => opt.value === selectedValue)?.label;
    const defaultPlaceholder = placeholder || t('admin.selects.select_option');
    const defaultSearchPlaceholder = searchPlaceholder || t('admin.selects.search');

    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Selected Value Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className="select select-bordered w-full text-left flex items-center justify-between"
                onMouseEnter={() => { if (disabled && disabledError) setShowTooltip(true); }}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <span className={selectedValue ? '' : 'opacity-50'}>
                    {selectedLabel || defaultPlaceholder}
                </span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Disabled error tooltip */}
            {showTooltip && disabled && disabledError && (
                <div className="absolute left-0 mt-1 z-50 bg-error text-error-content text-xs px-3 py-2 rounded shadow-lg whitespace-pre-line">
                    {disabledError}
                </div>
            )}

            {/* Dropdown */}
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                    {/* Search Input */}
                    {searchable && (
                        <div className="p-2 border-b border-base-300">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={defaultSearchPlaceholder}
                                className="input input-bordered input-sm w-full"
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Options List */}
                    <div className="overflow-y-auto max-h-48">
                        {loading ? (
                            <div className="p-3 text-center text-base-content/50">
                                <span className="loading loading-spinner loading-sm mr-2"></span>
                                {t('admin.selects.loading')}
                            </div>
                        ) : error ? (
                            <div className="p-3 text-center text-error">{error}</div>
                        ) : options.length === 0 ? (
                            <div className="p-3 text-center text-base-content/50">
                                {t('admin.selects.no_results')}
                            </div>
                        ) : (
                            <>
                                {/* Clear option */}
                                <button
                                    type="button"
                                    onClick={() => handleSelect('')}
                                    className="w-full px-3 py-2 text-left hover:bg-base-200 text-base-content/50"
                                >
                                    {defaultPlaceholder}
                                </button>
                                {options.map((option) => (
                                    <button
                                        type="button"
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className={`w-full px-3 py-2 text-left hover:bg-base-200 ${
                                            option.value === selectedValue ? 'bg-primary/10 text-primary' : ''
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DynamicSelect;