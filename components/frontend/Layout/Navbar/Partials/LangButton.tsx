'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  LANG_NAMES,
  getLangFlagUrl,
  getFilteredLanguages,
  type AppLanguage,
} from '@/types/common/I18nTypes'
import { ENV_DEFAULT_LANGUAGE, ENV_LANGUAGES } from '@/libs/zustand'
import HeadlessModal, { useModal } from '@/components/admin/UI/Modal'
import DynamicSelect from '@/components/admin/UI/Forms/DynamicSelect'

export default function LanguageButton() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const { open, openModal, closeModal } = useModal()
  const [geoCountry, setGeoCountry] = useState<string | null>(null)

  useEffect(() => {
    // In local development show all languages — no geo filtering
    if (process.env.NODE_ENV === 'development') return

    fetch('/api/geo')
      .then((r) => r.json())
      .then(({ countryCode }) => { if (countryCode) setGeoCountry(countryCode) })
      .catch(() => {/* ignore — show all languages on error */})
  }, [])

  const firstSegment = pathname.split('/').filter(Boolean)[0]
  const currentLang: AppLanguage =
    (ENV_LANGUAGES as readonly string[]).includes(firstSegment) && firstSegment !== ENV_DEFAULT_LANGUAGE
      ? (firstSegment as AppLanguage)
      : ENV_DEFAULT_LANGUAGE

  const getPagePath = (): string => {
    const segs = pathname.split('/').filter(Boolean)
    if ((ENV_LANGUAGES as readonly string[]).includes(segs[0]) && segs[0] !== ENV_DEFAULT_LANGUAGE) {
      return '/' + segs.slice(1).join('/')
    }
    return pathname
  }

  const selectLanguage = (lang: string) => {
    if (!lang) return
    closeModal()
    const pagePath = getPagePath() || '/'
    if (lang === ENV_DEFAULT_LANGUAGE) {
      router.push(pagePath)
    } else {
      router.push(`/${lang}${pagePath}`)
    }
  }

  const langOptions = getFilteredLanguages(geoCountry)
    .filter((l) => (ENV_LANGUAGES as readonly string[]).includes(l))
    .map((l) => ({
      value: l,
      label: LANG_NAMES[l] ?? l,
    }))

  return (
    <>
      <button
        className="btn btn-square btn-ghost rounded-full grayscale duration-300 hover:grayscale-0"
        onClick={openModal}
        aria-label={t('navbar.change_language', { lang: LANG_NAMES[currentLang] || currentLang })}
      >
        <img
          src={getLangFlagUrl(currentLang)}
          alt={`${LANG_NAMES[currentLang] || currentLang} flag`}
          className="w-6 h-6 rounded-full select-none"
          aria-hidden="true"
        />
      </button>

      <HeadlessModal open={open} onClose={closeModal} size="sm" title={t('navbar.select_language')}>
        <DynamicSelect
          options={langOptions}
          selectedValue={currentLang}
          onValueChange={selectLanguage}
          clearable={false}
          portal
          renderOption={(opt) => (
            <span className="flex items-center gap-2.5">
              <img src={getLangFlagUrl(opt.value as AppLanguage)} alt="" className="w-5 h-5 rounded-full shrink-0 select-none" />
              <span className="flex-1 font-medium">{opt.label}</span>
              <span className="text-xs font-mono text-base-content/40">{opt.value.toUpperCase()}</span>
            </span>
          )}
          renderSelected={(opt) => (
            <span className="flex items-center gap-2">
              <img src={getLangFlagUrl(opt.value as AppLanguage)} alt="" className="w-5 h-5 rounded-full shrink-0 select-none" />
              <span className="font-medium">{opt.label}</span>
            </span>
          )}
        />
      </HeadlessModal>
    </>
  )
}
