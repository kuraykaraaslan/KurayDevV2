'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axiosInstance from '@/libs/axios'
import Editor from '@/components/admin/UI/Forms/Editor'
import { toast } from 'react-toastify'
import ImageLoad from '@/components/common/UI/Images/ImageLoad'
import AIPrompt from '@/components/admin/Features/AIPrompt'
import DynamicSelect from '@/components/admin/UI/Forms/DynamicSelect'
import useGlobalStore from '@/libs/zustand'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import DynamicText from '@/components/admin/UI/Forms/DynamicText'
import DynamicDate from '@/components/admin/UI/Forms/DynamicDate'
import GenericElement from '@/components/admin/UI/Forms/GenericElement'
import Form from '@/components/admin/UI/Forms/Form'
import TranslationSection from '@/components/admin/Features/Translations/TranslationSection'
import { TranslationFieldDef } from '@/components/admin/Features/Translations/AddLanguageModal'
import { useTranslationState } from '@/components/admin/hooks/useTranslationState'
import { useDraftAutoSave } from '@/components/admin/hooks/useDraftAutoSave'
import { useSlugify } from '@/components/admin/hooks/useSlugify'
import type { PostStatus } from '@/types/content/BlogTypes'

const POST_TRANSLATION_FIELDS: TranslationFieldDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'slug', label: 'Slug' },
  { key: 'content', label: 'Content', isRichText: true },
]

