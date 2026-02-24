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
import LanguageBar, { LANG_NAMES } from '@/components/admin/Features/Translations/LanguageBar'
import AddLanguageModal, { TranslationFieldDef } from '@/components/admin/Features/Translations/AddLanguageModal'

const POST_TRANSLATION_FIELDS: TranslationFieldDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'slug', label: 'Slug' },
  { key: 'content', label: 'Content', isRichText: true },
]

type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

type TranslationForm = {
  title: string
  content: string
  description: string
  slug: string
}

const emptyTranslation = (): Record<string, string> => ({
  title: '',
  content: '',
  description: '',
  slug: '',
})

const SinglePost = () => {
  const { user } = useGlobalStore()
  const localStorageKey = 'post_drafts'
  const params = useParams<{ postId: string }>()
  const routePostId = params?.postId
  const router = useRouter()

  const mode: 'create' | 'edit' = useMemo(
    () => (routePostId === 'create' ? 'create' : 'edit'),
    [routePostId]
  )

  // ── EN state ────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [image, setImage] = useState('')
  const [content, setContent] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [authorId, setAuthorId] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [status, setStatus] = useState<PostStatus>('DRAFT')
  const [createdAt, setCreatedAt] = useState<Date>(new Date())
  const [views, setViews] = useState<number>(0)

  // ── Translation state ───────────────────────────────────────
  const [activeLang, setActiveLang] = useState('en')
  const [addedLangs, setAddedLangs] = useState<string[]>([])
  const [savedLangs, setSavedLangs] = useState<string[]>([])
  const [translationForms, setTranslationForms] = useState<Record<string, Record<string, string>>>({})
  const trTitleRef = useRef<Record<string, string>>({})

  // ── Derived: current language's field values ─────────────────
  const isEN = activeLang === 'en'
  const tr = translationForms[activeLang] ?? emptyTranslation()

  const currentTitle = isEN ? title : tr.title
  const currentContent = isEN ? content : tr.content
  const currentDescription = isEN ? description : tr.description
  const currentSlug = isEN ? slug : tr.slug

  const setCurrentTitle = (val: string) => {
    if (isEN) setTitle(val)
    else setTranslationForms((p) => ({ ...p, [activeLang]: { ...tr, title: val } }))
  }
  const setCurrentContent = (val: string) => {
    if (isEN) setContent(val)
    else setTranslationForms((p) => ({ ...p, [activeLang]: { ...tr, content: val } }))
  }
  const setCurrentDescription = (val: string) => {
    if (isEN) setDescription(val)
    else setTranslationForms((p) => ({ ...p, [activeLang]: { ...tr, description: val } }))
  }
  const setCurrentSlug = (val: string) => {
    if (isEN) setSlug(val)
    else setTranslationForms((p) => ({ ...p, [activeLang]: { ...tr, slug: val } }))
  }

  // ── Slug auto-generation for EN (create mode) ────────────────
  useEffect(() => {
    if (mode === 'edit' || loading) return
    if (!title) return

    let s = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').toLowerCase()
    const month = createdAt.getMonth() + 1
    const year = createdAt.getFullYear()
    setSlug(`${s}-${month < 10 ? '0' + month : month}${year}`)
  }, [title, mode, loading, createdAt])

  // ── Slug auto-generation for non-EN ─────────────────────────
  useEffect(() => {
    if (isEN) return
    const currentTr = translationForms[activeLang]
    const prevTitle = trTitleRef.current[activeLang] ?? ''
    if (!currentTr?.title || currentTr.title === prevTitle) return
    trTitleRef.current[activeLang] = currentTr.title

    const s = currentTr.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')

    setTranslationForms((p) => ({ ...p, [activeLang]: { ...currentTr, slug: `${s}-${activeLang}` } }))
  }, [activeLang, translationForms[activeLang]?.title])

  // ── Load post + translations (edit mode) ─────────────────────
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!routePostId || routePostId === 'create') {
        setLoading(false)
        return
      }

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
        setViews(typeof post.views === 'number' ? post.views : 0)

        const translations: any[] = trRes.data?.translations ?? []
        const trMap: Record<string, TranslationForm> = {}
        const langs: string[] = []
        translations.forEach((t) => {
          trMap[t.lang] = { title: t.title, content: t.content, description: t.description ?? '', slug: t.slug }
          langs.push(t.lang)
        })
        setTranslationForms(trMap)
        setAddedLangs(langs)
        setSavedLangs(langs)
      } catch (error: any) {
        console.error(error)
        toast.error(error?.response?.data?.message ?? 'Failed to load post')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [routePostId])

  // ── Draft auto-save (EN only) ────────────────────────────────
  useEffect(() => {
    if (loading) return
    const draft = { title, content, description, slug, keywords, authorId, categoryId, status, image }
    try {
      const caches = localStorage.getItem(localStorageKey)
      let parsed: Record<string, any> = {}
      try { parsed = caches ? JSON.parse(caches) : {} } catch { parsed = {} }
      parsed[routePostId] = draft
      localStorage.setItem(localStorageKey, JSON.stringify(parsed))
    } catch {}
  }, [title, content, description, slug, keywords, authorId, categoryId, status, image, loading])

  // ── Load draft from LocalStorage ─────────────────────────────
  useEffect(() => {
    try {
      const caches = localStorage.getItem(localStorageKey)
      if (!caches) return
      const draft = JSON.parse(caches)[routePostId]
      if (!draft) return
      setTitle(draft.title ?? '')
      setContent(draft.content ?? '')
      setDescription(draft.description ?? '')
      setSlug(draft.slug ?? '')
      setKeywords(draft.keywords ?? [])
      setAuthorId(draft.authorId ?? '')
      setCategoryId(draft.categoryId ?? '')
      setStatus(draft.status ?? 'DRAFT')
      setImage(draft.image ?? '')
      toast.info('Draft loaded from browser')
    } catch {}
  }, [])

  // ── Handlers ─────────────────────────────────────────────────
  const clearAutoSave = () => {
    try {
      const caches = localStorage.getItem(localStorageKey)
      if (caches) {
        const parsed = JSON.parse(caches)
        delete parsed[routePostId]
        localStorage.setItem(localStorageKey, JSON.stringify(parsed))
      }
    } catch {}
  }

  const handleClearDraft = () => {
    clearAutoSave()
    setTitle('')
    setContent('')
    setDescription('')
    setSlug('')
    setKeywords([])
    setAuthorId('')
    setCategoryId('')
    setStatus('DRAFT')
    setImage('')
    setCreatedAt(new Date())
    setViews(0)
    toast.info('Draft cleared')
  }

  // ── Add language modal ───────────────────────────────────────
  const [addLangModal, setAddLangModal] = useState<{ open: boolean; targetLang: string }>({
    open: false,
    targetLang: '',
  })

  const sourceForms = {
    en: { title, content, description, slug },
    ...translationForms,
  }

  const availableSourceLangs = ['en', ...savedLangs]

  const handleAddLang = (lang: string) => {
    setAddLangModal({ open: true, targetLang: lang })
  }

  const handleAddLangConfirm = (lang: string, prefilled?: Record<string, string>) => {
    setAddedLangs((p) => [...p, lang])
    setActiveLang(lang)
    trTitleRef.current[lang] = prefilled?.title ?? ''
    if (prefilled) {
      setTranslationForms((p) => ({ ...p, [lang]: prefilled }))
    }
  }

  const handleDeleteLang = async (lang: string) => {
    if (!confirm(`Delete ${LANG_NAMES[lang] ?? lang} translation?`)) return

    if (savedLangs.includes(lang)) {
      try {
        await axiosInstance.delete(`/api/posts/${routePostId}/translations/${lang}`)
        setSavedLangs((p) => p.filter((l) => l !== lang))
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? 'Delete failed')
        return
      }
    }

    setAddedLangs((p) => p.filter((l) => l !== lang))
    setTranslationForms((p) => { const next = { ...p }; delete next[lang]; return next })
    if (activeLang === lang) setActiveLang('en')
    toast.success(`${LANG_NAMES[lang] ?? lang} translation removed`)
  }

  const handleSubmit = async () => {
    // ── Save translation ──────────────────────────────────────
    if (!isEN) {
      const errors: string[] = []
      if (!currentTitle.trim()) errors.push('title is required')
      if (!currentContent.trim()) errors.push('content is required')
      if (!currentSlug.trim()) errors.push('slug is required')
      if (errors.length) { errors.forEach((m) => toast.error(m)); return }

      setSaving(true)
      try {
        await axiosInstance.post(`/api/posts/${routePostId}/translations`, {
          lang: activeLang,
          title: currentTitle,
          content: currentContent,
          description: currentDescription || null,
          slug: currentSlug,
        })
        setSavedLangs((p) => [...new Set([...p, activeLang])])
        toast.success(`${LANG_NAMES[activeLang] ?? activeLang} translation saved`)
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? 'Save failed')
      } finally {
        setSaving(false)
      }
      return
    }

    // ── Save EN post ──────────────────────────────────────────
    const errors: string[] = []
    const required: Record<string, unknown> = { title, content, description, slug, authorId, categoryId }
    for (const [key, val] of Object.entries(required)) {
      if (typeof val === 'string' && val.trim() === '') errors.push(`${key} is required`)
      if (Array.isArray(val) && val.length === 0) errors.push(`${key} is required`)
    }
    if (errors.length) { errors.forEach((m) => toast.error(m)); return }

    const body = {
      postId: routePostId !== 'create' ? routePostId : undefined,
      title, content, description, slug, keywords, authorId, categoryId, status, createdAt, views, image,
    }

    try {
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

  const saveLabel = isEN ? 'Save' : `Save ${activeLang.toUpperCase()}`

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
                setTitle={setTitle}
                setContent={setContent}
                setDescription={setDescription}
                setKeywords={setKeywords}
                setSlug={setSlug}
                setCreatedAt={setCreatedAt}
                toast={toast}
              />
            ),
          },
          { text: 'Clear Draft', className: 'btn-sm btn-error btn-outline', onClick: handleClearDraft },
          { text: 'Back to Posts', className: 'btn-sm btn-primary', onClick: () => router.push('/admin/posts') },
        ]}
      />

      {/* Language bar — only in edit mode */}
      {mode === 'edit' && routePostId && (
        <LanguageBar
          activeLang={activeLang}
          addedLangs={addedLangs}
          savedLangs={savedLangs}
          onSelect={setActiveLang}
          onAdd={handleAddLang}
          onDelete={handleDeleteLang}
        />
      )}

      {/* Translation context label */}
      {!isEN && (
        <div className="alert alert-info alert-sm mb-2 py-2 text-sm">
          Editing <strong>{LANG_NAMES[activeLang]}</strong> translation — title, content, description and slug only.
        </div>
      )}

      <DynamicText
        label="Title"
        placeholder="Title"
        value={currentTitle}
        setValue={setCurrentTitle}
        size="md"
      />

      {/* EN-only fields */}
      {isEN && (
        <>
          <DynamicSelect
            label="Status"
            selectedValue={status}
            onValueChange={(value) => setStatus(value as PostStatus)}
            options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'ARCHIVED', label: 'Archived' },
            ]}
          />

          <DynamicSelect
            label="Category"
            endpoint="/api/categories"
            dataKey="categories"
            valueKey="categoryId"
            labelKey="title"
            searchKey="search"
            selectedValue={categoryId}
            onValueChange={setCategoryId}
            placeholder="Kategori Seçin"
            searchPlaceholder="Kategori ara..."
            debounceMs={400}
          />

          <DynamicDate label="Created At" value={createdAt} onChange={setCreatedAt} />

          <DynamicText
            label="Views"
            placeholder="Views"
            value={String(views)}
            setValue={(val) => setViews(Number(val))}
            size="md"
          />
        </>
      )}

      <GenericElement label="Content">
        <Editor value={currentContent || ''} onChange={setCurrentContent} />
      </GenericElement>

      <DynamicText
        label="Description"
        placeholder="Description"
        value={currentDescription}
        setValue={setCurrentDescription}
        size="md"
        isTextarea
      />

      <DynamicText
        label="Slug"
        placeholder="Slug"
        value={currentSlug}
        setValue={setCurrentSlug}
        size="md"
      />

      <AddLanguageModal
        open={addLangModal.open}
        onClose={() => setAddLangModal((s) => ({ ...s, open: false }))}
        targetLang={addLangModal.targetLang}
        sourceForms={sourceForms}
        availableSourceLangs={availableSourceLangs}
        fields={POST_TRANSLATION_FIELDS}
        entityLabel="blog post"
        onConfirm={handleAddLangConfirm}
      />

      {/* EN-only fields */}
      {isEN && (
        <>
          <DynamicText
            label="Keywords"
            placeholder="Keywords"
            value={keywords.join(',')}
            setValue={(val) =>
              setKeywords(val.split(',').map((s) => s.trim()).filter((s) => s.length > 0))
            }
            size="md"
          />

          <DynamicSelect
            label="Author"
            key={routePostId + '_author_select'}
            endpoint="/api/users"
            dataKey="users"
            valueKey="userId"
            labelKey={['userProfile.name', 'email']}
            searchKey="search"
            selectedValue={authorId}
            onValueChange={setAuthorId}
            placeholder="Select Author"
            searchPlaceholder="Search users..."
            debounceMs={400}
            disabled={user?.userRole !== 'ADMIN'}
            disabledError="You can only change if you are admin"
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
