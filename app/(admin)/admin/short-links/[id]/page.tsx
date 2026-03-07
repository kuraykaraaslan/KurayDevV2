'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import DynamicText from '@/components/admin/UI/Forms/DynamicText'
import GenericElement from '@/components/admin/UI/Forms/GenericElement'
import Form from '@/components/admin/UI/Forms/Form'
import SectionCard from '@/components/admin/UI/SectionCard'
import { faLink } from '@fortawesome/free-solid-svg-icons'
import CopyButton from '@/components/admin/UI/CopyButton'

const APP_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST || ''

const SingleShortLink = () => {
  const { t } = useTranslation()
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
          toast.error(t('admin.short_links.not_found'))
          return
        }
        if (cancelled) return
        setOriginalUrl(link.originalUrl ?? '')
        setCode(link.code ?? '')
        setClicks(link.clicks ?? 0)
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? t('admin.short_links.load_failed'))
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
        toast.success(t('admin.short_links.created_success'))
      } else {
        await axiosInstance.patch(`/api/links/${routeId}`, { originalUrl, code })
        toast.success(t('admin.short_links.updated_success'))
      }
      router.push('/admin/short-links')
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? t('admin.short_links.save_failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('admin.short_links.delete_confirm'))) return
    try {
      await axiosInstance.delete(`/api/links/${routeId}`)
      toast.success(t('admin.short_links.deleted_success'))
      router.push('/admin/short-links')
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? t('admin.short_links.delete_failed'))
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
        title={mode === 'create' ? t('admin.short_links.new_title') : t('admin.short_links.edit_title')}
        actionButtons={[
          {
            text: t('admin.short_links.back'),
            onClick: () => router.push('/admin/short-links'),
            className: 'btn-ghost',
          },
          ...(mode === 'edit'
            ? [
                {
                  text: t('admin.short_links.analytics_btn'),
                  onClick: () => router.push(`/admin/short-links/${routeId}/analytics`),
                  className: 'btn-info btn-outline',
                },
              ]
            : []),
        ]}
      />

      <div className="grid grid-cols-1 gap-4">
          <SectionCard icon={faLink} title={t('admin.short_links.link_details_title')} description={t('admin.short_links.link_details_description')}>
          <DynamicText
            label={t('admin.short_links.original_url_label')}
            value={originalUrl}
            setValue={setOriginalUrl}
          />

          {mode === 'edit' && (
            <DynamicText
              label={t('admin.short_links.short_code_label')}
              placeholder="abc123"
              value={code}
              setValue={setCode}
            />
          )}

          {mode === 'edit' && (
            <GenericElement label={t('admin.short_links.short_url_label')}>
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
            <GenericElement label={t('admin.short_links.total_clicks_label')}>
              <span className="badge badge-neutral badge-lg">{clicks}</span>
            </GenericElement>
          )}
        </SectionCard>
      </div>
    </Form>
  )
}

export default SingleShortLink
