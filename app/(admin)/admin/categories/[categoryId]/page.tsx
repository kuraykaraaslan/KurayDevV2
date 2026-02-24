'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import ImageLoad from '@/components/common/UI/Images/ImageLoad'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import DynamicText from '@/components/admin/UI/Forms/DynamicText'
import GenericElement from '@/components/admin/UI/Forms/GenericElement'
import Form from '@/components/admin/UI/Forms/Form'
import LanguageBar from '@/components/admin/Features/Translations/LanguageBar'
import AddLanguageModal, { TranslationFieldDef } from '@/components/admin/Features/Translations/AddLanguageModal'

const CATEGORY_TRANSLATION_FIELDS: TranslationFieldDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'slug', label: 'Slug' },
]

const SingleCategory = () => {
  const localStorageKey = 'category_drafts'

  const params = useParams<{ categoryId: string }>()
  const routeCategoryId = params?.categoryId
  const router = useRouter()

  const mode: 'create' | 'edit' = useMemo(
    () => (routeCategoryId === 'create' ? 'create' : 'edit'),
    [routeCategoryId]
  )

  const [loading, setLoading] = useState(true)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [image, setImage] = useState('')

  // Translation state
  const [activeLang, setActiveLang] = useState('en')
  const [addedLangs, setAddedLangs] = useState<string[]>([])
  const [savedLangs, setSavedLangs] = useState<string[]>([])
  const [translationForms, setTranslationForms] = useState<Record<string, Record<string, string>>>({})
  const [modalTargetLang, setModalTargetLang] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const isEN = activeLang === 'en'

  const currentTitle = isEN ? title : (translationForms[activeLang]?.title ?? '')
  const currentDescription = isEN ? description : (translationForms[activeLang]?.description ?? '')
  const currentSlug = isEN ? slug : (translationForms[activeLang]?.slug ?? '')

  const clearAutoSave = () => {
    try {
      const caches = localStorage.getItem(localStorageKey)
      if (caches) {
        const parsed = JSON.parse(caches)
        delete parsed[routeCategoryId]
        localStorage.setItem(localStorageKey, JSON.stringify(parsed))
      }
    } catch {}
  }

  // Slug generation (only in create mode and after loading)
  useEffect(() => {
    if (mode === 'edit' || loading) return
    if (!title) return

    const invalidChars = /[^\w\s-]/g
    let slugifiedTitle = title.replace(invalidChars, '')
    slugifiedTitle = slugifiedTitle.replace(/\s+/g, '-')
    slugifiedTitle = slugifiedTitle.replace(/--+/g, '-')
    slugifiedTitle = slugifiedTitle.toLowerCase()

    setSlug(slugifiedTitle)
  }, [title, mode, loading])

  // Load category (in edit mode)
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!routeCategoryId) {
        setLoading(false)
        return
      }
      if (routeCategoryId === 'create') {
        setLoading(false)
        return
      }

      try {
        const [categoryRes, translationsRes] = await Promise.all([
          axiosInstance.get(`/api/categories/${routeCategoryId}`),
          axiosInstance.get(`/api/categories/${routeCategoryId}/translations`),
        ])

        const category = categoryRes.data?.category

        if (!category) {
          toast.error('Category not found')
          return
        }
        if (cancelled) return

        setTitle(category.title ?? '')
        setDescription(category.description ?? '')
        setSlug(category.slug ?? '')
        setKeywords(Array.isArray(category.keywords) ? category.keywords : [])
        setImage(category.image ?? '')

        const translations: Array<{ lang: string; title: string; description?: string; slug?: string }> =
          translationsRes.data?.translations ?? []

        const forms: Record<string, Record<string, string>> = {}
        const langs: string[] = []

        for (const t of translations) {
          forms[t.lang] = {
            title: t.title ?? '',
            description: t.description ?? '',
            slug: t.slug ?? '',
          }
          langs.push(t.lang)
        }

        setTranslationForms(forms)
        setAddedLangs(langs)
        setSavedLangs(langs)
      } catch (error: any) {
        console.error(error)
        toast.error(error?.response?.data?.message ?? 'Failed to load category')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [routeCategoryId])

  // Auto Save Draft to LocalStorage
  useEffect(() => {
    if (loading) return

    const draft = { title, description, slug, keywords, image }

    try {
      const caches = localStorage.getItem(localStorageKey)
      let parsedCaches: Record<string, any> = {}
      try {
        parsedCaches = caches ? JSON.parse(caches) : {}
      } catch {
        parsedCaches = {}
      }
      parsedCaches[routeCategoryId] = draft
      localStorage.setItem(localStorageKey, JSON.stringify(parsedCaches))
    } catch (err) {
      console.error('Draft autosave error:', err)
    }
  }, [title, description, slug, keywords, image, loading, routeCategoryId])

  // Load Draft from LocalStorage
  useEffect(() => {
    try {
      const caches = localStorage.getItem(localStorageKey)
      if (!caches) return

      const parsed = JSON.parse(caches)
      const draft = parsed[routeCategoryId]
      if (!draft) return

      setTitle(draft.title ?? '')
      setDescription(draft.description ?? '')
      setSlug(draft.slug ?? '')
      setKeywords(draft.keywords ?? [])
      setImage(draft.image ?? '')

      toast.info('Draft loaded from browser')
    } catch (err) {
      console.error('Draft load error', err)
    }
  }, [])

  const handleClearDraft = () => {
    clearAutoSave()
    setTitle('')
    setDescription('')
    setSlug('')
    setKeywords([])
    setImage('')
    toast.info('Draft cleared')
  }

  const handleAddLangConfirm = (lang: string, prefilled?: Record<string, string>) => {
    if (prefilled) {
      setTranslationForms((prev) => ({ ...prev, [lang]: prefilled }))
    }
    setActiveLang(lang)
    setModalOpen(false)
  }

  const handleDeleteLang = async (lang: string) => {
    try {
      await axiosInstance.delete(`/api/categories/${routeCategoryId}/translations/${lang}`)
      setAddedLangs((prev) => prev.filter((l) => l !== lang))
      setSavedLangs((prev) => prev.filter((l) => l !== lang))
      setTranslationForms((prev) => {
        const next = { ...prev }
        delete next[lang]
        return next
      })
      if (activeLang === lang) setActiveLang('en')
      toast.success('Translation deleted')
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Failed to delete translation')
    }
  }

  const handleSubmit = async () => {
    if (!isEN) {
      const form = translationForms[activeLang] ?? {}
      if (!form.title?.trim()) {
        toast.error('Title is required')
        return
      }

      try {
        await axiosInstance.post(`/api/categories/${routeCategoryId}/translations`, {
          lang: activeLang,
          title: form.title,
          description: form.description,
          slug: form.slug,
        })
        setSavedLangs((prev) => (prev.includes(activeLang) ? prev : [...prev, activeLang]))
        toast.success('Translation saved')
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? 'Save failed')
      }
      return
    }

    const errors: string[] = []
    const required: Record<string, unknown> = {
      title,
      description,
      slug,
    }

    for (const [key, val] of Object.entries(required)) {
      if (typeof val === 'string' && val.trim() === '') {
        errors.push(`${key} is required`)
      }
    }

    if (errors.length) {
      errors.forEach((msg) => toast.error(msg))
      return
    }

    const body = {
      categoryId: routeCategoryId !== 'create' ? routeCategoryId : undefined,
      title,
      description,
      slug,
      keywords,
      image,
    }

    try {
      if (mode === 'create') {
        await axiosInstance.post('/api/categories', body)
        toast.success('Category created successfully')
      } else {
        await axiosInstance.put(`/api/categories/${routeCategoryId}`, body)
        toast.success('Category updated successfully')
      }
      clearAutoSave()
      router.push('/admin/categories')
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Save failed')
    }
  }

  return (
    <Form
      className="mx-auto mb-8 bg-base-300 p-6 rounded-lg shadow max-w-7xl"
      actions={[
        {
          label: 'Save',
          onClick: handleSubmit,
          className: 'btn-primary',
        },
        {
          label: 'Cancel',
          onClick: () => router.push('/admin/categories'),
          className: 'btn-secondary',
        },
      ]}
    >
      <FormHeader
        title={mode === 'create' ? 'Create Category' : 'Edit Category'}
        className="my-4"
        actionButtons={[
          {
            text: 'Clear Draft',
            className: 'btn-sm btn-error btn-outline',
            onClick: handleClearDraft,
          },
          {
            text: 'Back to Categories',
            className: 'btn-sm btn-primary',
            onClick: () => router.push('/admin/categories'),
          },
        ]}
      />

      {mode === 'edit' && (
        <>
          <LanguageBar
            activeLang={activeLang}
            addedLangs={addedLangs}
            savedLangs={savedLangs}
            onSelect={setActiveLang}
            onAdd={(lang) => {
              setAddedLangs((prev) => [...prev, lang])
              setModalTargetLang(lang)
              setModalOpen(true)
            }}
            onDelete={handleDeleteLang}
          />
          <AddLanguageModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setAddedLangs((prev) => prev.filter((l) => l !== modalTargetLang))
            }}
            targetLang={modalTargetLang}
            sourceForms={{ en: { title, description, slug }, ...translationForms }}
            availableSourceLangs={['en', ...savedLangs]}
            fields={CATEGORY_TRANSLATION_FIELDS}
            entityLabel="category"
            onConfirm={handleAddLangConfirm}
          />
        </>
      )}

      <DynamicText
        label="Title"
        placeholder="Title"
        value={currentTitle}
        setValue={isEN ? setTitle : (val) => setTranslationForms((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], title: val } }))}
        size="md"
      />

      <DynamicText
        label="Description"
        placeholder="Description"
        value={currentDescription}
        setValue={isEN ? setDescription : (val) => setTranslationForms((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], description: val } }))}
        size="md"
        isTextarea={true}
      />

      <DynamicText
        label="Slug"
        placeholder="Slug"
        value={currentSlug}
        setValue={isEN ? setSlug : (val) => setTranslationForms((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], slug: val } }))}
        size="md"
      />

      {isEN && (
        <>
          <DynamicText
            label="Keywords"
            placeholder="Keywords"
            value={keywords.join(',')}
            setValue={(val) =>
              setKeywords(
                val
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)
              )
            }
            size="md"
          />

          <GenericElement label="Image">
            <ImageLoad image={image} setImage={setImage} uploadFolder="categories" toast={toast} />
          </GenericElement>
        </>
      )}
    </Form>
  )
}

export default SingleCategory
