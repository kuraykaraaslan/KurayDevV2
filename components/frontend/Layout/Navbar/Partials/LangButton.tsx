'use client'

import { useEffect } from 'react'
import useGlobalStore from '@/libs/zustand'
import { useTranslation } from 'react-i18next'
import { AppLanguage } from '@/types/common/I18nTypes'
import HeadlessModal, { useModal } from '@/components/admin/UI/Modal'

export default function LanguageModal() {
  const { language, setLanguage, availableLanguages } = useGlobalStore()
  const { i18n } = useTranslation()
  const { open, openModal, closeModal } = useModal()

  // Language code → country flag code (only for exceptions where they differ)
  const LANG_TO_COUNTRY: Partial<Record<AppLanguage, string>> = {
    en: 'us',
    et: 'ee',
    he: 'il',
  }

  // https://kapowaz.github.io/square-flags/flags/XX.svg
  const findFlagUrlByIso2Code = (lang: AppLanguage) => {
    const country = LANG_TO_COUNTRY[lang] ?? lang
    return `https://kapowaz.github.io/square-flags/flags/${country.toLowerCase()}.svg`
  }

  const selectLanguage = (lang: AppLanguage) => {
    setLanguage(lang)
    closeModal()
    i18n.changeLanguage(lang)
  }

  useEffect(() => {
    if (!i18n.isInitialized) return // critical

    if (i18n.language !== language) {
      i18n.changeLanguage(language)
    }
  }, [language, i18n])

  return (
    <>
      {/* Trigger button */}
      <button
        className="btn btn-square btn-ghost rounded-full grayscale duration-300 hover:grayscale-0"
        onClick={openModal}
      >
        <img
          src={findFlagUrlByIso2Code(language)}
          alt={language}
          className="w-6 h-6 rounded-full"
          style={{ backgroundSize: 'cover' }}
        />
      </button>

      <HeadlessModal open={open} onClose={closeModal} title="Choose Language" size="sm">
        <div className="grid grid-cols-3 gap-3">
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border border-transparent hover:bg-base-300 transition ${
                lang === language ? 'bg-base-300 border-base-300' : ''
              }`}
              onClick={() => selectLanguage(lang)}
            >
              <img
                src={findFlagUrlByIso2Code(lang)}
                alt={lang}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm font-medium text-center">{lang}</span>
            </button>
          ))}
        </div>
      </HeadlessModal>
    </>
  )
}
