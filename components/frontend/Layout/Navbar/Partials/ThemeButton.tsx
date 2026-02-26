'use client'
import { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { useGlobalStore } from '@/libs/zustand'
import { AppTheme } from '@/types/ui/UITypes'
import { useTranslation } from 'react-i18next'

const ThemeButton = () => {
  const { t } = useTranslation()
  const { theme, setTheme, availableThemes } = useGlobalStore()

  const themeIcons = {
    dark: faMoon,
    light: faSun,
  }

  const nextTheme = () => {
    const currentIndex = availableThemes.indexOf(theme)

    let nextTheme: AppTheme

    switch (currentIndex) {
      case -1:
        nextTheme = availableThemes[0]
        break
      case availableThemes.length - 1:
        nextTheme = availableThemes[0]
        break
      default:
        nextTheme = availableThemes[currentIndex + 1]
        break
    }
    setTheme(nextTheme)
  }

  useEffect(() => {
    document.querySelector('html')?.setAttribute('data-theme', theme)
    // Persist to cookie for SSR
    document.cookie = `theme=${theme};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
  }, [theme])

  return (
    <button
      className="btn btn-square btn-ghost rounded-full grayscale duration-300 hover:grayscale-0"
      onClick={nextTheme}
      aria-label={t('navbar.switch_theme', { theme })}
    >
      <FontAwesomeIcon
        icon={
          themeIcons[theme as keyof typeof themeIcons]
            ? themeIcons[theme as keyof typeof themeIcons]
            : faMoon
        }
        style={{ width: '24px', height: '24px' }}
        aria-hidden="true"
      />
    </button>
  )
}

export default ThemeButton
