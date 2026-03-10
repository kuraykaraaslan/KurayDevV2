'use client'

import { useLanguageStore, ENV_LANGUAGES } from '@/libs/zustand'
import { LANG_NAMES, getLangFlagUrl, type AppLanguage } from '@/types/common/I18nTypes'
import HeadlessModal, { useModal } from '@/components/admin/UI/Modal'
import DynamicSelect from '@/components/admin/UI/Forms/DynamicSelect'
import { useTranslation } from 'react-i18next'

export default function LangButtonCSR() {
  const { t } = useTranslation()
  const { lang, setLang } = useLanguageStore()
  const { open, openModal, closeModal } = useModal()

  const langOptions = ENV_LANGUAGES.map((l) => ({
    value: l,
    label: LANG_NAMES[l] ?? l,
  }))

  const handleSelect = (selected: string) => {
    setLang(selected as AppLanguage)
    closeModal()
  }

  return (
    <>
      <button
        className="btn btn-square btn-ghost rounded-full grayscale duration-300 hover:grayscale-0"
        onClick={openModal}
        aria-label={t('navbar.change_language', { lang: LANG_NAMES[lang] || lang })}
      >
        <img
          src={getLangFlagUrl(lang)}
          alt={`${LANG_NAMES[lang] || lang} flag`}
          className="w-6 h-6 rounded-full select-none"
          aria-hidden="true"
        />
      </button>

      <HeadlessModal open={open} onClose={closeModal} size="sm" title={t('navbar.select_language')}>
        <DynamicSelect
          options={langOptions}
          selectedValue={lang}
          onValueChange={handleSelect}
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
