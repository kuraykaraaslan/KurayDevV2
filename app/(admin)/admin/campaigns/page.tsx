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
    { key: 'title', header: 'Title', accessor: (item) => item.title },
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
      header: 'Status',
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
      label: 'Edit',
      href: (item) => `/admin/campaigns/${item.campaignId}`,
      className: 'btn-secondary',
      hidden: (item) => item.status !== 'DRAFT',
    },
    {
      label: 'View',
      href: (item) => `/admin/campaigns/${item.campaignId}`,
      className: 'btn-ghost btn-sm',
      hidden: (item) => item.status === 'DRAFT',
    },
    {
      label: 'Delete',
      onClick: async (item) => {
        if (!confirm(t('Are you sure you want to delete this campaign?'))) return
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
          title="Campaigns"
          searchPlaceholder="Search campaigns..."
          buttonText="New Campaign"
          buttonLink="/admin/campaigns/create"
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

export default CampaignsPage
