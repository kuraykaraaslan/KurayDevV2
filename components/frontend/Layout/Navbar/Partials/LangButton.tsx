'use client'

import { usePathname, useRouter } from 'next/navigation'
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, type AppLanguage } from '@/types/common/I18nTypes'
import HeadlessModal, { useModal } from '@/components/admin/UI/Modal'
import { getLangFlagUrl as findFlagUrlByIso2Code, LANG_NAMES } from '@/types/common/I18nTypes'

export default function LanguageModal() {
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
      >
        <img
          src={findFlagUrlByIso2Code(currentLang)}
          alt={currentLang}
          className="w-6 h-6 rounded-full"
          style={{ backgroundSize: 'cover' }}
        />
      </button>

      <HeadlessModal open={open} onClose={closeModal} title="Choose Language" size="sm">
        <div className="grid grid-cols-3 gap-3">
          {AVAILABLE_LANGUAGES.map((lang) => (
            <button
              key={lang}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border border-transparent hover:bg-base-300 transition ${
                lang === currentLang ? 'bg-base-300 border-base-300' : ''
              }`}
              onClick={() => selectLanguage(lang)}
            >
              <img
                src={findFlagUrlByIso2Code(lang)}
                alt={lang}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm font-medium text-center">{LANG_NAMES[lang]}</span>
            </button>
          ))}
        </div>
      </HeadlessModal>
    </>
  )
}
