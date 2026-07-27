'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import ImageLoad from '@/components/common/UI/Images/ImageLoad'
import dynamic from 'next/dynamic'
const Editor = dynamic(() => import('@/components/common/Forms/Editor'), { ssr: false })
import { TableBody, TableHeader, TableProvider, ColumnDef } from '@/components/common/Forms/DynamicTable'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import { HeadlessModal } from '@/components/common/Modal'
import DynamicText from '@/components/common/Forms/DynamicText'
import DynamicSelect from '@/components/common/Forms/DynamicSelect'
import GenericElement from '@/components/common/Forms/GenericElement'
import Form from '@/components/common/Forms/Form'
import FormHeader from '@/components/common/Forms/FormHeader'
import CheckboxGroup from '@/components/common/Forms/CheckboxGroup'
import TranslationSection from '@/components/admin/Features/Translations/TranslationSection'
import { TranslationFieldDef } from '@/components/admin/Features/Translations/AddLanguageModal'
import { useTranslationState } from '@/components/admin/hooks/useTranslationState'
import { useDraftAutoSave } from '@/components/admin/hooks/useDraftAutoSave'
import { useSlugify } from '@/components/admin/hooks/useSlugify'
import ContentScoreBar from '@/components/common/Forms/ContentScoreBar'
import {
  TITLE_SCORE_RULES,
  DESCRIPTION_SCORE_RULES,
  CONTENT_SCORE_RULES,
  SLUG_SCORE_RULES,
  KEYWORDS_SCORE_RULES,
} from '@/components/common/Forms/ContentScoreBar/rules'
import DynamicDate from '@/components/common/Forms/DynamicDate'
import { PostWithData } from '@/types/content/BlogTypes'

const PROJECT_TRANSLATION_FIELDS: TranslationFieldDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'slug', label: 'Slug' },
  { key: 'content', label: 'Content', isRichText: true },
]

const ALLOWED_PLATFORMS = ['ui/ux', 'web', 'mobile', 'desktop', 'embedded', 'other', 'iot', 'bim', 'gaming', 'machine learning']
const ALLOWED_TECHNOLOGIES = ['react', 'react native', 'express', 'next', 'java', 'python', 'c', 'c++', 'c#', 'aws', 'azure', 'gcp', 'chrome extension', 'revit api', 'other']

