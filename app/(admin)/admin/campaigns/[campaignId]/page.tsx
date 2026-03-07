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
import Editor from '@/components/admin/UI/Forms/Editor'
import { Campaign } from '@/types/common/CampaignTypes'

const statusBadge = (status: Campaign['status']) => {
  const map: Record<Campaign['status'], string> = {
    DRAFT: 'badge-warning',
    SENDING: 'badge-info',
    SENT: 'badge-success',
  }
  return <span className={`badge ${map[status]}`}>{status}</span>
}

const SingleCampaign = () => {
  const { t } = useTranslation()
  const localStorageKey = 'campaign_drafts'

  const params = useParams<{ campaignId: string }>()
  const routeCampaignId = params?.campaignId
  const router = useRouter()

  const mode: 'create' | 'edit' = useMemo(
    () => (routeCampaignId === 'create' ? 'create' : 'edit'),
    [routeCampaignId]
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<Campaign['status']>('DRAFT')

  const clearAutoSave = () => {
    try {
      const caches = localStorage.getItem(localStorageKey)
      if (caches) {
        const parsed = JSON.parse(caches)
        delete parsed[routeCampaignId]
        localStorage.setItem(localStorageKey, JSON.stringify(parsed))
      }
    } catch {}
  }

  // Load campaign in edit mode
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!routeCampaignId || routeCampaignId === 'create') {
        setLoading(false)
        return
      }

      try {
        const res = await axiosInstance.get(`/api/newsletter/campaigns/${routeCampaignId}`)
        const campaign = res.data?.campaign

        if (!campaign) {
          toast.error(t('admin.campaigns.not_found'))
          return
        }
        if (cancelled) return

        setTitle(campaign.title ?? '')
        setSubject(campaign.subject ?? '')
        setContent(campaign.content ?? '')
        setStatus(campaign.status ?? 'DRAFT')
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? t('admin.campaigns.load_failed'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [routeCampaignId])

  // Auto Save Draft to LocalStorage (only DRAFT campaigns)
  useEffect(() => {
    if (loading || status !== 'DRAFT') return

    const draft = { title, subject, content }

    try {
      const caches = localStorage.getItem(localStorageKey)
      let parsedCaches: Record<string, any> = {}
      try {
        parsedCaches = caches ? JSON.parse(caches) : {}
      } catch {
        parsedCaches = {}
      }
      parsedCaches[routeCampaignId] = draft
      localStorage.setItem(localStorageKey, JSON.stringify(parsedCaches))
    } catch (err) {
      console.error('Draft autosave error:', err)
    }
  }, [title, subject, content, loading, status, routeCampaignId])

  // Load Draft from LocalStorage
  useEffect(() => {
    try {
      const caches = localStorage.getItem(localStorageKey)
      if (!caches) return

      const parsed = JSON.parse(caches)
      const draft = parsed[routeCampaignId]
      if (!draft) return

      setTitle(draft.title ?? '')
      setSubject(draft.subject ?? '')
      setContent(draft.content ?? '')

      toast.info(t('admin.campaigns.draft_loaded'))
    } catch (err) {
      console.error('Draft load error', err)
    }
  }, [])

  const handleClearDraft = () => {
    clearAutoSave()
    setTitle('')
    setSubject('')
    setContent('')
    toast.info(t('admin.campaigns.draft_cleared'))
  }

  const handleSubmit = async () => {
    const errors: string[] = []

    if (!title.trim()) errors.push(t('admin.campaigns.title_required'))
    if (!subject.trim()) errors.push(t('admin.campaigns.subject_required'))
    if (!content.trim()) errors.push(t('admin.campaigns.content_required'))

    if (errors.length) {
      errors.forEach((msg) => toast.error(msg))
      return
    }

    const body = { title, subject, content }

    setSaving(true)
    try {
      if (mode === 'create') {
        const res = await axiosInstance.post('/api/newsletter/campaigns', body)
        toast.success(t('admin.campaigns.created_success'))
        clearAutoSave()
        router.push(`/admin/campaigns/${res.data.campaign.campaignId}`)
      } else {
        await axiosInstance.put(`/api/newsletter/campaigns/${routeCampaignId}`, body)
        toast.success(t('admin.campaigns.updated_success'))
        clearAutoSave()
        router.push('/admin/campaigns')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? t('admin.campaigns.save_failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async () => {
    if (!confirm(t('admin.campaigns.send_confirm'))) return

    setSending(true)
    try {
      const res = await axiosInstance.post(
        `/api/newsletter/campaigns/${routeCampaignId}/send`
      )
      toast.success(t('admin.campaigns.sent_success', { count: res.data.sentCount }))
      setStatus('SENT')
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? t('admin.campaigns.send_failed'))
    } finally {
      setSending(false)
    }
  }

  const isDraft = status === 'DRAFT'

  return (
    <Form
      className="mx-auto mb-8 bg-base-300 p-6 rounded-lg shadow max-w-7xl"
      actions={
        isDraft
          ? [
              {
                label: saving ? t('admin.campaigns.saving') : t('common.save'),
                onClick: handleSubmit,
                className: 'btn-primary',
                disabled: saving || loading,
                loading: saving,
              },
              ...(mode === 'edit'
                ? [
                    {
                      label: sending ? t('admin.campaigns.sending') : t('admin.campaigns.send_to_all'),
                      onClick: handleSend,
                      className: 'btn-success',
                      disabled: sending || saving,
                      loading: sending,
                    },
                  ]
                : []),
              {
              label: t('common.cancel'),
              onClick: () => router.push('/admin/campaigns'),
              className: 'btn-secondary',
            },
          ]
          : [
              {
                label: t('admin.campaigns.back'),
                onClick: () => router.push('/admin/campaigns'),
                className: 'btn-secondary',
              },
            ]
      }
    >
      <FormHeader
        title={mode === 'create' ? t('admin.campaigns.new_title') : t('admin.campaigns.edit_title')}
        className="my-4"
        actionButtons={[
          ...(isDraft && mode === 'edit'
            ? [
                {
                  text: t('admin.campaigns.clear_draft'),
                  className: 'btn-sm btn-error btn-outline',
                  onClick: handleClearDraft,
                },
              ]
            : []),
          {
            text: t('admin.campaigns.back'),
            className: 'btn-sm btn-primary',
            onClick: () => router.push('/admin/campaigns'),
          },
        ]}
      />

      {mode === 'edit' && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-base-content/60">{t('common.status')}:</span>
          {statusBadge(status)}
        </div>
      )}

      {!isDraft && mode === 'edit' && (
        <div className="alert alert-info mb-4">
          <span>{t('admin.campaigns.sent_readonly')}</span>
        </div>
      )}

      <DynamicText
        label={t('admin.campaigns.title_label')}
        placeholder={t('admin.campaigns.title_placeholder')}
        value={title}
        setValue={isDraft ? setTitle : () => {}}
        size="md"
      />

      <DynamicText
        label={t('admin.campaigns.subject_label')}
        placeholder={t('admin.campaigns.subject_placeholder')}
        value={subject}
        setValue={isDraft ? setSubject : () => {}}
        size="md"
      />

      <GenericElement label={t('admin.campaigns.content_label')}>
        {isDraft ? (
          <Editor value={content} onChange={setContent} />
        ) : (
          <div
            className="prose max-w-none p-4 bg-base-100 rounded-lg border border-base-200"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </GenericElement>
    </Form>
  )
}

export default SingleCampaign
