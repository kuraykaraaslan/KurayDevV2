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

const SingleTestimonial = () => {
  const localStorageKey = 'testimonial_drafts'

  const params = useParams<{ testimonialId: string }>()
  const routeTestimonialId = params?.testimonialId
  const router = useRouter()

  const mode: 'create' | 'edit' = useMemo(
    () => (routeTestimonialId === 'create' ? 'create' : 'edit'),
    [routeTestimonialId]
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [review, setReview] = useState('')
  const [image, setImage] = useState('')
  const [status, setStatus] = useState('PUBLISHED')

  const clearAutoSave = () => {
    try {
      const caches = localStorage.getItem(localStorageKey)
      if (caches) {
        const parsed = JSON.parse(caches)
        delete parsed[routeTestimonialId]
        localStorage.setItem(localStorageKey, JSON.stringify(parsed))
      }
    } catch {}
  }

  // Load testimonial in edit mode
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!routeTestimonialId || routeTestimonialId === 'create') {
        setLoading(false)
        return
      }

      try {
        const res = await axiosInstance.get(`/api/testimonials/${routeTestimonialId}`)
        const testimonial = res.data?.testimonial

        if (!testimonial) {
          toast.error('Testimonial not found')
          return
        }
        if (cancelled) return

        setName(testimonial.name ?? '')
        setTitle(testimonial.title ?? '')
        setReview(testimonial.review ?? '')
        setImage(testimonial.image ?? '')
        setStatus(testimonial.status ?? 'PUBLISHED')
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? 'Failed to load testimonial')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [routeTestimonialId])

  // Auto Save Draft to LocalStorage
  useEffect(() => {
    if (loading) return

    const draft = { name, title, review, image, status }

    try {
      const caches = localStorage.getItem(localStorageKey)
      let parsedCaches: Record<string, any> = {}
      try {
        parsedCaches = caches ? JSON.parse(caches) : {}
      } catch {
        parsedCaches = {}
      }
      parsedCaches[routeTestimonialId] = draft
      localStorage.setItem(localStorageKey, JSON.stringify(parsedCaches))
    } catch (err) {
      console.error('Draft autosave error:', err)
    }
  }, [name, title, review, image, status, loading, routeTestimonialId])

  // Load Draft from LocalStorage
  useEffect(() => {
    try {
      const caches = localStorage.getItem(localStorageKey)
      if (!caches) return

      const parsed = JSON.parse(caches)
      const draft = parsed[routeTestimonialId]
      if (!draft) return

      setName(draft.name ?? '')
      setTitle(draft.title ?? '')
      setReview(draft.review ?? '')
      setImage(draft.image ?? '')
      setStatus(draft.status ?? 'PUBLISHED')

      toast.info('Draft loaded from browser')
    } catch (err) {
      console.error('Draft load error', err)
    }
  }, [])

  const handleClearDraft = () => {
    clearAutoSave()
    setName('')
    setTitle('')
    setReview('')
    setImage('')
    setStatus('PUBLISHED')
    toast.info('Draft cleared')
  }

  const handleSubmit = async () => {
    const errors: string[] = []

    if (!name.trim()) errors.push('Name is required')
    if (!title.trim()) errors.push('Title is required')
    if (!review.trim()) errors.push('Review is required')

    if (errors.length) {
      errors.forEach((msg) => toast.error(msg))
      return
    }

    const body = { name, title, review, image, status }

    setSaving(true)
    try {
      if (mode === 'create') {
        await axiosInstance.post('/api/testimonials', body)
        toast.success('Testimonial created successfully')
      } else {
        await axiosInstance.put(`/api/testimonials/${routeTestimonialId}`, body)
        toast.success('Testimonial updated successfully')
      }
      clearAutoSave()
      router.push('/admin/testimonials')
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Save failed')
    } finally {
      setSaving(false)
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
          disabled: saving || loading,
          loading: saving,
        },
        {
          label: 'Cancel',
          onClick: () => router.push('/admin/testimonials'),
          className: 'btn-secondary',
        },
      ]}
    >
      <FormHeader
        title={mode === 'create' ? 'Add Testimonial' : 'Edit Testimonial'}
        className="my-4"
        actionButtons={[
          {
            text: 'Clear Draft',
            className: 'btn-sm btn-error btn-outline',
            onClick: handleClearDraft,
          },
          {
            text: 'Back to Testimonials',
            className: 'btn-sm btn-primary',
            onClick: () => router.push('/admin/testimonials'),
          },
        ]}
      />

      <DynamicText
        label="Name"
        placeholder="Person's name"
        value={name}
        setValue={setName}
        size="md"
      />

      <DynamicText
        label="Title"
        placeholder="Position / Company"
        value={title}
        setValue={setTitle}
        size="md"
      />

      <DynamicText
        label="Review"
        placeholder="Testimonial text"
        value={review}
        setValue={setReview}
        size="md"
        isTextarea={true}
      />

      <GenericElement label="Status">
        <select
          className="select select-bordered w-full"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
      </GenericElement>

      <GenericElement label="Image">
        <ImageLoad image={image} setImage={setImage} uploadFolder="testimonials" toast={toast} />
      </GenericElement>
    </Form>
  )
}

export default SingleTestimonial
