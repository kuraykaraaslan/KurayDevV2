'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, type AppLanguage } from '@/types/common/I18nTypes'
import HeadlessModal, { useModal } from '@/components/admin/UI/Modal'
import { getLangFlagUrl as findFlagUrlByIso2Code, LANG_NAMES } from '@/types/common/I18nTypes'

export default function LanguageModal() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const { open, openModal, closeModal } = useModal()

  // Detect current language from URL (non-default lang is the first segment)
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  const currentLang: AppLanguage =
    AVAILABLE_LANGUAGES.includes(firstSegment as AppLanguage) && firstSegment !== DEFAULT_LANGUAGE
      ? (firstSegment as AppLanguage)
      : DEFAULT_LANGUAGE

  // Returns the page path without lang prefix
  const getPagePath = (): string => {
    const segs = pathname.split('/').filter(Boolean)
    if (AVAILABLE_LANGUAGES.includes(segs[0] as AppLanguage) && segs[0] !== DEFAULT_LANGUAGE) {
      return '/' + segs.slice(1).join('/')
    }
    return pathname
  }

  const selectLanguage = (lang: AppLanguage) => {
    closeModal()
    const pagePath = getPagePath() || '/'
    if (lang === DEFAULT_LANGUAGE) {
      router.push(pagePath)
    } else {
      router.push(`/${lang}${pagePath}`)
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        className="btn btn-square btn-ghost rounded-full grayscale duration-300 hover:grayscale-0"
        onClick={openModal}
        aria-label={t('navbar.change_language', { lang: LANG_NAMES[currentLang] || currentLang })}
      >
        <img
          src={findFlagUrlByIso2Code(currentLang)}
          alt={`${LANG_NAMES[currentLang] || currentLang} flag`}
          className="w-6 h-6 rounded-full select-none"
          aria-hidden="true"
          style={{ backgroundSize: 'cover' }}
        />
      </button>

      <HeadlessModal open={open} onClose={closeModal} size="sm" title={t('navbar.select_language')}>
        <div className="grid grid-cols-3 gap-3">
          {AVAILABLE_LANGUAGES.map((lang) => (
            <button
              key={lang}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border border-transparent hover:bg-base-300 transition ${
                lang === currentLang ? 'bg-base-300 border-base-300' : ''
              }`}
              onClick={() => selectLanguage(lang)}
              aria-label={t('navbar.language', { lang: LANG_NAMES[lang] || lang })}
              aria-current={lang === currentLang ? true : undefined}
            >
              <img
                src={findFlagUrlByIso2Code(lang)}
                alt={`${LANG_NAMES[lang]} flag`}
                className="w-6 h-6 rounded-full select-none"
              />
              <span className="text-sm font-medium text-center select-none">{LANG_NAMES[lang]}</span>
            </button>
          ))}
        </div>
      </HeadlessModal>
    </>
  )
}
