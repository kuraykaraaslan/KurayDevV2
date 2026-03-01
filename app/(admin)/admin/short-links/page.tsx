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

const ShortLinksPage = () => {
  const { t } = useTranslation()

  const columns: ColumnDef<ShortLink>[] = [
    {
      key: 'code',
      header: 'Code',
      className: 'w-28 font-mono',
      accessor: (item) => (
        <a
          href={`/s/${item.code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-mono"
        >
          /s/{item.code}
        </a>
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
      label: 'Edit',
      href: (item) => `/admin/short-links/${item.id}`,
      className: 'btn-secondary',
    },
    {
      label: 'Delete',
      onClick: async (item) => {
        if (!confirm(t('Are you sure you want to delete this short link?'))) return
        await axiosInstance.delete(`/api/links/${item.id}`)
      },
      className: 'btn-error',
      hideOnMobile: true,
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
          title="Short Links"
          searchPlaceholder="Search short links..."
          buttonText="Add Short Link"
          buttonLink="/admin/short-links/create"
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

export default ShortLinksPage
