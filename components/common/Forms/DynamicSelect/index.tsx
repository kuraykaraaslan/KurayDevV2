'use client'

import axiosInstance from '@/libs/axios'
import { useEffect, useState, useCallback, useRef, useMemo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import GenericElement, { GenericElementProps } from '../GenericElement'

/* ================= TYPES ================= */

export interface DynamicSelectOption {
  value: string
  label: string
}

interface DynamicSelectPropsBase<T = any> extends GenericElementProps {
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
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  disabledError?: string
  searchable?: boolean
  debounceMs?: number
  /** Render the dropdown via portal (fixed positioning) — use inside modals with overflow:auto */
  portal?: boolean
  /** Custom renderer for each option row in the dropdown list */
  renderOption?: (option: DynamicSelectOption) => ReactNode
  /** Custom renderer for the selected value shown in the trigger button (single mode only) */
  renderSelected?: (option: DynamicSelectOption) => ReactNode
  /** Show the "clear / placeholder" option at the top of the list (default: true, single only) */
  clearable?: boolean
}

type DynamicSelectProps<T = any> = DynamicSelectPropsBase<T> &
  (
    | { multi?: false | undefined; selectedValue: string; onValueChange: (value: string) => void }
    | { multi: true; selectedValue: string[]; onValueChange: (value: string[]) => void }
  )

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
  placeholder,
  searchPlaceholder,
  disabled = false,
  disabledError,
  searchable = true,
  debounceMs = 300,
  portal = false,
  renderOption,
  renderSelected,
  clearable = true,
  multi,
  selectedValue,
  onValueChange,
}: DynamicSelectProps<T>) => {
  const { t } = useTranslation()

  const isMulti = multi === true
  const isStaticMode = Array.isArray(optionsProp)

  const [options, setOptions] = useState<DynamicSelectOption[]>(optionsProp || [])
  const [resolvedSelectedLabel, setResolvedSelectedLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const portalListRef = useRef<HTMLDivElement>(null)
  const [portalRect, setPortalRect] = useState<DOMRect | null>(null)
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

  /* ================= RESOLVE SELECTED LABEL (single) ================= */

  useEffect(() => {
    if (isMulti) return
    const sv = selectedValue as string
    if (!sv) {
      setResolvedSelectedLabel(null)
      return
    }

    const match = options.find((o) => o.value === sv)
    if (match) {
      setResolvedSelectedLabel(match.label)
    }
  }, [options, selectedValue, isMulti])

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
      const inContainer = containerRef.current?.contains(event.target as Node)
      const inPortalList = portalListRef.current?.contains(event.target as Node)
      if (!inContainer && !inPortalList) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /* ================= HANDLERS ================= */

  const handleSelect = (value: string) => {
    if (isMulti) {
      const current = selectedValue as string[]
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      ;(onValueChange as (v: string[]) => void)(next)
      // keep dropdown open in multi mode
    } else {
      ;(onValueChange as (v: string) => void)(value)
      setIsOpen(false)
      setSearchTerm('')
    }
  }

  const handleRemoveMulti = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const current = selectedValue as string[]
    ;(onValueChange as (v: string[]) => void)(current.filter((v) => v !== value))
  }

  const handleClearMulti = (e: React.MouseEvent) => {
    e.stopPropagation()
    ;(onValueChange as (v: string[]) => void)([])
  }

  const defaultPlaceholder = placeholder || t('admin.selects.select_option')
  const defaultSearchPlaceholder = searchPlaceholder || t('admin.selects.search')

  const [showTooltip, setShowTooltip] = useState(false)

  /* ================= MULTI TRIGGER CONTENT ================= */

  const multiSelectedOptions = useMemo(() => {
    if (!isMulti) return []
    const sv = selectedValue as string[]
    return options.filter((o) => sv.includes(o.value))
  }, [isMulti, options, selectedValue])

  /* ================= RENDER ================= */

  return (
    <GenericElement className={className} label={label}>
      <div ref={containerRef} className="relative">
        {/* ---- Trigger ---- */}
        {isMulti ? (
          <div
            onClick={() => {
              if (disabled) return
              if (!isOpen && portal && btnRef.current) {
                setPortalRect(btnRef.current.getBoundingClientRect())
              }
              setIsOpen(!isOpen)
            }}
            onMouseEnter={() => {
              if (disabled && disabledError) setShowTooltip(true)
            }}
            onMouseLeave={() => setShowTooltip(false)}
            className={`select select-bordered w-full text-left flex items-center gap-1.5 flex-wrap h-auto min-h-12 py-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {multiSelectedOptions.length === 0 ? (
              <span className="opacity-50 flex-1">{defaultPlaceholder}</span>
            ) : (
              <>
                {multiSelectedOptions.map((opt) => (
                  <span
                    key={opt.value}
                    className="badge badge-primary badge-sm gap-1 cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {opt.label}
                    {!disabled && (
                      <button
                        type="button"
                        className="hover:text-error"
                        onClick={(e) => handleRemoveMulti(opt.value, e)}
                      >
                        <FontAwesomeIcon icon={faXmark} className="text-xs" />
                      </button>
                    )}
                  </span>
                ))}
              </>
            )}
            <div className="ml-auto flex items-center gap-1 shrink-0 pl-1">
              {multiSelectedOptions.length > 0 && !disabled && (
                <button
                  type="button"
                  className="text-base-content/40 hover:text-error"
                  onClick={handleClearMulti}
                >
                  <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                </button>
              )}
              <svg
                className={`w-4 h-4 transition-transform text-base-content/60 ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        ) : (
          <button
            ref={btnRef}
            type="button"
            onClick={() => {
              if (disabled) return
              if (!isOpen && portal && btnRef.current) {
                setPortalRect(btnRef.current.getBoundingClientRect())
              }
              setIsOpen(!isOpen)
            }}
            disabled={disabled}
            className="select select-bordered w-full text-left flex items-center justify-between"
            onMouseEnter={() => {
              if (disabled && disabledError) setShowTooltip(true)
            }}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span className={(selectedValue as string) ? '' : 'opacity-50'}>
              {(() => {
                if (!(selectedValue as string)) return defaultPlaceholder
                if (renderSelected) {
                  const opt = options.find((o) => o.value === (selectedValue as string))
                  if (opt) return renderSelected(opt)
                }
                return resolvedSelectedLabel || defaultPlaceholder
              })()}
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
        )}

        {showTooltip && disabled && disabledError && (
          <div className="absolute left-0 mt-1 z-50 bg-error text-error-content text-xs px-3 py-2 rounded shadow-lg whitespace-pre-line">
            {disabledError}
          </div>
        )}

        {/* ---- Dropdown ---- */}
        {isOpen && !disabled && (() => {
          const dropdownContent = (
            <div
              ref={portal ? portalListRef : undefined}
              style={
                portal && portalRect
                  ? { position: 'fixed', top: portalRect.bottom + 4, left: portalRect.left, width: portalRect.width, zIndex: 9999 }
                  : undefined
              }
              className={portal ? 'bg-base-100 border border-base-300 rounded-lg shadow-lg overflow-hidden' : 'absolute z-50 mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg overflow-hidden'}
            >
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
                    {/* Single mode: clearable placeholder row */}
                    {!isMulti && clearable && (
                      <button
                        type="button"
                        onClick={() => handleSelect('')}
                        className="w-full px-3 py-2 text-left hover:bg-base-200 text-base-content/50"
                      >
                        {defaultPlaceholder}
                      </button>
                    )}

                    {filteredOptions.map((option) => {
                      const isSelected = isMulti
                        ? (selectedValue as string[]).includes(option.value)
                        : option.value === (selectedValue as string)

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSelect(option.value)}
                          className={`w-full px-3 py-2 text-left hover:bg-base-200 flex items-center gap-2 ${
                            isSelected ? 'bg-primary/10 text-primary' : ''
                          }`}
                        >
                          {isMulti && (
                            <span
                              className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center ${
                                isSelected ? 'bg-primary border-primary' : 'border-base-content/30'
                              }`}
                            >
                              {isSelected && (
                                <svg className="w-2.5 h-2.5 text-primary-content" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                          )}
                          <span className="flex-1">
                            {renderOption ? renderOption(option) : option.label}
                          </span>
                        </button>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
          )

          return portal && typeof window !== 'undefined'
            ? createPortal(dropdownContent, document.body)
            : dropdownContent
        })()}
      </div>
    </GenericElement>
  )
}

export default DynamicSelect
