'use client'
import Table, {
  TableProvider,
  TableHeader,
  TableBody,
  TableFooter,
  ColumnDef,
  ActionButton,
} from '@/components/admin/UI/Forms/DynamicTable'
import { ShortLink } from '@/types/content/ShortLinkTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import CopyButton from '@/components/admin/UI/CopyButton'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons'

const APP_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST || ''

const ShortLinksPage = () => {
  const { t } = useTranslation()

  const columns: ColumnDef<ShortLink>[] = [
    {
      key: 'code',
      header: 'Code',
      className: 'w-40 font-mono',
      accessor: (item) => (
        <div className="flex items-center gap-1">
          <a
            href={`/s/${item.code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-mono"
          >
            /s/{item.code}
          </a>
          <CopyButton text={`${APP_HOST}/s/${item.code}`} size="xs" />
        </div>
      ),
    },
    {
      key: 'originalUrl',
      header: 'Original URL',
      accessor: (item) => (
        <span className="truncate max-w-xs block text-sm text-base-content/70">
          {item.originalUrl}
        </span>
      ),
    },
    {
      key: 'clicks',
      header: 'Clicks',
      className: 'w-20 text-center',
      accessor: (item) => (
        <span className="badge badge-neutral">{item.clicks}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      hideOnMobile: true,
      accessor: (item) =>
        new Date(item.createdAt).toLocaleDateString(),
    },
  ]

  const actions: ActionButton<ShortLink>[] = [
    {
      label: <FontAwesomeIcon icon={faChartBar} size="sm" />,
      href: (item) => `/admin/short-links/${item.id}/analytics`,
      className: 'btn-info',
      tooltip: 'Analytics',
    },
    {
      label: <FontAwesomeIcon icon={faPencil} size="sm" />,
      href: (item) => `/admin/short-links/${item.id}`,
      className: 'btn-secondary',
      tooltip: t('common.edit'),
    },
    {
      label: <FontAwesomeIcon icon={faTrash} size="sm" />,
      onClick: async (item) => {
        if (!confirm(t('common.confirm_delete'))) return
        await axiosInstance.delete(`/api/links/${item.id}`)
      },
      className: 'btn-error',
      hideOnMobile: true,
      tooltip: t('common.delete'),
    },
  ]

  return (
    <TableProvider<ShortLink>
      apiEndpoint="/api/links"
      dataKey="links"
      idKey="id"
      columns={columns}
      actions={actions}
    >
      <Table>
        <TableHeader
          title="admin.short_links.title"
          searchPlaceholder="common.search_placeholder"
          buttons={[{ label: 'common.create', href: '/admin/short-links/create' }]}
          showExport
        />
        <TableBody />
        <TableFooter
          showingText="common.showing"
          previousText="common.previous"
          nextText="common.next"
        />
      </Table>
    </TableProvider>
  )
}

export default ShortLinksPage
