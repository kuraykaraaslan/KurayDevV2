'use client'
import LanguageBar, { LANG_NAMES } from './LanguageBar'
import AddLanguageModal, { TranslationFieldDef } from './AddLanguageModal'
import { TranslationState } from '@/components/admin/hooks/useTranslationState'

interface TranslationSectionProps {
  mode: 'create' | 'edit'
  translation: TranslationState
  fields: TranslationFieldDef[]
  entityLabel: string
  enSourceForm: Record<string, string>
  /** Override the confirm handler (e.g. to run extra logic before adding lang). */
  onConfirm?: (lang: string, prefilled?: Record<string, string>) => void
}

const TranslationSection = ({
  mode,
  translation,
  fields,
  entityLabel,
  enSourceForm,
  onConfirm,
}: TranslationSectionProps) => {
  if (mode !== 'edit') return null

  const {
    activeLang,
    addedLangs,
    savedLangs,
    setActiveLang,
    isEN,
    modalOpen,
    modalTargetLang,
    handleAddLang,
    handleAddLangConfirm,
    handleModalClose,
    handleDeleteLang,
    translationForms,
  } = translation

  return (
    <>
      <LanguageBar
        activeLang={activeLang}
        addedLangs={addedLangs}
        savedLangs={savedLangs}
        onSelect={setActiveLang}
        onAdd={handleAddLang}
        onDelete={handleDeleteLang}
      />

      {!isEN && (
        <div className="alert alert-info alert-sm mb-2 py-2 text-sm">
          Editing <strong>{LANG_NAMES[activeLang] ?? activeLang}</strong> translation — translated fields only.
        </div>
      )}

      <AddLanguageModal
        open={modalOpen}
        onClose={handleModalClose}
        targetLang={modalTargetLang}
        sourceForms={{ en: enSourceForm, ...translationForms }}
        availableSourceLangs={['en', ...savedLangs]}
        fields={fields}
        entityLabel={entityLabel}
        onConfirm={onConfirm ?? handleAddLangConfirm}
      />
    </>
  )
}

export default TranslationSection
