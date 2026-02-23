import { useState, useEffect, MouseEvent } from 'react'
import { CircleFlag } from 'react-circle-flags'
import useGlobalStore from '@/libs/zustand'
import { useTranslation } from 'react-i18next'

const LangButton = () => {
  const [hasMounted, setHasMounted] = useState(false)

  const { language, setLanguage, availableLanguages } = useGlobalStore()
  const { i18n } = useTranslation()

  const languageFlags = {
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

  const nextLanguage = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const currentIndex = availableLanguages.indexOf(language)

    const nextLang =
      currentIndex === -1 || currentIndex === availableLanguages.length - 1
        ? availableLanguages[0]
        : availableLanguages[currentIndex + 1]

    setLanguage(nextLang)
  }

  useEffect(() => {
    if (hasMounted) return

    const currentLanguage = useGlobalStore.getState().language
    if (i18n.language !== currentLanguage) {
      i18n.changeLanguage(currentLanguage)
    }
    setHasMounted(true)
  }, [i18n, hasMounted])

  useEffect(() => {
    if (!hasMounted) return

    i18n.changeLanguage(language)
  }, [language, i18n, hasMounted])

  useEffect(() => {
    if (!i18n.isInitialized) return // ❗ kritik

    if (i18n.language !== language) {
      i18n.changeLanguage(language)
    }
  }, [language, i18n])

  return (
    <button
      className="btn btn-square btn-ghost rounded-full items-center justify-center duration-300"
      onClick={nextLanguage}
    >
      <CircleFlag
        height="24"
        width="24"
        countryCode={languageFlags[language as keyof typeof languageFlags] ?? 'us'}
      />
    </button>
  )
}

export default LangButton