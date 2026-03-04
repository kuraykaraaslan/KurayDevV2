'use client'
import {
    Table,
    TableProvider,
    TableHeader,
    TableBody,
    TableFooter,
    ColumnDef,
    ActionButton,
} from '@/components/admin/UI/Forms/DynamicTable'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'

interface SeriesRow {
    id: string
    title: string
    slug: string
    description: string | null
    _count?: { entries: number }
    entries?: { id: string }[]
    [key: string]: unknown
}

const SeriesPage = () => {
    const columns: ColumnDef<SeriesRow>[] = [
        { key: 'title',       header: 'Title',       accessor: (s) => s.title,       sortable: true },
        { key: 'slug',        header: 'Slug',        accessor: (s) => s.slug,        hideOnMobile: true },
        { key: 'description', header: 'Description', accessor: (s) => s.description ?? '—', hideOnMobile: true },
        {
            key: 'posts',
            header: 'Posts',
            accessor: (s) => {
                const count = s._count?.entries ?? s.entries?.length ?? 0
                return <span className="badge badge-neutral">{count}</span>
            },
        },
    ]

    const actions: ActionButton<SeriesRow>[] = [
        { label: 'Edit',   href: (s) => `/admin/post-series/${s.id}`, className: 'btn-primary' },
        {
            label: 'Delete',
            onClick: async (s) => {
                if (!confirm(`Delete series "${s.title}"? This will unlink all posts from it.`)) return
                try {
                    await axiosInstance.delete(`/api/post-series/${s.id}`)
                    toast.success('Series deleted')
                } catch (e: any) {
                    toast.error(e?.response?.data?.message ?? 'Delete failed')
                }
            },
            className: 'btn-error',
        },
    ]

    return (
        <TableProvider<SeriesRow>
            apiEndpoint="/api/post-series"
            dataKey="series"
            idKey="id"
            columns={columns}
            actions={actions}
        >
            <Table>
                <TableHeader
                    title="Post Series"
                    searchPlaceholder="Search series..."
                    buttons={[{ label: 'New Series', href: '/admin/post-series/create' }]}
                    showRefresh
                />
                <TableBody />
                <TableFooter
                    showingText="Showing"
                    previousText="Previous"
                    nextText="Next"
                />
            </Table>
        </TableProvider>
    )
}

export default SeriesPage
