'use client'

import { useEffect } from 'react'
import useGlobalStore from '@/libs/zustand'
import { useTranslation } from 'react-i18next'

export default function LanguageModal() {
  const { language, setLanguage, availableLanguages } = useGlobalStore()
  const { i18n } = useTranslation()

  const languageFlags: Record<string, string> = {
    en: 'us',
    tr: 'tr',
    de: 'de',
    gr: 'gr',
    et: 'ee',
    mt: 'mt',
    th: 'th',
    nl: 'nl',
    uk: 'ua',
  }

  const languageNames: Record<string, string> = {
    en: 'English',
    tr: 'Türkçe',
    de: 'Deutsch',
    gr: 'Ελληνικά',
    et: 'Eesti',
    mt: 'Malti',
    th: 'ไทย',
    nl: 'Nederlands',
    uk: 'Українська',
  }

  // https://kapowaz.github.io/square-flags/flags/XX.svg
  const findFlagUrlByIso2Code = (iso2Code: string) => {
    return `https://kapowaz.github.io/square-flags/flags/${iso2Code.toLowerCase()}.svg`
  }

  const openModal = () => {
    ;(document.getElementById('lang_modal') as HTMLDialogElement)?.showModal()
  }

  const closeModal = () => {
    ;(document.getElementById('lang_modal') as HTMLDialogElement)?.close()
  }

  const selectLanguage = (lang: string) => {
    setLanguage(lang)
    closeModal()
    i18n.changeLanguage(lang)
  }

  useEffect(() => {
    if (!i18n.isInitialized) return // critical

    // Update if i18next language differs from stored language
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
          src={findFlagUrlByIso2Code(languageFlags[language] ?? 'us')}
          alt={language}
          className="w-6 h-6 rounded-full"
          style={{ backgroundSize: 'cover' }}
        />
      </button>

      {/* Modal */}
      <dialog id="lang_modal" className="modal">
        {/* BACKDROP — closes on outside click */}
        <div className="modal-backdrop fixed inset-0 bg-black/30" onClick={closeModal} />

        {/* MODAL BOX */}
        <div
          className="modal-box p-4 max-w-xs bg-base-200/60 backdrop-blur-xl border border-base-300 rounded-2xl shadow-xl relative"
          onClick={(e) => e.stopPropagation()} // prevent close on inside click
        >
          <h3 className="font-semibold text-center text-lg mb-3">Choose Language</h3>

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
                  src={findFlagUrlByIso2Code(languageFlags[lang] ?? 'us')}
                  alt={lang}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm font-medium text-center">{languageNames[lang]}</span>
              </button>
            ))}
          </div>

          <div className="modal-action justify-center mt-4">
            <form method="dialog">
              <button className="btn btn-sm px-6 rounded-full">Close</button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  )
}
