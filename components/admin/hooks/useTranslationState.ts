import { useState, useCallback } from 'react'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import { LANG_NAMES } from '@/components/admin/Features/Translations/LanguageBar'

type UseTranslationStateOptions = {
  translationApiBase: string
}

export type TranslationState = ReturnType<typeof useTranslationState>

export function useTranslationState({ translationApiBase }: UseTranslationStateOptions) {
  const [activeLang, setActiveLang] = useState('en')
  const [addedLangs, setAddedLangs] = useState<string[]>([])
  const [savedLangs, setSavedLangs] = useState<string[]>([])
  const [translationForms, setTranslationForms] = useState<Record<string, Record<string, string>>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTargetLang, setModalTargetLang] = useState('')

  const isEN = activeLang === 'en'

  const handleAddLang = (lang: string) => {
    setModalTargetLang(lang)
    setModalOpen(true)
  }

  const handleAddLangConfirm = (lang: string, prefilled?: Record<string, string>) => {
    setAddedLangs((prev) => [...prev, lang])
    if (prefilled) setTranslationForms((prev) => ({ ...prev, [lang]: prefilled }))
    setActiveLang(lang)
    setModalOpen(false)
  }

  const handleModalClose = () => setModalOpen(false)

  const handleDeleteLang = async (lang: string) => {
    if (!confirm(`Delete ${LANG_NAMES[lang] ?? lang} translation?`)) return

    if (savedLangs.includes(lang)) {
      try {
        await axiosInstance.delete(`${translationApiBase}/${lang}`)
        setSavedLangs((prev) => prev.filter((l) => l !== lang))
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? 'Failed to delete translation')
        return
      }
    }

    setAddedLangs((prev) => prev.filter((l) => l !== lang))
    setTranslationForms((prev) => {
      const next = { ...prev }
      delete next[lang]
      return next
    })
    if (activeLang === lang) setActiveLang('en')
    toast.success(`${LANG_NAMES[lang] ?? lang} translation removed`)
  }

  const initTranslations = (translations: Array<{ lang: string } & Record<string, string>>) => {
    const forms: Record<string, Record<string, string>> = {}
    const langs: string[] = []
    for (const { lang, ...fields } of translations) {
      forms[lang] = fields
      langs.push(lang)
    }
    setTranslationForms(forms)
    setAddedLangs(langs)
    setSavedLangs(langs)
  }

  /**
   * Returns a { value, set } pair that automatically reads/writes the correct language.
   * Usage: const titleField = tr.field('title', title, setTitle)
   */
  const field = useCallback((key: string, enValue: string, setEN: (v: string) => void) => ({
    value: isEN ? enValue : (translationForms[activeLang]?.[key] ?? ''),
    set: (v: string) => {
      if (isEN) setEN(v)
      else setTranslationForms((prev) => ({
        ...prev,
        [activeLang]: { ...(prev[activeLang] ?? {}), [key]: v },
      }))
    },
  }), [isEN, activeLang, translationForms])

  return {
    activeLang,
    setActiveLang,
    addedLangs,
    savedLangs,
    setSavedLangs,
    translationForms,
    setTranslationForms,
    isEN,
    modalOpen,
    modalTargetLang,
    handleAddLang,
    handleAddLangConfirm,
    handleModalClose,
    handleDeleteLang,
    initTranslations,
    field,
  }
}
