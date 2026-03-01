'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import Form from '@/components/admin/UI/Forms/Form'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import DynamicText from '@/components/admin/UI/Forms/DynamicText'
import GenericElement from '@/components/admin/UI/Forms/GenericElement'
import ImageLoad from '@/components/common/UI/Images/ImageLoad'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faGripVertical,
    faTrash,
    faPlus,
    faArrowUp,
    faArrowDown,
} from '@fortawesome/free-solid-svg-icons'

interface SeriesPost {
    postId: string
    title: string
    slug: string
    status: string
    image: string | null
    category: { slug: string }
}

interface SeriesEntry {
    id: string
    order: number
    postId: string
    post: SeriesPost
}

interface PostSearchResult {
    postId: string
    title: string
    slug: string
    status: string
    category: { slug: string }
}

const SeriesEditPage = () => {
    const params   = useParams<{ seriesId: string }>()
    const router   = useRouter()
    const seriesId = params?.seriesId
    const mode     = seriesId === 'create' ? 'create' : 'edit'

    const [loading,  setLoading]  = useState(true)
    const [saving,   setSaving]   = useState(false)
    const [title,    setTitle]    = useState('')
    const [slug,     setSlug]     = useState('')
    const [desc,     setDesc]     = useState('')
    const [image,    setImage]    = useState('')
    const [entries,  setEntries]  = useState<SeriesEntry[]>([])
    const [search,   setSearch]   = useState('')
    const [results,  setResults]  = useState<PostSearchResult[]>([])
    const [searching, setSearching] = useState(false)

    // ── Load existing series ──────────────────────────────
    useEffect(() => {
        if (mode === 'create') { setLoading(false); return }
        axiosInstance
            .get(`/api/post-series/${seriesId}`)
            .then((res) => {
                const s = res.data.series
                setTitle(s.title ?? '')
                setSlug(s.slug ?? '')
                setDesc(s.description ?? '')
                setImage(s.image ?? '')
                setEntries(s.entries ?? [])
            })
            .catch((e) => toast.error(e?.response?.data?.message ?? 'Failed to load series'))
            .finally(() => setLoading(false))
    }, [seriesId, mode])

    // ── Auto-slugify title ────────────────────────────────
    useEffect(() => {
        if (mode !== 'create' || !title) return
        setSlug(
            title.toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-')
                .replace(/--+/g, '-')
        )
    }, [title, mode])

    // ── Search posts to add ───────────────────────────────
    const searchPosts = useCallback(async (q: string) => {
        if (!q.trim()) { setResults([]); return }
        setSearching(true)
        try {
            const res = await axiosInstance.get('/api/posts', {
                params: { search: q, pageSize: 8, status: 'ALL' },
            })
            const existingIds = new Set(entries.map((e) => e.postId))
            setResults((res.data.posts ?? []).filter((p: PostSearchResult) => !existingIds.has(p.postId)))
        } catch {
            /* ignore */
        } finally {
            setSearching(false)
        }
    }, [entries])

    useEffect(() => {
        const t = setTimeout(() => searchPosts(search), 350)
        return () => clearTimeout(t)
    }, [search, searchPosts])

    // ── Add post ──────────────────────────────────────────
    const addPost = async (post: PostSearchResult) => {
        if (mode === 'create') {
            // Buffer locally — will be saved after series creation
            const fakeEntry: SeriesEntry = {
                id: `_new_${post.postId}`,
                order: entries.length,
                postId: post.postId,
                post: { ...post, image: null },
            }
            setEntries((prev) => [...prev, fakeEntry])
            setSearch('')
            setResults([])
            return
        }
        try {
            const res = await axiosInstance.post(`/api/post-series/${seriesId}/entries`, {
                postId: post.postId,
                order:  entries.length,
            })
            setEntries((prev) => [...prev, res.data.entry])
            setSearch('')
            setResults([])
            toast.success('Post added to series')
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? 'Failed to add post')
        }
    }

    // ── Remove post ───────────────────────────────────────
    const removePost = async (entry: SeriesEntry) => {
        if (entry.id.startsWith('_new_')) {
            setEntries((prev) => prev.filter((e) => e.id !== entry.id))
            return
        }
        try {
            await axiosInstance.delete(`/api/post-series/${seriesId}/entries/${entry.postId}`)
            setEntries((prev) => prev.filter((e) => e.id !== entry.id))
            toast.success('Post removed')
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? 'Failed to remove post')
        }
    }

    // ── Move up / down ────────────────────────────────────
    const move = async (index: number, direction: -1 | 1) => {
        const next = index + direction
        if (next < 0 || next >= entries.length) return
        const reordered = [...entries]
        ;[reordered[index], reordered[next]] = [reordered[next], reordered[index]]
        const withOrder = reordered.map((e, i) => ({ ...e, order: i }))
        setEntries(withOrder)

        // Persist immediately in edit mode
        if (mode === 'edit') {
            try {
                await axiosInstance.put(`/api/post-series/${seriesId}/entries`, {
                    entries: withOrder.map((e) => ({ postId: e.postId, order: e.order })),
                })
            } catch {
                toast.error('Failed to save order')
            }
        }
    }

    // ── Save series ───────────────────────────────────────
    const handleSubmit = async () => {
        if (!title.trim() || !slug.trim()) {
            toast.error('Title and slug are required')
            return
        }
        setSaving(true)
        try {
            if (mode === 'create') {
                const res = await axiosInstance.post('/api/post-series', {
                    title, slug,
                    description: desc || null,
                    image: image || null,
                })
                const newId = res.data.series.id
                // Add buffered posts
                for (const e of entries) {
                    await axiosInstance.post(`/api/post-series/${newId}/entries`, {
                        postId: e.postId, order: e.order,
                    })
                }
                toast.success('Series created')
                router.push('/admin/series')
            } else {
                await axiosInstance.put(`/api/post-series/${seriesId}`, {
                    title, slug,
                    description: desc || null,
                    image: image || null,
                })
                toast.success('Series saved')
                router.push('/admin/series')
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? 'Save failed')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Form
            className="mx-auto mb-8 bg-base-300 p-6 rounded-lg shadow max-w-4xl"
            actions={[
                { label: saving ? 'Saving…' : 'Save', onClick: handleSubmit, className: 'btn-primary', disabled: saving || loading, loading: saving },
                { label: 'Cancel', onClick: () => router.push('/admin/series'), className: 'btn-secondary' },
            ]}
        >
            <FormHeader
                title={mode === 'create' ? 'Create Series' : 'Edit Series'}
                className="my-4"
                actionButtons={[
                    { text: 'Back to Series', className: 'btn-sm btn-primary', onClick: () => router.push('/admin/series') },
                ]}
            />

            <DynamicText label="Title"       placeholder="Series title"  value={title} setValue={setTitle} size="md" />
            <DynamicText label="Slug"        placeholder="series-slug"   value={slug}  setValue={setSlug}  size="md" />
            <DynamicText label="Description" placeholder="Optional description" value={desc} setValue={setDesc} size="md" isTextarea />

            <GenericElement label="Cover Image">
                <ImageLoad image={image} setImage={setImage} uploadFolder="series" toast={toast} />
            </GenericElement>

            {/* ── Posts in this series ── */}
            <GenericElement label="Posts in this series">
                <div className="flex flex-col gap-2">
                    {entries.length === 0 && (
                        <p className="text-base-content/40 text-sm italic">No posts yet. Search below to add.</p>
                    )}
                    {entries.map((entry, i) => (
                        <div
                            key={entry.id}
                            className="flex items-center gap-2 bg-base-200 rounded-lg px-3 py-2"
                        >
                            <FontAwesomeIcon icon={faGripVertical} className="text-base-content/30 cursor-grab" />
                            <span className="text-base-content/40 text-xs w-6 text-center">{i + 1}</span>
                            <span className="flex-1 text-sm font-medium truncate">{entry.post.title}</span>
                            <span className={`badge badge-xs ${entry.post.status === 'PUBLISHED' ? 'badge-success' : entry.post.status === 'SCHEDULED' ? 'badge-warning' : 'badge-neutral'}`}>
                                {entry.post.status}
                            </span>
                            <button className="btn btn-ghost btn-xs" onClick={() => move(i, -1)} disabled={i === 0}>
                                <FontAwesomeIcon icon={faArrowUp} />
                            </button>
                            <button className="btn btn-ghost btn-xs" onClick={() => move(i, 1)} disabled={i === entries.length - 1}>
                                <FontAwesomeIcon icon={faArrowDown} />
                            </button>
                            <button className="btn btn-ghost btn-xs text-error" onClick={() => removePost(entry)}>
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    ))}
                </div>
            </GenericElement>

            {/* ── Add post search ── */}
            <GenericElement label="Add a post">
                <div className="relative">
                    <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Search by title…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {(results.length > 0 || searching) && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-base-200 rounded-lg shadow-lg border border-base-300 overflow-hidden">
                            {searching && (
                                <div className="p-3 text-sm text-base-content/50">Searching…</div>
                            )}
                            {results.map((p) => (
                                <button
                                    key={p.postId}
                                    type="button"
                                    className="w-full text-left px-4 py-2 hover:bg-base-300 text-sm flex items-center justify-between gap-2"
                                    onClick={() => addPost(p)}
                                >
                                    <span className="font-medium truncate">{p.title}</span>
                                    <span className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-base-content/40">{p.category.slug}</span>
                                        <FontAwesomeIcon icon={faPlus} className="text-primary" />
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </GenericElement>
        </Form>
    )
}

export default SeriesEditPage
