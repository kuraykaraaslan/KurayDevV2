'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import DynamicText from '@/components/admin/UI/Forms/DynamicText'
import GenericElement from '@/components/admin/UI/Forms/GenericElement'
import Form from '@/components/admin/UI/Forms/Form'
import SectionCard from '@/components/admin/UI/SectionCard'
import { faLink } from '@fortawesome/free-solid-svg-icons'
import CopyButton from '@/components/admin/UI/CopyButton'

const APP_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST || ''

const SingleShortLink = () => {
  const params = useParams<{ id: string }>()
  const routeId = params?.id
  const router = useRouter()

  const mode: 'create' | 'edit' = useMemo(
    () => (routeId === 'create' ? 'create' : 'edit'),
    [routeId]
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [originalUrl, setOriginalUrl] = useState('')
  const [code, setCode] = useState('')
  const [clicks, setClicks] = useState(0)

  // Load in edit mode
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!routeId || routeId === 'create') {
        setLoading(false)
        return
      }

      try {
        const res = await axiosInstance.get(`/api/links/${routeId}`)
        const link = res.data?.link
        if (!link) {
          toast.error('Short link not found')
          return
        }
        if (cancelled) return
        setOriginalUrl(link.originalUrl ?? '')
        setCode(link.code ?? '')
        setClicks(link.clicks ?? 0)
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? 'Failed to load short link')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [routeId])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (mode === 'create') {
        await axiosInstance.post('/api/links', { url: originalUrl })
        toast.success('Short link created')
      } else {
        await axiosInstance.patch(`/api/links/${routeId}`, { originalUrl, code })
        toast.success('Short link updated')
      }
      router.push('/admin/short-links')
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Failed to save short link')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this short link?')) return
    try {
      await axiosInstance.delete(`/api/links/${routeId}`)
      toast.success('Short link deleted')
      router.push('/admin/short-links')
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Failed to delete short link')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  return (
    <Form
      actions={[
        ...(mode === 'edit'
          ? [{ label: 'Delete', onClick: handleDelete, className: 'btn-error' }]
          : []),
        {
          label: saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save',
          onClick: handleSave,
          className: 'btn-primary',
          loading: saving,
          disabled: saving,
        },
      ]}
    >
      <FormHeader
        title={mode === 'create' ? 'New Short Link' : 'Edit Short Link'}
        actionButtons={[
          {
            text: '← Back',
            onClick: () => router.push('/admin/short-links'),
            className: 'btn-ghost',
          },
          ...(mode === 'edit'
            ? [
                {
                  text: 'Analytics',
                  onClick: () => router.push(`/admin/short-links/${routeId}/analytics`),
                  className: 'btn-info btn-outline',
                },
              ]
            : []),
        ]}
      />

      <div className="grid grid-cols-1 gap-4">
        <SectionCard icon={faLink} title="Link Details" description="Configure the short link">
          <DynamicText
            label="Original URL"
            placeholder="https://example.com/some/long/path"
            value={originalUrl}
            setValue={setOriginalUrl}
          />

          {mode === 'edit' && (
            <DynamicText
              label="Short Code"
              placeholder="abc123"
              value={code}
              setValue={setCode}
            />
          )}

          {mode === 'edit' && (
            <GenericElement label="Short URL">
              <div className="flex items-center gap-1">
                <a
                  href={`${APP_HOST}/s/${code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm font-mono"
                >
                  {APP_HOST}/s/{code}
                </a>
                <CopyButton text={`${APP_HOST}/s/${code}`} size="xs" />
              </div>
            </GenericElement>
          )}

          {mode === 'edit' && (
            <GenericElement label="Total Clicks">
              <span className="badge badge-neutral badge-lg">{clicks}</span>
            </GenericElement>
          )}
        </SectionCard>
      </div>
    </Form>
  )
}

export default SingleShortLink
