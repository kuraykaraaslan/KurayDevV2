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
}

const LanguageBar = ({
  activeLang,
  addedLangs,
  savedLangs,
  onSelect,
  onAdd,
  onDelete,
}: LanguageBarProps) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const availableToAdd = AVAILABLE_LANGUAGES.filter(
    (l) => l !== 'en' && !addedLangs.includes(l)
  )
  const filteredAvailable = availableToAdd.filter(
    (l) =>
      LANG_NAMES[l].toLowerCase().includes(search.toLowerCase()) ||
      l.toLowerCase().includes(search.toLowerCase())
  )

  const tabs = ['en', ...addedLangs]
  const totalTranslatable = AVAILABLE_LANGUAGES.length - 1
  const completedCount = savedLangs.length

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

        {/* Progress */}
        <div className="flex items-center gap-3">
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
          const isSaved = lang === 'en' || savedLangs.includes(lang)
          const isEN = lang === 'en'

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
                {isSaved && !isActive && !isEN && (
                  <span className="w-1.5 h-1.5 rounded-full bg-success/70" />
                )}
              </button>

              {/* Delete button — appears on hover, not for EN */}
              {!isEN && (
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
