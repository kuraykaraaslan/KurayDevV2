'use client'

import { useEffect } from 'react'
import useGlobalStore from '@/libs/zustand'
import { useTranslation } from 'react-i18next'
import HeadlessModal, { useModal } from '@/components/admin/UI/Modal'
import { LANGUAGES } from '@/config/languages'
import { getLangConfig, getFlagUrl } from '@/utils/language'

export default function LangButton() {
  const { language, setLanguage } = useGlobalStore()
  const { i18n } = useTranslation()
  const { open, openModal, closeModal } = useModal()

  const selectLanguage = (lang: string) => {
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

  const currentLang = getLangConfig(language)

  return (
    <>
      <button
        className="btn btn-square btn-ghost rounded-full grayscale duration-300 hover:grayscale-0"
        onClick={openModal}
      >
        <img
          src={getFlagUrl(currentLang.flagCode)}
          alt={currentLang.name}
          className="w-6 h-6 rounded-full"
          style={{ backgroundSize: 'cover' }}
        />
      </button>

      <HeadlessModal
        open={open}
        onClose={closeModal}
        title="Choose Language"
        size="sm"
      >
        <div className="grid grid-cols-3 gap-3">
          {LANGUAGES.map(({ code, name, flagCode }) => (
            <button
              key={code}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border border-transparent hover:bg-base-300 transition ${
                code === language ? 'bg-base-300 border-base-300' : ''
              }`}
              onClick={() => selectLanguage(code)}
            >
              <img
                src={getFlagUrl(flagCode)}
                alt={name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm font-medium text-center">{name}</span>
            </button>
          ))}
        </div>
      </HeadlessModal>
    </>
  )
}
