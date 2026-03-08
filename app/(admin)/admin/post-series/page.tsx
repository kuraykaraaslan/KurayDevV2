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
import { useTranslation } from 'react-i18next'
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
    const { t } = useTranslation()
    const columns: ColumnDef<SeriesRow>[] = [
        { key: 'title',       header: t('admin.post_series.col_title'),       accessor: (s) => s.title,       },
        { key: 'slug',        header: t('admin.post_series.col_slug'),        accessor: (s) => s.slug,        hideOnMobile: true },
        { key: 'description', header: t('admin.post_series.col_description'), accessor: (s) => s.description ?? '—', hideOnMobile: true },
        {
            key: 'posts',
            header: t('admin.post_series.col_posts'),
            accessor: (s) => {
                const count = s._count?.entries ?? s.entries?.length ?? 0
                return <span className="badge badge-neutral">{count}</span>
            },
        },
    ]

    const actions: ActionButton<SeriesRow>[] = [
        { label: t('common.edit'),   href: (s) => `/admin/post-series/${s.id}`, className: 'btn-primary' },
        {
            label: t('common.delete'),
            onClick: async (s) => {
                if (!confirm(`${t('admin.post_series.delete_confirm')} "${s.title}"?`)) return
                try {
                    await axiosInstance.delete(`/api/post-series/${s.id}`)
                    toast.success(t('admin.post_series.deleted_success'))
                } catch (e: any) {
                    toast.error(e?.response?.data?.message ?? t('admin.post_series.delete_failed'))
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
                    title={t('admin.post_series.title')}
                    searchPlaceholder={t('common.search_placeholder')}
                    buttons={[{ label: t('common.create'), href: '/admin/post-series/create' }]}
                    showRefresh
                    showExport
                />
                <TableBody />
                <TableFooter
                    showingText={t('common.showing')}
                    previousText={t('common.previous')}
                    nextText={t('common.next')}
                />
            </Table>
        </TableProvider>
    )
}

export default SeriesPage