const SingleProject = () => {
  const params = useParams()
  const routeProjectId = params.projectId as string
  const router = useRouter()

  const mode = routeProjectId === 'create' ? 'create' : 'edit'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [image, setImage] = useState('')
  const [content, setContent] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [technologies, setTechnologies] = useState<string[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [status, setStatus] = useState('PUBLISHED')
  const [projectLinks, setProjectLinks] = useState<string[]>([])
  const [createdAt, setCreatedAt] = useState<Date>(new Date())
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date())
  const [relatedTableKey, setRelatedTableKey] = useState(0)
  const [postPickerKey, setPostPickerKey] = useState(0)
  const [attachModalOpen, setAttachModalOpen] = useState(false)

  const tr = useTranslationState({ translationApiBase: `/api/projects/${routeProjectId}/translations` })

  const handleAttachPost = async (postId: string) => {
    if (!postId || !routeProjectId || routeProjectId === 'create') return
    try {
      await axiosInstance.put(`/api/posts/${postId}/project`, { projectId: routeProjectId })
      toast.success('Post attached')
      setPostPickerKey((k) => k + 1)
      setRelatedTableKey((k) => k + 1)
      setAttachModalOpen(false)
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Attach failed')
    }
  }

  const relatedPostColumns: ColumnDef<PostWithData>[] = [
    { key: 'title', header: 'Title', accessor: (p) => p.title },
    { key: 'slug', header: 'Slug', accessor: (p) => p.slug, hideOnMobile: true },
    { key: 'status', header: 'Status', accessor: (p) => p.status, hideOnMobile: true },
  ]

  const { clearAutoSave } = useDraftAutoSave({
    storageKey: 'projectCaches',
    id: routeProjectId,
    data: { title, content, description, slug, platforms, technologies, keywords, status, image, projectLinks },
    loading,
    onLoad: (draft) => {
      setTitle(draft.title || '')
      setContent(draft.content || '')
      setDescription(draft.description || '')
      setSlug(draft.slug || '')
      setPlatforms(draft.platforms || [])
      setTechnologies(draft.technologies || [])
      setKeywords(draft.keywords || [])
      setStatus(draft.status || 'PUBLISHED')
      setImage(draft.image || '')
      setProjectLinks(draft.projectLinks || [])
    },
  })

  useSlugify({ title, mode, loading, setSlug })

  // Load project + translations (edit mode)
  useEffect(() => {
    if (routeProjectId === 'create') { setLoading(false); return }
    let cancelled = false
    const load = async () => {
      try {
        const [projectRes, translationsRes] = await Promise.all([
          axiosInstance.get('/api/projects', { params: { projectId: routeProjectId } }),
          axiosInstance.get(`/api/projects/${routeProjectId}/translations`),
        ])
        if (cancelled) return

        const project = projectRes.data?.projects?.[0]
        if (!project) { toast.error('Project not found'); return }

        setTitle(project.title ?? '')
        setContent(project.content ?? '')
        setDescription(project.description ?? '')
        setSlug(project.slug ?? '')
        setPlatforms(Array.isArray(project.platforms) ? project.platforms : [])
        setTechnologies(Array.isArray(project.technologies) ? project.technologies : [])
        setKeywords(Array.isArray(project.keywords) ? project.keywords : [])
        setStatus(project.status ?? 'PUBLISHED')
        setImage(project.image ?? '')
        setProjectLinks(Array.isArray(project.projectLinks) ? project.projectLinks : [])
        setCreatedAt(project.createdAt ? new Date(project.createdAt) : new Date())
        setUpdatedAt(project.updatedAt ? new Date(project.updatedAt) : new Date())

        tr.initTranslations(
          (translationsRes.data?.translations ?? []).map((t: any) => ({
            lang: t.lang, title: t.title ?? '', description: t.description ?? '', slug: t.slug ?? '', content: t.content ?? '',
          }))
        )
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? 'Failed to load project')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [routeProjectId])

  const handleClearDraft = () => {
    clearAutoSave()
    setTitle(''); setContent(''); setDescription(''); setSlug('')
    setPlatforms([]); setTechnologies([]); setKeywords([]); setStatus('PUBLISHED'); setImage(''); setProjectLinks([])
    toast.info('Draft cleared')
  }

  const titleField = tr.field('title', title, setTitle)
  const contentField = tr.field('content', content, setContent)
  const descriptionField = tr.field('description', description, setDescription)
  const slugField = tr.field('slug', slug, setSlug)

  const handleSubmit = async () => {
    // Save translation
    if (!tr.isEN) {
      if (!titleField.value.trim()) { toast.error('Title is required'); return }
      setSaving(true)
      try {
        await axiosInstance.post(`/api/projects/${routeProjectId}/translations`, {
          lang: tr.activeLang,
          title: titleField.value,
          description: descriptionField.value,
          slug: slugField.value,
          content: contentField.value,
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

    // Save EN project
    const errors: string[] = []
    for (const [key, val] of Object.entries({ title, content, description, slug })) {
      if (!val.trim()) errors.push(`${key} is required`)
    }
    if (platforms.length === 0) errors.push('platforms is required')
    if (errors.length) { errors.forEach((m) => toast.error(m)); return }

    try {
      const body = {
        projectId: routeProjectId !== 'create' ? routeProjectId : undefined,
        title, content, description, slug, platforms, technologies, keywords, status, image, projectLinks,
      }
      if (mode === 'create') {
        const res = await axiosInstance.post('/api/projects', body)
        toast.success('Project created successfully')
        clearAutoSave()
        router.push('/admin/projects/' + res.data.project.projectId)
      } else {
        await axiosInstance.put('/api/projects/', body)
        toast.success('Project updated successfully')
        clearAutoSave()
        router.push('/admin/projects')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Save failed')
    }
  }

  const saveLabel = loading ? 'Loading...' : saving ? 'Saving...' : tr.isEN ? (mode === 'create' ? 'Create Project' : 'Update Project') : 'Save Translation'

  return (
    <Form
      className="mx-auto mb-8 bg-base-300 p-6 rounded-lg shadow max-w-7xl"
      actions={[
        { label: saveLabel, onClick: handleSubmit, className: 'btn-primary', disabled: loading || saving, loading: saving },
        { label: 'Cancel', onClick: () => router.push('/admin/projects'), className: 'btn-secondary' },
      ]}
    >
      <FormHeader
        title={mode === 'create' ? 'Create Project' : title || 'Edit Project'}
        className="my-4"
        actionButtons={[
          { text: 'Clear Draft', className: 'btn-sm btn-error btn-outline', onClick: handleClearDraft },
          { text: 'Back to Projects', className: 'btn-sm btn-primary', onClick: () => router.push('/admin/projects') },
        ]}
      />

      <TranslationSection
        mode={mode}
        translation={tr}
        fields={PROJECT_TRANSLATION_FIELDS}
        entityLabel="project"
        enSourceForm={{ title, description, slug, content }}
      />

      <div className="flex flex-col gap-1">
        <DynamicText label="Title" placeholder="Title" value={titleField.value} setValue={titleField.set} size="md" />
        <ContentScoreBar value={titleField.value} rules={TITLE_SCORE_RULES} label="SEO Başlık" />
      </div>

      {tr.isEN && (
        <DynamicSelect
          label="Status"
          selectedValue={status}
          onValueChange={setStatus}
          options={[
            { value: 'DRAFT', label: 'Draft' },
            { value: 'PUBLISHED', label: 'Published' },
            { value: 'ARCHIVED', label: 'Archived' },
          ]}
        />
      )}

      <div className="flex flex-col gap-1">
        <GenericElement label="Content">
          <Editor value={contentField.value} onChange={contentField.set} />
        </GenericElement>
        <ContentScoreBar value={contentField.value} rules={CONTENT_SCORE_RULES} label="İçerik Kalitesi" />
      </div>

      <div className="flex flex-col gap-1">
        <DynamicText label="Description" placeholder="Description" value={descriptionField.value} setValue={descriptionField.set} size="md" isTextarea />
        <ContentScoreBar value={descriptionField.value} rules={DESCRIPTION_SCORE_RULES} label="Meta Description" />
      </div>
      <div className="flex flex-col gap-1">
        <DynamicText label="Slug" placeholder="Slug" value={slugField.value} setValue={slugField.set} size="md" />
        <ContentScoreBar value={slugField.value} rules={SLUG_SCORE_RULES} label="URL / Slug" />
      </div>

      {tr.isEN && (
        <>
          <CheckboxGroup label="Platforms" options={ALLOWED_PLATFORMS} selected={platforms} onChange={setPlatforms} />
          <CheckboxGroup label="Technologies" options={ALLOWED_TECHNOLOGIES} selected={technologies} onChange={setTechnologies} />

          <div className="flex flex-col gap-1">
            <DynamicText
              label="Keywords"
              placeholder="Keywords (comma separated)"
              value={keywords.join(',')}
              setValue={(v) => setKeywords(v.split(',').map((s) => s.trim()).filter(Boolean))}
              size="md"
            />
            <ContentScoreBar value={keywords.join(',')} rules={KEYWORDS_SCORE_RULES} label="Anahtar Kelimeler" />
          </div>

          <GenericElement label="Project Links">
            <TableProvider<{ id: number; link: string }>
              localData={projectLinks.map((link, i) => ({ id: i, link }))}
              idKey="id"
              columns={[{
                key: 'link',
                header: 'Link',
                accessor: (item) => (
                  <input
                    type="text"
                    placeholder="Project Link"
                    className="input input-bordered w-full"
                    value={item.link}
                    onChange={(e) => {
                      const newLinks = [...projectLinks]
                      newLinks[item.id] = e.target.value
                      setProjectLinks(newLinks)
                    }}
                  />
                ),
              }]}
              actions={[{
                label: <FontAwesomeIcon icon={faTrash} size="sm" />,
                onClick: (item) => setProjectLinks(projectLinks.filter((_, i) => i !== item.id)),
                className: 'btn-error',
                tooltip: 'Delete',
              }]}
            >
              <TableHeader
                className="p-2 -mb-8 rounded-t-lg"
                title=""
                titleTextClassName="hidden"
                searchClassName="hidden"
                buttons={[{
                  label: <FontAwesomeIcon icon={faPlus} />,
                  onClick: () => setProjectLinks([...projectLinks, '']),
                  className: 'btn-ghost btn-sm',
                }]}
              />
              <TableBody emptyText="No links added yet." />
            </TableProvider>
          </GenericElement>

          <GenericElement label="Image">
            <ImageLoad image={image} setImage={setImage} uploadFolder="projects" toast={toast} width={1200} height={627} />
          </GenericElement>

          <GenericElement label="Created At">
            <DynamicDate value={createdAt} onChange={setCreatedAt} />
          </GenericElement>
          <GenericElement label="Updated At">
            <DynamicDate value={updatedAt} onChange={setUpdatedAt} />
          </GenericElement>

          {mode === 'edit' && (
            <GenericElement label="Related Posts"
            >
              <TableProvider<PostWithData>
                key={`related-posts-${relatedTableKey}`}
                apiEndpoint={`/api/projects/${routeProjectId}/posts`}
                dataKey="posts"
                idKey="postId"
                columns={relatedPostColumns}
                ignoreSearchParams
              >
                <TableHeader
                  className="p-2 -mb-8 rounded-t-lg"
                  title=""
                  titleTextClassName="hidden"
                  searchClassName="hidden"
                  showRefresh
                  buttons={[{
                    label: <FontAwesomeIcon icon={faPlus} />,
                    onClick: () => setAttachModalOpen(true),
                    className: 'btn-ghost btn-sm',
                  }]}
                />
                <TableBody emptyText="No posts linked to this project yet." />
              </TableProvider>
              <HeadlessModal
                open={attachModalOpen}
                onClose={() => setAttachModalOpen(false)}
                title="Attach Post"
                size="md"
              >
                <DynamicSelect
                  key={`post-picker-${postPickerKey}`}
                  label="Post"
                  endpoint="/api/posts" dataKey="posts" valueKey="postId" labelKey="title"
                  searchKey="search" selectedValue=""
                  onValueChange={(v) => v && handleAttachPost(v)}
                  placeholder="Bağlanacak postu seç..." searchPlaceholder="Post ara..." debounceMs={400}
                  portal
                />
              </HeadlessModal>
            </GenericElement>
          )}

        </>
      )}
    </Form>
  )
}

export default SingleProject
