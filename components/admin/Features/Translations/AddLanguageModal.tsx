'use client'
import { useState } from 'react'
import { HeadlessModal } from '@/components/admin/UI/Modal'
import axiosInstance from '@/libs/axios'
import { LANG_NAMES, LANG_FLAGS } from '@/types/common/I18nTypes'

export type TranslationFieldDef = {
  key: string
  label: string
  isRichText?: boolean // true → separate AI call, HTML preserved
}

interface AddLanguageModalProps {
  open: boolean
  onClose: () => void
  targetLang: string
  sourceForms: Record<string, Record<string, string>>
  availableSourceLangs: string[]
  fields: TranslationFieldDef[]
  entityLabel?: string // e.g. "blog post", "category", "project"
  onConfirm: (lang: string, prefilled?: Record<string, string>) => void
}

const AddLanguageModal = ({
  open,
  onClose,
  targetLang,
  sourceForms,
  availableSourceLangs,
  fields,
  entityLabel = 'content',
  onConfirm,
}: AddLanguageModalProps) => {
  const [mode, setMode] = useState<'choose' | 'ai'>('choose')
  const [sourceLang, setSourceLang] = useState<string>('')
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    setMode('choose')
    setError('')
    setSourceLang('')
    onClose()
  }

  const handleScratch = () => {
    onConfirm(targetLang)
    handleClose()
  }

  const handleTranslate = async () => {
    const lang = sourceLang || availableSourceLangs[0]
    const source = sourceForms[lang] ?? {}

    if (!source['title']?.trim()) {
      setError('Source content has no title to translate')
      return
    }

    setTranslating(true)
    setError('')

    const sourceLangName = LANG_NAMES[lang] ?? lang
    const targetLangName = LANG_NAMES[targetLang] ?? targetLang

    // Split fields: meta (structured text) vs richtext (separate call)
    const metaFields = fields.filter((f) => !f.isRichText)
    const richFields = fields.filter((f) => f.isRichText)

    const metaSourceLines = metaFields
      .map((f) => `${f.label.toUpperCase()}: ${source[f.key] ?? ''}`)
      .join('\n')

    const metaReturnLines = metaFields
      .map((f) => {
        if (f.key === 'slug') return `${f.label.toUpperCase()}: [translated-slug-${targetLang}]`
        return `${f.label.toUpperCase()}: [translated ${f.label.toLowerCase()} here]`
      })
      .join('\n')

    const slugRule = metaFields.some((f) => f.key === 'slug')
      ? `\n\nSLUG rules: lowercase, hyphens only, no special characters, MUST end with "-${targetLang}".`
      : ''

    const metaPrompt = `Translate the following ${entityLabel} metadata from ${sourceLangName} to ${targetLangName}.

Return ONLY these ${metaFields.length} lines in exactly this format — no extra text, no JSON, no markdown:
${metaReturnLines}
${slugRule}

Source:
${metaSourceLines}`

    try {
      const richPromises = richFields.map((f) =>
        axiosInstance.post('/api/ai/gpt-4o', {
          prompt: `Translate the following ${entityLabel} ${f.label.toLowerCase()} from ${sourceLangName} to ${targetLangName}.\nReturn ONLY the translated content. Preserve all HTML tags exactly as-is. No explanations, no markdown wrappers.\n\n${source[f.key] ?? ''}`,
        })
      )

      const [metaRes, ...richRes] = await Promise.all([
        axiosInstance.post('/api/ai/gpt-4o', { prompt: metaPrompt }),
        ...richPromises,
      ])

      const metaText = String(metaRes.data?.text ?? '')
        .trim()
        .replace(/^```(?:json|JSON)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '')
        .trim()

      const getField = (lines: string[], label: string) => {
        const line = lines.find((l) => l.toUpperCase().startsWith(label.toUpperCase() + ':'))
        return line ? line.slice(label.length + 1).trim() : ''
      }

      const metaLines = metaText.split('\n')
      const prefilled: Record<string, string> = {}

      for (const f of metaFields) {
        prefilled[f.key] = getField(metaLines, f.label)
      }

      if (!prefilled['title']) throw new Error('AI did not return a title')

      richFields.forEach((f, i) => {
        prefilled[f.key] = String(richRes[i]?.data?.text ?? '').trim()
      })

      onConfirm(targetLang, prefilled)
      handleClose()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Translation failed')
    } finally {
      setTranslating(false)
    }
  }

  const effectiveSourceLang = sourceLang || availableSourceLangs[0] || ''

  return (
    <HeadlessModal
      open={open}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-base-content/50 text-lg">{LANG_FLAGS[targetLang]}</span>
          <span>Add {LANG_NAMES[targetLang] ?? targetLang} Translation</span>
        </div>
      }
      size="sm"
    >
      {mode === 'choose' ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-base-content/50 mb-1">How do you want to start?</p>

          <button
            type="button"
            onClick={handleScratch}
            className="flex items-start gap-4 p-4 rounded-xl border border-base-content/10 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
          >
            <div className="mt-0.5 w-9 h-9 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 text-base-content/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm">Start from scratch</div>
              <div className="text-xs text-base-content/45 mt-0.5 leading-relaxed">
                Open an empty form and write content manually
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('ai')}
            className="flex items-start gap-4 p-4 rounded-xl border border-base-content/10 hover:border-secondary/40 hover:bg-secondary/5 transition-all text-left"
          >
            <div className="mt-0.5 w-9 h-9 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 text-base-content/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm">Translate with AI</div>
              <div className="text-xs text-base-content/45 mt-0.5 leading-relaxed">
                Auto-fill {fields.map((f) => f.label.toLowerCase()).join(', ')} using GPT-4o
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => { setMode('choose'); setError('') }}
            className="flex items-center gap-1.5 text-xs text-base-content/40 hover:text-base-content transition-colors w-fit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" />
            </svg>
            Back
          </button>

          <div>
            <label className="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2 block">
              Translate from
            </label>
            <div className="flex flex-col gap-1.5">
              {availableSourceLangs.map((lang) => {
                const isSelected = effectiveSourceLang === lang
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSourceLang(lang)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'border-secondary/50 bg-secondary/8 text-secondary'
                        : 'border-base-content/10 hover:border-base-content/20 hover:bg-base-content/5 text-base-content'
                    }`}
                  >
                    <span className="text-lg leading-none">{LANG_FLAGS[lang]}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{LANG_NAMES[lang]}</div>
                      <div className="text-xs text-base-content/40 font-mono">{lang.toUpperCase()}</div>
                    </div>
                    {isSelected && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {effectiveSourceLang && (
            <div className="flex items-center gap-2 text-xs text-base-content/40">
              <span className="font-mono">{effectiveSourceLang.toUpperCase()}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
              <span className="font-mono">{targetLang.toUpperCase()}</span>
              <span className="ml-1 text-base-content/30">via GPT-4o</span>
            </div>
          )}

          {error && (
            <div className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleTranslate}
            disabled={translating || !effectiveSourceLang}
            className="btn btn-secondary btn-sm w-full gap-2"
          >
            {translating ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                Translating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                Translate to {LANG_NAMES[targetLang] ?? targetLang}
              </>
            )}
          </button>
        </div>
      )}
    </HeadlessModal>
  )
}

export default AddLanguageModal
