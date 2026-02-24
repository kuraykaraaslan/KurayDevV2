'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import ImageLoad from '@/components/common/UI/Images/ImageLoad'
import TinyMCEEditor from '@/components/admin/UI/Forms/Editor'
import { TableBody, TableHeader, TableProvider } from '@/components/admin/UI/Forms/DynamicTable'
import LanguageBar from '@/components/admin/Features/Translations/LanguageBar'
import AddLanguageModal, { TranslationFieldDef } from '@/components/admin/Features/Translations/AddLanguageModal'

const PROJECT_TRANSLATION_FIELDS: TranslationFieldDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'slug', label: 'Slug' },
  { key: 'content', label: 'Content', isRichText: true },
]

const allowedPlatforms = [
  'ui/ux', 'web', 'mobile', 'desktop', 'embedded', 'other', 'iot', 'gaming', 'machine learning',
]

const allowedTechnologies = [
  'react', 'react native', 'express', 'next', 'java', 'python', 'c', 'c++', 'c#',
  'aws', 'azure', 'gcp', 'chrome extension', 'other',
]

const SingleProject = () => {
  const localStorageKey = 'projectCaches'

  const params = useParams()
  const routeProjectId = params.projectId as string
  const router = useRouter()

  const mode = routeProjectId === 'create' ? 'create' : 'edit'
  const [loading, setLoading] = useState(true)

  const [title, setTitle] = useState('')
  const [image, setImage] = useState('')
  const [content, setContent] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [technologies, setTechnologies] = useState<string[]>([])
  const [status, setStatus] = useState('PUBLISHED')
  const [projectLinks, setProjectLinks] = useState<string[]>([])

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
  const currentContent = isEN ? content : (translationForms[activeLang]?.content ?? '')

  const clearAutoSave = () => {
    try {
      const caches = localStorage.getItem(localStorageKey)
      if (caches) {
        const parsed = JSON.parse(caches)
        delete parsed[routeProjectId]
        localStorage.setItem(localStorageKey, JSON.stringify(parsed))
      }
    } catch {}
  }

  // Auto Slugify (create mode only)
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

  // Load project + translations (edit mode)
  useEffect(() => {
    if (routeProjectId === 'create') {
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        const [projectRes, translationsRes] = await Promise.all([
          axiosInstance.get('/api/projects', { params: { projectId: routeProjectId } }),
          axiosInstance.get(`/api/projects/${routeProjectId}/translations`),
        ])

        if (cancelled) return

        const project = projectRes.data?.projects?.[0]
        if (!project) {
          toast.error('Project not found')
          return
        }

        setTitle(project.title ?? '')
        setContent(project.content ?? '')
        setDescription(project.description ?? '')
        setSlug(project.slug ?? '')
        setPlatforms(Array.isArray(project.platforms) ? project.platforms : [])
        setTechnologies(Array.isArray(project.technologies) ? project.technologies : [])
        setStatus(project.status ?? 'PUBLISHED')
        setImage(project.image ?? '')
        setProjectLinks(Array.isArray(project.projectLinks) ? project.projectLinks : [])

        const translations: Array<{ lang: string; title: string; description?: string; slug?: string; content?: string }> =
          translationsRes.data?.translations ?? []

        const forms: Record<string, Record<string, string>> = {}
        const langs: string[] = []

        for (const t of translations) {
          forms[t.lang] = {
            title: t.title ?? '',
            description: t.description ?? '',
            slug: t.slug ?? '',
            content: t.content ?? '',
          }
          langs.push(t.lang)
        }

        setTranslationForms(forms)
        setAddedLangs(langs)
        setSavedLangs(langs)
      } catch (error: any) {
        console.error(error)
        toast.error(error?.response?.data?.message ?? 'Failed to load project')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [routeProjectId])

  // Auto Save Draft
  useEffect(() => {
    if (loading) return

    const draft = { title, content, description, slug, platforms, technologies, status, image, projectLinks }

    try {
      const caches = localStorage.getItem(localStorageKey)
      let parsedCaches: Record<string, any> = {}
      try {
        parsedCaches = caches ? JSON.parse(caches) : {}
      } catch { parsedCaches = {} }

      parsedCaches[routeProjectId] = draft
      localStorage.setItem(localStorageKey, JSON.stringify(parsedCaches))
    } catch (err) {
      console.error('Draft autosave error:', err)
    }
  }, [title, content, description, slug, platforms, technologies, status, image, projectLinks, loading, routeProjectId])

  // Load Draft
  useEffect(() => {
    try {
      const caches = localStorage.getItem(localStorageKey)
      if (!caches) return

      const parsed = JSON.parse(caches)
      const draft = parsed[routeProjectId]
      if (!draft) return

      setTitle(draft.title || '')
      setContent(draft.content || '')
      setDescription(draft.description || '')
      setSlug(draft.slug || '')
      setPlatforms(draft.platforms || [])
      setTechnologies(draft.technologies || [])
      setStatus(draft.status || 'PUBLISHED')
      setImage(draft.image || '')
      setProjectLinks(draft.projectLinks || [])

      toast.info('Draft loaded from browser')
    } catch (err) {
      console.error('Failed to load draft', err)
    }
  }, [])

  const handleClearDraft = () => {
    clearAutoSave()
    setTitle('')
    setContent('')
    setDescription('')
    setSlug('')
    setPlatforms([])
    setTechnologies([])
    setStatus('PUBLISHED')
    setImage('')
    setProjectLinks([])
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
      await axiosInstance.delete(`/api/projects/${routeProjectId}/translations/${lang}`)
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
        await axiosInstance.post(`/api/projects/${routeProjectId}/translations`, {
          lang: activeLang,
          title: form.title,
          description: form.description,
          slug: form.slug,
          content: form.content,
        })
        setSavedLangs((prev) => (prev.includes(activeLang) ? prev : [...prev, activeLang]))
        toast.success('Translation saved')
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? 'Save failed')
      }
      return
    }

    const errors: string[] = []
    const required: Record<string, unknown> = { title, content, description, slug }

    for (const [key, val] of Object.entries(required)) {
      if (typeof val === 'string' && val.trim() === '') {
        errors.push(`${key} is required`)
      }
    }

    if (platforms.length === 0) errors.push('platforms is required')

    if (errors.length) {
      errors.forEach((msg) => toast.error(msg))
      return
    }

    const body = {
      projectId: routeProjectId !== 'create' ? routeProjectId : undefined,
      title,
      content,
      description,
      slug,
      platforms,
      technologies,
      status,
      image,
      projectLinks,
    }

    try {
      if (mode === 'create') {
        const res = await axiosInstance.post('/api/projects', body)
        const { project } = res.data
        toast.success('Project created successfully')
        clearAutoSave()
        router.push('/admin/projects/' + project.projectId)
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

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center flex-row">
        <h1 className="text-3xl font-bold h-16 items-center">
          {mode === 'create' ? 'Create Project' : title}
        </h1>
        <div className="flex gap-2 h-16">
          <button
            type="button"
            className="btn btn-error btn-outline btn-sm h-12"
            onClick={handleClearDraft}
          >
            Clear Draft
          </button>
          <Link className="btn btn-primary btn-sm h-12" href="/admin/projects">
            Back to Projects
          </Link>
        </div>
      </div>

      <div className="bg-base-200 p-6 rounded-lg shadow-md mt-4 gap-4 flex flex-col">
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
              sourceForms={{ en: { title, description, slug, content }, ...translationForms }}
              availableSourceLangs={['en', ...savedLangs]}
              fields={PROJECT_TRANSLATION_FIELDS}
              entityLabel="project"
              onConfirm={handleAddLangConfirm}
            />
          </>
        )}

        <div className="form-control flex flex-col">
          <label className="label">
            <span className="label-text">Title</span>
          </label>
          <input
            type="text"
            placeholder="Title"
            className="input input-bordered w-full"
            value={currentTitle}
            onChange={(e) => {
              const val = e.target.value
              if (isEN) setTitle(val)
              else setTranslationForms((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], title: val } }))
            }}
          />
        </div>

        {isEN && (
          <div className="form-control flex flex-col">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        )}

        <div className="form-control flex flex-col">
          <label className="label">
            <span className="label-text">Content</span>
          </label>
          <TinyMCEEditor
            value={currentContent}
            onChange={(val) => {
              if (isEN) setContent(val)
              else setTranslationForms((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], content: val } }))
            }}
          />
        </div>

        <div className="form-control flex flex-col">
          <label className="label">
            <span className="label-text">Description</span>
          </label>
          <textarea
            placeholder="Description"
            className="textarea textarea-bordered w-full"
            value={currentDescription}
            onChange={(e) => {
              const val = e.target.value
              if (isEN) setDescription(val)
              else setTranslationForms((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], description: val } }))
            }}
          />
        </div>

        <div className="form-control flex flex-col">
          <label className="label">
            <span className="label-text">Slug</span>
          </label>
          <input
            type="text"
            placeholder="Slug"
            className="input input-bordered w-full"
            value={currentSlug}
            onChange={(e) => {
              const val = e.target.value
              if (isEN) setSlug(val)
              else setTranslationForms((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], slug: val } }))
            }}
          />
        </div>

        {isEN && (
          <>
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text">Platforms</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {allowedPlatforms.map((platform) => (
                  <div key={platform} className="bg-base-100 p-2 rounded-lg">
                    <input
                      type="checkbox"
                      className="mr-2"
                      value={platform}
                      checked={platforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) setPlatforms([...platforms, platform])
                        else setPlatforms(platforms.filter((p) => p !== platform))
                      }}
                    />
                    <span className="mt-2">{platform}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text">Technologies</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {allowedTechnologies.map((technology) => (
                  <div key={technology} className="bg-base-100 p-2 rounded-lg">
                    <input
                      type="checkbox"
                      className="mr-2"
                      value={technology}
                      checked={technologies.includes(technology)}
                      onChange={(e) => {
                        if (e.target.checked) setTechnologies([...technologies, technology])
                        else setTechnologies(technologies.filter((t) => t !== technology))
                      }}
                    />
                    <span className="mt-2">{technology}</span>
                  </div>
                ))}
              </div>
            </div>

            <TableProvider<{ id: number; link: string }>
              localData={projectLinks.map((link, i) => ({ id: i, link }))}
              idKey="id"
              columns={[
                {
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
                },
              ]}
              actions={[
                {
                  label: 'Delete',
                  onClick: (item) => {
                    setProjectLinks(projectLinks.filter((_, i) => i !== item.id))
                  },
                  className: 'btn-error',
                  hideOnMobile: true,
                },
              ]}
            >
              <TableHeader
                className="p-2 -mb-8 rounded-t-lg"
                title="Project Links"
                actionButtonText="Add Link"
                actionButtonEvent={() => setProjectLinks([...projectLinks, ''])}
                titleTextClassName="text-sm font-normal"
                searchClassName="hidden"
              />
              <TableBody emptyText="No links added yet." />
            </TableProvider>

            <div className="form-control mb-4 mt-4">
              <label className="label">
                <span className="label-text">Image</span>
              </label>
              <ImageLoad image={image} setImage={setImage} uploadFolder="projects" toast={toast} />
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        className="btn btn-primary block w-full mt-4"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Loading...' : mode === 'create' ? 'Create Project' : isEN ? 'Update Project' : 'Save Translation'}
      </button>
    </div>
  )
}

export default SingleProject
