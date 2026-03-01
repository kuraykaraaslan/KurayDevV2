'use client'
import { useEffect, useRef, useState } from 'react'
import { AVAILABLE_LANGUAGES, LANG_FLAGS, LANG_NAMES } from '@/types/common/I18nTypes'

export { LANG_NAMES }

interface LanguageBarProps {
  activeLang: string
  addedLangs: string[]
  savedLangs: string[]
  onSelect: (lang: string) => void
  onAdd: (lang: string) => void
  onDelete: (lang: string) => void
  /** Which language is treated as the source/base content. Default: 'en' */
  sourceLang?: string
  onSourceLangChange?: (lang: string) => void
}

const LanguageBar = ({
  activeLang,
  addedLangs,
  savedLangs,
  onSelect,
  onAdd,
  onDelete,
  sourceLang: sourceLangProp = 'en',
  onSourceLangChange,
}: LanguageBarProps) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [search, setSearch] = useState('')
  const [sourceLang, setSourceLang] = useState(sourceLangProp)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const sourceDropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const tabs = [sourceLang, ...addedLangs.filter((l) => l !== sourceLang)]

  const availableToAdd = AVAILABLE_LANGUAGES.filter(
    (l) => l !== sourceLang && !addedLangs.includes(l)
  )
  const filteredAvailable = availableToAdd.filter(
    (l) =>
      LANG_NAMES[l].toLowerCase().includes(search.toLowerCase()) ||
      l.toLowerCase().includes(search.toLowerCase())
  )

  // All languages currently in use (for source selection)
  const allCurrentLangs = [sourceLang, ...addedLangs.filter((l) => l !== sourceLang)]

  const totalTranslatable = AVAILABLE_LANGUAGES.length - 1
  const completedCount = savedLangs.length

  const handleSourceLangChange = (lang: string) => {
    setSourceLang(lang)
    onSourceLangChange?.(lang)
    setShowSourceDropdown(false)
  }

  useEffect(() => {
    if (!showDropdown) { setSearch(''); return }
    setTimeout(() => searchRef.current?.focus(), 50)
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDropdown])

  useEffect(() => {
    if (!showSourceDropdown) return
    const handler = (e: MouseEvent) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(e.target as Node)) {
        setShowSourceDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSourceDropdown])

  return (
    <div className="mb-6 rounded-xl border border-base-content/10 bg-base-200/60">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-base-content/10">
        <div className="flex items-center gap-2">
          <span className="text-base-content/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </span>
          <span className="text-sm font-medium text-base-content/70 tracking-wide">
            Content Language
          </span>
        </div>

        {/* Right side: source lang selector + progress */}
        <div className="flex items-center gap-4">
          {/* Source language selector */}
          <div className="relative" ref={sourceDropdownRef}>
            <button
              type="button"
              title="Change source language"
              onClick={() => setShowSourceDropdown((v) => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all duration-150 ${
                showSourceDropdown
                  ? 'border-primary/50 bg-primary/8 text-primary'
                  : 'border-base-content/15 bg-base-content/5 text-base-content/50 hover:border-base-content/25 hover:text-base-content/80'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 0 1 6.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span className="font-medium">
                {LANG_FLAGS[sourceLang]} {sourceLang.toUpperCase()}
              </span>
              <span className="text-base-content/30 text-[10px] tracking-wider">SRC</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 text-base-content/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {showSourceDropdown && (
              <div className="absolute top-full right-0 mt-2 bg-base-100 border border-base-content/15 rounded-xl shadow-2xl z-50 w-48 overflow-hidden">
                <div className="px-3 py-2 border-b border-base-content/8">
                  <p className="text-[10px] font-semibold text-base-content/40 uppercase tracking-widest">
                    Source Language
                  </p>
                </div>
                <div className="py-1 max-h-48 overflow-y-auto">
                  {allCurrentLangs.map((lang) => {
                    const isSelected = sourceLang === lang
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleSourceLangChange(lang)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                          isSelected
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-base-200 text-base-content'
                        }`}
                      >
                        <span className="text-base leading-none">{LANG_FLAGS[lang]}</span>
                        <span className="flex-1 font-medium">{LANG_NAMES[lang]}</span>
                        <span className="text-xs font-mono text-base-content/40">{lang.toUpperCase()}</span>
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: totalTranslatable }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-3 rounded-full transition-all ${
                    i < completedCount ? 'bg-success' : 'bg-base-content/15'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-base-content/40 font-mono">
              {completedCount}/{totalTranslatable}
            </span>
          </div>
        </div>
      </div>

      {/* Language pills */}
      <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
        {tabs.map((lang) => {
          const isActive = activeLang === lang
          const isSaved = lang === sourceLang || savedLangs.includes(lang)
          const isSource = lang === sourceLang

          return (
            <div key={lang} className="relative group flex items-center">
              <button
                type="button"
                onClick={() => onSelect(lang)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-150 select-none
                  ${isActive
                    ? 'bg-primary text-primary-content shadow-md shadow-primary/20 scale-105'
                    : isSaved
                      ? 'bg-success/15 text-success border border-success/30 hover:bg-success/25'
                      : 'bg-base-content/5 text-base-content/60 border border-base-content/10 hover:bg-base-content/10 hover:text-base-content'
                  }
                `}
              >
                <span className="text-base leading-none">{LANG_FLAGS[lang]}</span>
                <span className="font-mono tracking-wider">{lang.toUpperCase()}</span>
                {isSource && (
                  <span className={`text-[9px] font-bold tracking-widest px-1 py-0.5 rounded ${
                    isActive ? 'bg-primary-content/20 text-primary-content' : 'bg-base-content/10 text-base-content/40'
                  }`}>
                    SRC
                  </span>
                )}
                {isSaved && !isActive && !isSource && (
                  <span className="w-1.5 h-1.5 rounded-full bg-success/70" />
                )}
              </button>

              {/* Delete button — appears on hover, not for source lang */}
              {!isSource && (
                <button
                  type="button"
                  title={`Remove ${LANG_NAMES[lang]}`}
                  onClick={() => onDelete(lang)}
                  className="
                    absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full
                    bg-error text-error-content text-xs font-bold
                    hidden group-hover:flex items-center justify-center
                    shadow-sm hover:scale-110 transition-transform
                  "
                >
                  ×
                </button>
              )}
            </div>
          )
        })}

        {/* Add language */}
        {availableToAdd.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown((v) => !v)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                border border-dashed border-base-content/20 text-base-content/40
                hover:border-primary/50 hover:text-primary hover:bg-primary/5
                transition-all duration-150
                ${showDropdown ? 'border-primary/50 text-primary bg-primary/5' : ''}
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add language
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-base-100 border border-base-content/15 rounded-xl shadow-2xl z-50 w-56 overflow-hidden">
                {/* Search */}
                <div className="p-2 border-b border-base-content/10">
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search language..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input input-sm w-full bg-base-200/50 border-none text-sm"
                  />
                </div>

                {/* Language list */}
                <div className="max-h-56 overflow-y-auto py-1">
                  {filteredAvailable.length === 0 ? (
                    <p className="text-center text-xs text-base-content/40 py-4">No results</p>
                  ) : (
                    filteredAvailable.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          onAdd(lang)
                          setShowDropdown(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-base-200 flex items-center gap-3 transition-colors"
                      >
                        <span className="text-lg leading-none">{LANG_FLAGS[lang]}</span>
                        <div className="flex flex-col">
                          <span className="font-medium text-base-content">{LANG_NAMES[lang]}</span>
                          <span className="text-xs text-base-content/40 font-mono">{lang.toUpperCase()}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default LanguageBar
