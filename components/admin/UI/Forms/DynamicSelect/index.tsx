'use client'

import axiosInstance from '@/libs/axios'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import GenericElement, { GenericElementProps } from '../GenericElement'

/* ================= TYPES ================= */

export interface DynamicSelectOption {
  value: string
  label: string
}

interface DynamicSelectProps<T = any> extends GenericElementProps {
  /* API MODE */
  endpoint?: string
  dataKey?: string
  valueKey?: keyof T | string
  labelKey?: keyof T | string | Array<keyof T | string> | ((item: T) => string)
  searchKey?: string
  pageSize?: number

  /* STATIC MODE */
  options?: DynamicSelectOption[]

  /* COMMON */
  selectedValue: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  disabledError?: string
  searchable?: boolean
  debounceMs?: number
}

/* ================= COMPONENT ================= */

const DynamicSelect = <T,>({
  label,
  className = '',
  endpoint,
  dataKey,
  valueKey,
  labelKey,
  searchKey = 'search',
  pageSize = 100,
  options: optionsProp,
  selectedValue,
  onValueChange,
  placeholder,
  searchPlaceholder,
  disabled = false,
  disabledError,
  searchable = true,
  debounceMs = 300,
}: DynamicSelectProps<T>) => {
  const { t } = useTranslation()

  const isStaticMode = Array.isArray(optionsProp)

  const [options, setOptions] = useState<DynamicSelectOption[]>(optionsProp || [])
  const [resolvedSelectedLabel, setResolvedSelectedLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  /* ================= LABEL RESOLVER ================= */

  const getLabel = useCallback(
    (item: T): string => {
      if (typeof labelKey === 'function') {
        return labelKey(item)
      }

      if (Array.isArray(labelKey)) {
        for (const key of labelKey) {
          const val = (item as any)[key]
          if (val !== undefined && val !== null && val !== '') {
            return String(val)
          }
        }
        return ''
      }

      return String((item as any)[labelKey as any])
    },
    [labelKey]
  )

  /* ================= STATIC OPTIONS INIT ================= */

  useEffect(() => {
    if (isStaticMode && optionsProp) {
      setOptions(optionsProp)
    }
  }, [optionsProp, isStaticMode])

  /* ================= RESOLVE SELECTED LABEL ================= */

  useEffect(() => {
    if (!selectedValue) {
      setResolvedSelectedLabel(null)
      return
    }

    const match = options.find((o) => o.value === selectedValue)
    if (match) {
      setResolvedSelectedLabel(match.label)
    }
  }, [options, selectedValue])

  /* ================= DEBOUNCE ================= */

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, debounceMs)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchTerm, debounceMs])

  /* ================= API FETCH ================= */

  useEffect(() => {
    if (isStaticMode) return
    if (!endpoint || !dataKey || !valueKey || !labelKey) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.append('pageSize', String(pageSize))

        if (debouncedSearch.trim()) {
          params.append(searchKey, debouncedSearch.trim())
        }

        const response = await axiosInstance.get(`${endpoint}?${params.toString()}`)

        const data = response.data[dataKey]

        if (Array.isArray(data)) {
          setOptions(
            data.map((item: T) => ({
              value: String((item as any)[valueKey]),
              label: getLabel(item),
            }))
          )
        }
      } catch (err) {
        console.error('DynamicSelect fetch error:', err)
        setError(t('admin.selects.error_loading'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [
    endpoint,
    dataKey,
    valueKey,
    labelKey,
    pageSize,
    searchKey,
    debouncedSearch,
    getLabel,
    isStaticMode,
    t,
  ])

  /* ================= STATIC SEARCH ================= */

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm) return options

    return options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [options, searchTerm, searchable])

  /* ================= OUTSIDE CLICK ================= */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /* ================= HANDLERS ================= */

  const handleSelect = (value: string) => {
    onValueChange(value)
    setIsOpen(false)
    setSearchTerm('')
  }

  const defaultPlaceholder = placeholder || t('admin.selects.select_option')
  const defaultSearchPlaceholder = searchPlaceholder || t('admin.selects.search')

  const [showTooltip, setShowTooltip] = useState(false)

  /* ================= RENDER ================= */

  return (
    <GenericElement className={className} label={label}>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="select select-bordered w-full text-left flex items-center justify-between"
          onMouseEnter={() => {
            if (disabled && disabledError) setShowTooltip(true)
          }}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <span className={selectedValue ? '' : 'opacity-50'}>
            {resolvedSelectedLabel || defaultPlaceholder}
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

        {showTooltip && disabled && disabledError && (
          <div className="absolute left-0 mt-1 z-50 bg-error text-error-content text-xs px-3 py-2 rounded shadow-lg whitespace-pre-line">
            {disabledError}
          </div>
        )}

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg overflow-hidden">
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

            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-center text-base-content/50">
                  <span className="loading loading-spinner loading-sm mr-2" />
                  {t('admin.selects.loading')}
                </div>
              ) : error ? (
                <div className="p-3 text-center text-error">{error}</div>
              ) : filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-base-content/50">
                  {t('admin.selects.no_results')}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelect('')}
                    className="w-full px-3 py-2 text-left hover:bg-base-200 text-base-content/50"
                  >
                    {defaultPlaceholder}
                  </button>

                  {filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
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
    </GenericElement>
  )
}

export default DynamicSelect
