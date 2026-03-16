'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faB, faMagnifyingGlass, faP, faSpinner } from '@fortawesome/free-solid-svg-icons'
import HeadlessModal, { useModal } from '@/components/common/Modal'
import { ResultElement } from './partials/ResultElement'
import { SearchResultItemType, SearchType } from '@/types/content/SearchTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import { useRouter, usePathname } from 'next/navigation'
import { getCurrentLangFromPathname, localizePath } from '@/libs/i18n/localePath'

const RESULT_ID_PREFIX = 'search-result-'

const SearchButton = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()

  const { open, openModal, closeModal } = useModal(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResultItemType[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const [searchTypes] = useState<SearchType[]>([SearchType.BLOG, SearchType.PROJECT])

  const toggleSearchType = (type: SearchType) => {
    if (searchTypes.includes(type)) {
      const index = searchTypes.indexOf(type)
      searchTypes.splice(index, 1)
    } else {
      searchTypes.push(type)
    }
  }

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  /* Reset active index whenever results change */
  useEffect(() => {
    setActiveIndex(-1)
  }, [results])

  /* Reset state when modal closes */
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setResults([])
      setActiveIndex(-1)
    }
  }, [open])

  /** Debounce Search & Cleanup */
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setResults([])
      setLoading(false)
      return
    }

    const timer = setTimeout(() => {
      search(searchQuery)
    }, 500)

    return () => {
      clearTimeout(timer)
    }
  }, [searchQuery, searchTypes])

  const search = async (q: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)

    await axiosInstance
      .get('/api/search' + `?q=${encodeURIComponent(q)}`, { signal: controller.signal })
      .then((response) => {
        const data = response.data

        const filteredResults = data.hits.filter((hit: SearchResultItemType) =>
          searchTypes.includes(hit.type)
        )

        setResults(filteredResults)
      })
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') {
          console.error('Search error:', error)
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }

  /** Navigate to the selected result and close modal */
  const navigateToResult = useCallback(
    (item: SearchResultItemType) => {
      const currentLang = getCurrentLangFromPathname(pathname)
      const localizedPath = localizePath(item.path, currentLang, false)
      closeModal()
      router.push(localizedPath)
    },
    [closeModal, pathname, router]
  )

  /** Scroll the active item into view inside the results container */
  const scrollActiveIntoView = useCallback((index: number) => {
    const el = document.getElementById(`${RESULT_ID_PREFIX}${index}`)
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [])

  /** Keyboard handler for autocomplete navigation */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (results.length === 0) return

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          const nextIndex = activeIndex < results.length - 1 ? activeIndex + 1 : 0
          setActiveIndex(nextIndex)
          scrollActiveIntoView(nextIndex)
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          const prevIndex = activeIndex > 0 ? activeIndex - 1 : results.length - 1
          setActiveIndex(prevIndex)
          scrollActiveIntoView(prevIndex)
          break
        }
        case 'Enter': {
          e.preventDefault()
          if (activeIndex >= 0 && activeIndex < results.length) {
            navigateToResult(results[activeIndex])
          }
          break
        }
        case 'Escape': {
          e.preventDefault()
          if (activeIndex >= 0) {
            setActiveIndex(-1)
          } else {
            closeModal()
          }
          break
        }
      }
    },
    [activeIndex, results, navigateToResult, scrollActiveIntoView, closeModal]
  )

  const defaultPlaceholder = t('navbar.search_placeholder')

  return (
    <>
      <button
        className="btn btn-square btn-ghost rounded-full grayscale duration-300 hover:grayscale-0"
        onClick={openModal}
        aria-label={t('navbar.open_search')}
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} style={{ width: 24, height: 24 }} aria-hidden="true" />
      </button>

      <HeadlessModal
        open={open}
        onClose={closeModal}
        showClose={true}
        title={t('navbar.search')}
        className="backdrop-blur-xl border border-base-200"
      >
        {/* Search Input */}
        <div className="relative w-full mb-4">
          <input
            ref={inputRef}
            id="search-input"
            type="search"
            role="combobox"
            aria-label={t('navbar.search')}
            aria-controls="search-results"
            aria-autocomplete="list"
            aria-expanded={results.length > 0}
            aria-activedescendant={
              activeIndex >= 0 ? `${RESULT_ID_PREFIX}${activeIndex}` : undefined
            }
            className="
              input input-bordered w-full h-12 text-base px-4 pe-10
              backdrop-blur-md
              border rounded-xl
            "
            placeholder={defaultPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* Loading spinner */}
          {loading && (
            <div className="absolute end-24 top-1/2 -translate-y-1/2 text-base-content/40">
              <FontAwesomeIcon icon={faSpinner} spin />
            </div>
          )}

          <div className="absolute end-4 top-1/2 -translate-y-1/2 text-gray-400">
            <button
              onClick={() => {
                toggleSearchType(SearchType.BLOG)
                search(searchQuery)
              }}
              aria-label={t('navbar.filter_by_blog', { active: searchTypes.includes(SearchType.BLOG) ? '(active)' : '' })}
              aria-pressed={searchTypes.includes(SearchType.BLOG)}
              className={`me-2 px-2 py-1 rounded-full text-sm border ${
                searchTypes.includes(SearchType.BLOG)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-transparent text-gray-500 border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faB} aria-hidden="true" />
            </button>
            <button
              onClick={() => {
                toggleSearchType(SearchType.PROJECT)
                search(searchQuery)
              }}
              aria-label={t('navbar.filter_by_project', { active: searchTypes.includes(SearchType.PROJECT) ? '(active)' : '' })}
              aria-pressed={searchTypes.includes(SearchType.PROJECT)}
              className={`px-2 py-1 rounded-full text-sm border ${
                searchTypes.includes(SearchType.PROJECT)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-transparent text-gray-500 border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faP} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        {results.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-base-content/40 mb-2 px-1">
            <span>
              <kbd className="kbd kbd-xs">↑</kbd> <kbd className="kbd kbd-xs">↓</kbd>{' '}
              {t('navbar.autocomplete_navigate')}
            </span>
            <span>
              <kbd className="kbd kbd-xs">↵</kbd> {t('navbar.autocomplete_select')}
            </span>
            <span>
              <kbd className="kbd kbd-xs">esc</kbd> {t('navbar.autocomplete_close')}
            </span>
          </div>
        )}

        {/* Results Area */}
        <div
          ref={resultsRef}
          id="search-results"
          role="listbox"
          aria-label={t('navbar.search_results')}
          aria-live="polite"
          aria-busy={loading}
          className={`max-h-[60vh] overflow-y-auto space-y-2 transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}
        >
          {!loading && results.length === 0 && searchQuery.length > 0 && (
            <div className="text-gray-500 px-1 text-sm italic">{t('navbar.no_results_found')}</div>
          )}

          {results.map((item, i) => (
            <ResultElement
              key={`${item.path}-${i}`}
              item={item}
              index={i}
              id={`${RESULT_ID_PREFIX}${i}`}
              isActive={i === activeIndex}
              highlightQuery={searchQuery}
            />
          ))}
        </div>
      </HeadlessModal>
    </>
  )
}

export default SearchButton
