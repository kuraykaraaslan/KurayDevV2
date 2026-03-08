'use client'
import Table, {
  TableProvider,
  TableHeader,
  TableBody,
  TableFooter,
  ColumnDef,
  ActionButton,
} from '@/components/admin/UI/Forms/DynamicTable'
import { Campaign } from '@/types/common/CampaignTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'

const statusBadge = (status: Campaign['status']) => {
  const map: Record<Campaign['status'], string> = {
    DRAFT: 'badge-warning',
    SENDING: 'badge-info',
    SENT: 'badge-success',
  }
  return <span className={`badge badge-sm ${map[status]}`}>{status}</span>
}

const CampaignsPage = () => {
  const { t } = useTranslation()

  const columns: ColumnDef<Campaign>[] = [
    { key: 'title', header: 'common.title', accessor: (item) => item.title },
    {
      key: 'subject',
      header: 'Subject',
      hideOnMobile: true,
      accessor: (item) => (
        <span className="text-sm text-base-content/70 max-w-xs line-clamp-1">{item.subject}</span>
      ),
    },
    {
      key: 'status',
      header: 'common.status',
      accessor: (item) => statusBadge(item.status),
    },
    {
      key: 'sentCount',
      header: 'Sent',
      hideOnMobile: true,
      accessor: (item) => item.sentCount,
    },
    {
      key: 'createdAt',
      header: 'Created',
      hideOnMobile: true,
      accessor: (item) => new Date(item.createdAt).toLocaleDateString(),
    },
  ]

  const actions: ActionButton<Campaign>[] = [
    {
      label: 'common.edit',
      href: (item) => `/admin/campaigns/${item.campaignId}`,
      className: 'btn-secondary',
      hidden: (item) => item.status !== 'DRAFT',
    },
    {
      label: 'common.view',
      href: (item) => `/admin/campaigns/${item.campaignId}`,
      className: 'btn-ghost btn-sm',
      hidden: (item) => item.status === 'DRAFT',
    },
    {
      label: 'common.delete',
      onClick: async (item) => {
        if (!confirm(t('common.confirm_delete'))) return
        await axiosInstance.delete(`/api/newsletter/campaigns/${item.campaignId}`)
      },
      className: 'btn-error',
      hideOnMobile: true,
      hidden: (item) => item.status !== 'DRAFT',
    },
  ]

  return (
    <TableProvider<Campaign>
      apiEndpoint="/api/newsletter/campaigns"
      dataKey="campaigns"
      idKey="campaignId"
      columns={columns}
      actions={actions}
    >
      <Table>
        <TableHeader
          title="admin.campaigns.title"
          searchPlaceholder="common.search_placeholder"
          buttons={[{ label: 'common.create', href: '/admin/campaigns/create' }]}
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

export default CampaignsPage
