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
import TranslationSection from '@/components/admin/Features/Translations/TranslationSection'
import { TranslationFieldDef } from '@/components/admin/Features/Translations/AddLanguageModal'
import { useTranslationState } from '@/components/admin/hooks/useTranslationState'
import { useDraftAutoSave } from '@/components/admin/hooks/useDraftAutoSave'
import { useSlugify } from '@/components/admin/hooks/useSlugify'

const CATEGORY_TRANSLATION_FIELDS: TranslationFieldDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'slug', label: 'Slug' },
]

const SingleCategory = () => {
  const params = useParams<{ categoryId: string }>()
  const routeCategoryId = params?.categoryId
  const router = useRouter()

  const mode: 'create' | 'edit' = useMemo(
    () => (routeCategoryId === 'create' ? 'create' : 'edit'),
    [routeCategoryId]
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [image, setImage] = useState('')

  const tr = useTranslationState({ translationApiBase: `/api/categories/${routeCategoryId}/translations` })

  const { clearAutoSave } = useDraftAutoSave({
    storageKey: 'category_drafts',
    id: routeCategoryId,
    data: { title, description, slug, keywords, image },
    loading,
    onLoad: (draft) => {
      setTitle(draft.title ?? '')
      setDescription(draft.description ?? '')
      setSlug(draft.slug ?? '')
      setKeywords(draft.keywords ?? [])
      setImage(draft.image ?? '')
    },
  })

  useSlugify({ title, mode, loading, setSlug })

  // Load category + translations (edit mode)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!routeCategoryId || routeCategoryId === 'create') { setLoading(false); return }
      try {
        const [categoryRes, translationsRes] = await Promise.all([
          axiosInstance.get(`/api/categories/${routeCategoryId}`),
          axiosInstance.get(`/api/categories/${routeCategoryId}/translations`),
        ])
        if (cancelled) return

        const category = categoryRes.data?.category
        if (!category) { toast.error('Category not found'); return }

        setTitle(category.title ?? '')
        setDescription(category.description ?? '')
        setSlug(category.slug ?? '')
        setKeywords(Array.isArray(category.keywords) ? category.keywords : [])
        setImage(category.image ?? '')

        tr.initTranslations(
          (translationsRes.data?.translations ?? []).map((t: any) => ({
            lang: t.lang, title: t.title ?? '', description: t.description ?? '', slug: t.slug ?? '',
          }))
        )
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? 'Failed to load category')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [routeCategoryId])

  const handleClearDraft = () => {
    clearAutoSave()
    setTitle(''); setDescription(''); setSlug(''); setKeywords([]); setImage('')
    toast.info('Draft cleared')
  }

  const titleField = tr.field('title', title, setTitle)
  const descriptionField = tr.field('description', description, setDescription)
  const slugField = tr.field('slug', slug, setSlug)

  const handleSubmit = async () => {
    // Save translation
    if (!tr.isEN) {
      if (!titleField.value.trim()) { toast.error('Title is required'); return }
      setSaving(true)
      try {
        await axiosInstance.post(`/api/categories/${routeCategoryId}/translations`, {
          lang: tr.activeLang,
          title: titleField.value,
          description: descriptionField.value,
          slug: slugField.value,
        })
        tr.setSavedLangs((prev) => prev.includes(tr.activeLang) ? prev : [...prev, tr.activeLang])
        toast.success('Translation saved')
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? 'Save failed')
      } finally {
        setSaving(false)
      }
      return
    }

    // Save EN category
    const errors: string[] = []
    const required = { title, description, slug }
    for (const [key, val] of Object.entries(required)) {
      if (!val.trim()) errors.push(`${key} is required`)
    }
    if (errors.length) { errors.forEach((m) => toast.error(m)); return }

    try {
      const body = {
        categoryId: routeCategoryId !== 'create' ? routeCategoryId : undefined,
        title, description, slug, keywords, image,
      }
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
        { label: 'Save', onClick: handleSubmit, className: 'btn-primary', disabled: saving || loading, loading: saving },
        { label: 'Cancel', onClick: () => router.push('/admin/categories'), className: 'btn-secondary' },
      ]}
    >
      <FormHeader
        title={mode === 'create' ? 'Create Category' : 'Edit Category'}
        className="my-4"
        actionButtons={[
          { text: 'Clear Draft', className: 'btn-sm btn-error btn-outline', onClick: handleClearDraft },
          { text: 'Back to Categories', className: 'btn-sm btn-primary', onClick: () => router.push('/admin/categories') },
        ]}
      />

      <TranslationSection
        mode={mode}
        translation={tr}
        fields={CATEGORY_TRANSLATION_FIELDS}
        entityLabel="category"
        enSourceForm={{ title, description, slug }}
      />

      <DynamicText label="Title" placeholder="Title" value={titleField.value} setValue={titleField.set} size="md" />
      <DynamicText label="Description" placeholder="Description" value={descriptionField.value} setValue={descriptionField.set} size="md" isTextarea />
      <DynamicText label="Slug" placeholder="Slug" value={slugField.value} setValue={slugField.set} size="md" />

      {tr.isEN && (
        <>
          <DynamicText
            label="Keywords" placeholder="Keywords"
            value={keywords.join(',')}
            setValue={(v) => setKeywords(v.split(',').map((s) => s.trim()).filter(Boolean))}
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
