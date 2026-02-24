'use client'
import { useEffect, useRef, useState } from 'react'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import { AVAILABLE_LANGUAGES, AppLanguage, LANG_NAMES } from '@/types/common/I18nTypes'
import { PostTranslation } from '@/types/content/BlogTypes'
import DynamicText from '@/components/admin/UI/Forms/DynamicText'
import GenericElement from '@/components/admin/UI/Forms/GenericElement'
import Editor from '@/components/admin/UI/Forms/Editor'

const TRANSLATABLE_LANGS = AVAILABLE_LANGUAGES.filter((l) => l !== 'en')

type TranslationForm = {
  title: string
  content: string
  description: string
  slug: string
}

const emptyForm = (): TranslationForm => ({ title: '', content: '', description: '', slug: '' })

interface PostTranslationsProps {
  postId: string
}

const PostTranslations = ({ postId }: PostTranslationsProps) => {
  const [activeLang, setActiveLang] = useState<AppLanguage | null>(null)
  const [forms, setForms] = useState<Record<string, TranslationForm>>({})
  const [savedLangs, setSavedLangs] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const prevTitle = useRef<string>('')

  useEffect(() => {
    axiosInstance
      .get(`/api/posts/${postId}/translations`)
      .then((res) => {
        const data: PostTranslation[] = res.data.translations
        const map: Record<string, TranslationForm> = {}
        const saved = new Set<string>()
        data.forEach((t) => {
          map[t.lang] = {
            title: t.title,
            content: t.content,
            description: t.description ?? '',
            slug: t.slug,
          }
          saved.add(t.lang)
        })
        setForms(map)
        setSavedLangs(saved)
      })
      .catch(() => toast.error('Failed to load translations'))
  }, [postId])

  const getForm = (lang: string): TranslationForm => forms[lang] ?? emptyForm()

  const updateField = (lang: string, field: keyof TranslationForm, value: string) => {
    setForms((prev) => ({
      ...prev,
      [lang]: { ...getForm(lang), [field]: value },
    }))
  }

  // Auto-generate slug from title
  useEffect(() => {
    if (!activeLang) return
    const form = getForm(activeLang)
    if (!form.title || form.title === prevTitle.current) return
    prevTitle.current = form.title

    const slugified = form.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')

    setForms((prev) => ({
      ...prev,
      [activeLang]: { ...getForm(activeLang), slug: `${slugified}-${activeLang}` },
    }))
  }, [activeLang && forms[activeLang]?.title])

  const handleTabClick = (lang: AppLanguage) => {
    if (activeLang === lang) {
      setActiveLang(null) // collapse
    } else {
      prevTitle.current = ''
      setActiveLang(lang)
    }
  }

  const handleSave = async () => {
    if (!activeLang) return
    const form = getForm(activeLang)
    if (!form.title.trim() || !form.content.trim() || !form.slug.trim()) {
      toast.error('Title, content and slug are required')
      return
    }
    setSaving(true)
    try {
      await axiosInstance.post(`/api/posts/${postId}/translations`, {
        lang: activeLang,
        title: form.title,
        content: form.content,
        description: form.description || null,
        slug: form.slug,
      })
      setSavedLangs((prev) => new Set(prev).add(activeLang))
      toast.success(`${LANG_NAMES[activeLang]} translation saved`)
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!activeLang || !savedLangs.has(activeLang)) return
    if (!confirm(`Delete ${LANG_NAMES[activeLang]} translation?`)) return
    setDeleting(true)
    try {
      await axiosInstance.delete(`/api/posts/${postId}/translations/${activeLang}`)
      setSavedLangs((prev) => {
        const next = new Set(prev)
        next.delete(activeLang)
        return next
      })
      setForms((prev) => {
        const next = { ...prev }
        delete next[activeLang]
        return next
      })
      prevTitle.current = ''
      setActiveLang(null)
      toast.success(`${LANG_NAMES[activeLang]} translation deleted`)
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const activeForm = activeLang ? getForm(activeLang) : null
  const isSaved = activeLang ? savedLangs.has(activeLang) : false

  return (
    <div className="mb-2">
      {/* Tab bar */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-base-content/40 mr-1 uppercase tracking-wider">
          Translations
        </span>
        {TRANSLATABLE_LANGS.map((lang) => {
          const isActive = activeLang === lang
          const hasSaved = savedLangs.has(lang)
          return (
            <button
              key={lang}
              type="button"
              onClick={() => handleTabClick(lang as AppLanguage)}
              className={`btn btn-xs gap-1 transition-all ${
                isActive
                  ? 'btn-primary'
                  : hasSaved
                    ? 'btn-success btn-outline'
                    : 'btn-ghost btn-outline opacity-60'
              }`}
            >
              {lang.toUpperCase()}
              {hasSaved && !isActive && <span className="w-1.5 h-1.5 rounded-full bg-success" />}
            </button>
          )
        })}
        <span className="ml-auto text-xs text-base-content/30">
          {savedLangs.size}/{TRANSLATABLE_LANGS.length}
        </span>
      </div>

      {/* Translation panel */}
      {activeLang && activeForm && (
        <div className="mt-3 border border-base-content/10 rounded-lg p-4 bg-base-200 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{LANG_NAMES[activeLang]}</span>
            {isSaved && <span className="badge badge-success badge-xs">saved</span>}
          </div>

          <DynamicText
            label="Title"
            placeholder={`Title in ${LANG_NAMES[activeLang]}`}
            value={activeForm.title}
            setValue={(val) => updateField(activeLang, 'title', val)}
          />

          <DynamicText
            label="Slug"
            placeholder={`slug-${activeLang}`}
            value={activeForm.slug}
            setValue={(val) => updateField(activeLang, 'slug', val)}
          />

          <DynamicText
            label="Description"
            placeholder={`Description in ${LANG_NAMES[activeLang]}`}
            value={activeForm.description}
            setValue={(val) => updateField(activeLang, 'description', val)}
            isTextarea
          />

          <GenericElement label="Content">
            <Editor
              value={activeForm.content}
              onChange={(val) => updateField(activeLang, 'content', val)}
            />
          </GenericElement>

          <div className="flex gap-2 justify-end mt-2">
            {isSaved && (
              <button
                type="button"
                className="btn btn-error btn-outline btn-sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : isSaved ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PostTranslations
