'use client'
import { useEffect, useMemo, useState } from 'react'
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

type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

const SinglePost = () => {
  const { user } = useGlobalStore()

  const localStorageKey = 'post_drafts'
  // Route param (tek kaynak)
  const params = useParams<{ postId: string }>()
  const routePostId = params?.postId
  const router = useRouter()

  // Mode is derived from param (not state)
  const mode: 'create' | 'edit' = useMemo(
    () => (routePostId === 'create' ? 'create' : 'edit'),
    [routePostId]
  )

  const [loading, setLoading] = useState(true)

  // Model fields
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

  // Slug generation (only in create mode and after loading is done)
  useEffect(() => {
    if (mode === 'edit' || loading) return
    if (!title) return

    const invalidChars = /[^\w\s-]/g
    let slugifiedTitle = title.replace(invalidChars, '')
    slugifiedTitle = slugifiedTitle.replace(/\s+/g, '-')
    slugifiedTitle = slugifiedTitle.replace(/--+/g, '-')
    slugifiedTitle = slugifiedTitle.toLowerCase()

    const month = createdAt.getMonth() + 1
    const year = createdAt.getFullYear()
    const monthString = month < 10 ? `0${month}` : String(month)

    setSlug(`${slugifiedTitle}-${monthString}${year}`)
  }, [title, mode, loading, createdAt])

  // Load post (in edit mode)
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      // Param yoksa
      if (!routePostId) {
        setLoading(false)
        return
      }
      // Create mod
      if (routePostId === 'create') {
        setLoading(false)
        return
      }

      try {
        const res = await axiosInstance.get('/api/posts', {
          params: { postId: routePostId, status: 'ALL' },
        })

        const posts = res.data?.posts ?? []
        const post = posts.find((p: any) => p.postId === routePostId)
        if (!post) {
          toast.error('Post not found')
          return
        }
        if (cancelled) return

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
      } catch (error: any) {
        console.error(error)
        toast.error(error?.response?.data?.message ?? 'Failed to load post')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [routePostId])

  // Auto Save Draft to LocalStorage
  useEffect(() => {
    if (loading) return

    const draft = {
      title,
      content,
      description,
      slug,
      keywords,
      authorId,
      categoryId,
      status,
      image,
    }

    try {
      const caches = localStorage.getItem(localStorageKey)
      let parsedCaches: Record<string, any> = {}

      try {
        parsedCaches = caches ? JSON.parse(caches) : {}
      } catch {
        parsedCaches = {}
      }

      parsedCaches[routePostId] = draft
      localStorage.setItem(localStorageKey, JSON.stringify(parsedCaches))
    } catch (err) {
      console.error('Draft autosave error:', err)
    }
  }, [title, content, description, slug, keywords, authorId, categoryId, status, image, loading])

  // Load Draft from LocalStorage
  useEffect(() => {
    try {
      const caches = localStorage.getItem(localStorageKey)
      if (!caches) return

      const parsed = JSON.parse(caches)
      const draft = parsed[routePostId]
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
    } catch (err) {
      console.error('Draft load error', err)
    }
  }, [])

  const handleSubmit = async () => {
    const errors: string[] = []
    const required: Record<string, unknown> = {
      title,
      content,
      description,
      slug,
      authorId,
      categoryId,
    }

    for (const [key, val] of Object.entries(required)) {
      if (typeof val === 'string' && val.trim() === '') {
        errors.push(`${key} is required`)
      }
      if (Array.isArray(val) && val.length === 0) {
        errors.push(`${key} is required`)
      }
    }

    if (errors.length) {
      errors.forEach((msg) => toast.error(msg))
      return
    }

    const body = {
      postId: routePostId !== 'create' ? routePostId : undefined,
      title,
      content,
      description,
      slug,
      keywords,
      authorId,
      categoryId,
      status,
      createdAt,
      views,
      image,
    }

    try {
      if (mode === 'create') {
        await axiosInstance.post('/api/posts', body)
        toast.success('Post created successfully')
      } else {
        await axiosInstance.put(`/api/posts/${routePostId}`, body)
        toast.success('Post updated successfully')
      }
      router.push('/admin/posts')
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
          onClick: () => router.push('/admin/posts'),
          className: 'btn-secondary',
        },
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
          {
            text: 'Back to Posts',
            className: 'btn-sm btn-primary',
            onClick: () => router.push('/admin/posts'),
          },
        ]}
      />

      <DynamicText label="Title" placeholder="Title" value={title} setValue={setTitle} size="md" />

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

      <GenericElement label="Content">
        <Editor value={content || ''} onChange={(newValue) => setContent(newValue)} />
      </GenericElement>

      <DynamicText
        label="Description"
        placeholder="Description"
        value={description}
        setValue={setDescription}
        size="md"
        isTextarea={true}
      />

      <DynamicText label="Slug" placeholder="Slug" value={slug} setValue={setSlug} size="md" />

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
    </Form>
  )
}

export default SinglePost