const SinglePost = () => {
  const { user } = useGlobalStore()
  const params = useParams<{ postId: string }>()
  const routePostId = params?.postId
  const router = useRouter()

  const mode: 'create' | 'edit' = useMemo(
    () => (routePostId === 'create' ? 'create' : 'edit'),
    [routePostId]
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [image, setImage] = useState('')
  const [content, setContent] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [authorId, setAuthorId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<PostStatus>('DRAFT')
  const [createdAt, setCreatedAt] = useState<Date>(new Date())
  const [publishedAt, setPublishedAt] = useState<Date | null>(null)
  const [views, setViews] = useState(0)

  // Translation state
  const tr = useTranslationState({ translationApiBase: `/api/posts/${routePostId}/translations` })
  const trTitleRef = useRef<Record<string, string>>({})

  // Draft auto-save
  const { clearAutoSave } = useDraftAutoSave({
    storageKey: 'post_drafts',
    id: routePostId,
    data: { title, content, description, slug, keywords, authorId, categoryId, status, image, publishedAt },
    loading,
    onLoad: (draft) => {
      setTitle(draft.title ?? '')
      setContent(draft.content ?? '')
      setDescription(draft.description ?? '')
      setSlug(draft.slug ?? '')
      setKeywords(draft.keywords ?? [])
      setAuthorId(draft.authorId ?? '')
      setCategoryId(draft.categoryId ?? '')
      setStatus(draft.status ?? 'DRAFT')
      setImage(draft.image ?? '')
      setPublishedAt(draft.publishedAt ? new Date(draft.publishedAt) : null)
    },
  })

  // Auto-slugify (EN, create mode) — with month/year suffix
  useSlugify({
    title,
    mode,
    loading,
    setSlug,
    transform: (raw) => {
      const month = createdAt.getMonth() + 1
      const year = createdAt.getFullYear()
      return `${raw}-${month < 10 ? '0' + month : month}${year}`
    },
  })

  // Non-EN slug auto-gen from translation title
  useEffect(() => {
    if (tr.isEN) return
    const currentTr = tr.translationForms[tr.activeLang]
    const prevTitle = trTitleRef.current[tr.activeLang] ?? ''
    if (!currentTr?.title || currentTr.title === prevTitle) return
    trTitleRef.current[tr.activeLang] = currentTr.title

    const s = currentTr.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')

    tr.setTranslationForms((p) => ({
      ...p,
      [tr.activeLang]: { ...currentTr, slug: `${s}-${tr.activeLang}` },
    }))
  }, [tr.activeLang, tr.translationForms[tr.activeLang]?.title])

  // Load post + translations (edit mode)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!routePostId || routePostId === 'create') { setLoading(false); return }
      try {
        const [postRes, trRes] = await Promise.all([
          axiosInstance.get('/api/posts', { params: { postId: routePostId, status: 'ALL' } }),
          axiosInstance.get(`/api/posts/${routePostId}/translations`),
        ])
        if (cancelled) return

        const post = (postRes.data?.posts ?? []).find((p: any) => p.postId === routePostId)
        if (!post) { toast.error('Post not found'); return }

        setTitle(post.title ?? '')
        setImage(post.image ?? '')
        setContent(post.content ?? '')
        setDescription(post.description ?? '')
        setSlug(post.slug ?? '')
        setKeywords(Array.isArray(post.keywords) ? post.keywords : [])
        setAuthorId(post.authorId ?? '')
        setCategoryId(post.categoryId ?? '')
        setStatus((post.status as PostStatus) ?? 'DRAFT')
        setCreatedAt(post.createdAt ? new Date(post.createdAt) : new Date())
        setPublishedAt(post.publishedAt ? new Date(post.publishedAt) : null)
        setViews(typeof post.views === 'number' ? post.views : 0)

        tr.initTranslations(
          (trRes.data?.translations ?? []).map((t: any) => ({
            lang: t.lang, title: t.title, content: t.content, description: t.description ?? '', slug: t.slug,
          }))
        )
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? 'Failed to load post')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [routePostId])

  const handleClearDraft = () => {
    clearAutoSave()
    setTitle(''); setContent(''); setDescription(''); setSlug('')
    setKeywords([]); setAuthorId(''); setCategoryId(''); setStatus('DRAFT'); setImage('')
    setCreatedAt(new Date()); setViews(0); setPublishedAt(null)
    toast.info('Draft cleared')
  }

  const titleField = tr.field('title', title, setTitle)
  const contentField = tr.field('content', content, setContent)
  const descriptionField = tr.field('description', description, setDescription)
  const slugField = tr.field('slug', slug, setSlug)

  const handleSubmit = async () => {
    // Save translation
    if (!tr.isEN) {
      const errors: string[] = []
      if (!titleField.value.trim()) errors.push('title is required')
      if (!contentField.value.trim()) errors.push('content is required')
      if (!slugField.value.trim()) errors.push('slug is required')
      if (errors.length) { errors.forEach((m) => toast.error(m)); return }

      setSaving(true)
      try {
        await axiosInstance.post(`/api/posts/${routePostId}/translations`, {
          lang: tr.activeLang,
          title: titleField.value,
          content: contentField.value,
          description: descriptionField.value || null,
          slug: slugField.value,
        })
        tr.setSavedLangs((p) => [...new Set([...p, tr.activeLang])])
        toast.success(`${tr.activeLang.toUpperCase()} translation saved`)
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? 'Save failed')
      } finally {
        setSaving(false)
      }
      return
    }

    // Save EN post
    const required: Record<string, unknown> = { title, content, description, slug, authorId, categoryId }
    const errors: string[] = []
    for (const [key, val] of Object.entries(required)) {
      if (typeof val === 'string' && !val.trim()) errors.push(`${key} is required`)
    }
    if (errors.length) { errors.forEach((m) => toast.error(m)); return }

    try {
      const body = {
        postId: routePostId !== 'create' ? routePostId : undefined,
        title, content, description, slug, keywords, authorId, categoryId, status, createdAt, views, image,
        publishedAt: publishedAt ?? undefined,
      }
      if (mode === 'create') {
        await axiosInstance.post('/api/posts', body)
        toast.success('Post created successfully')
      } else {
        await axiosInstance.put(`/api/posts/${routePostId}`, body)
        toast.success('Post updated successfully')
      }
      clearAutoSave()
      router.push('/admin/posts')
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Save failed')
    }
  }

  const saveLabel = tr.isEN ? 'Save' : `Save ${tr.activeLang.toUpperCase()}`

  // Posts adds the lang to addedLangs in confirm (not in handleAddLang)
  const handleAddLangConfirm = (lang: string, prefilled?: Record<string, string>) => {
    trTitleRef.current[lang] = prefilled?.title ?? ''
    tr.handleAddLangConfirm(lang, prefilled)
  }

  return (
    <Form
      className="mx-auto mb-8 bg-base-300 p-6 rounded-lg shadow max-w-7xl"
      actions={[
        { label: saving ? 'Saving...' : saveLabel, onClick: handleSubmit, className: 'btn-primary', disabled: saving || loading, loading: saving },
        { label: 'Cancel', onClick: () => router.push('/admin/posts'), className: 'btn-secondary' },
      ]}
    >
      <FormHeader
        title={mode === 'create' ? 'Create Post' : 'Edit Post'}
        className="my-4"
        actionButtons={[
          {
            element: (
              <AIPrompt
                setTitle={setTitle} setContent={setContent} setDescription={setDescription}
                setKeywords={setKeywords} setSlug={setSlug} setCreatedAt={setCreatedAt} toast={toast}
              />
            ),
          },
          { text: 'Clear Draft', className: 'btn-sm btn-error btn-outline', onClick: handleClearDraft },
          { text: 'Back to Posts', className: 'btn-sm btn-primary', onClick: () => router.push('/admin/posts') },
        ]}
      />

      <TranslationSection
        mode={mode}
        translation={tr}
        fields={POST_TRANSLATION_FIELDS}
        entityLabel="blog post"
        enSourceForm={{ title, content, description, slug }}
        onConfirm={handleAddLangConfirm}
      />

      <DynamicText label="Title" placeholder="Title" value={titleField.value} setValue={titleField.set} size="md" />

      {tr.isEN && (
        <>
          <DynamicSelect
            label="Status"
            selectedValue={status}
            onValueChange={(v) => {
              setStatus(v as PostStatus)
              if (v !== 'SCHEDULED') setPublishedAt(null)
            }}
            options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'SCHEDULED', label: 'Scheduled' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'ARCHIVED', label: 'Archived' },
            ]}
          />
          {status === 'SCHEDULED' && (
            <DynamicDate
              label="Publish At"
              canBeNull
              value={publishedAt}
              onChange={setPublishedAt}
              min={new Date().toISOString().slice(0, 16)}
            />
          )}
          <DynamicSelect
            label="Category"
            endpoint="/api/categories" dataKey="categories" valueKey="categoryId" labelKey="title"
            searchKey="search" selectedValue={categoryId} onValueChange={setCategoryId}
            placeholder="Kategori Seçin" searchPlaceholder="Kategori ara..." debounceMs={400}
          />
          <DynamicDate label="Created At" value={createdAt} onChange={setCreatedAt} />
          <DynamicText label="Views" placeholder="Views" value={String(views)} setValue={(v) => setViews(Number(v))} size="md" />
        </>
      )}

      <GenericElement label="Content">
        <Editor value={contentField.value || ''} onChange={contentField.set} />
      </GenericElement>

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
          <DynamicSelect
            label="Author"
            key={routePostId + '_author_select'}
            endpoint="/api/users" dataKey="users" valueKey="userId"
            labelKey={['userProfile.name', 'email']} searchKey="search"
            selectedValue={authorId} onValueChange={setAuthorId}
            placeholder="Select Author" searchPlaceholder="Search users..." debounceMs={400}
            disabled={user?.userRole !== 'ADMIN'} disabledError="You can only change if you are admin"
          />
          <GenericElement label="Image">
            <ImageLoad image={image} setImage={setImage} uploadFolder="posts" toast={toast} />
          </GenericElement>
        </>
      )}
    </Form>
  )
}

export default SinglePost
