'use client'
import Table, {
  TableProvider,
  TableHeader,
  TableBody,
  TableFooter,
  ColumnDef,
  ActionButton,
} from '@/components/admin/UI/Forms/DynamicTable'
import { Subscription } from '@/types/common/SubscriptionTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const SubscriptionsPage = () => {
  const { t } = useTranslation()

  const columns: ColumnDef<Subscription>[] = [
    {
      key: 'email',
      header: 'admin.subscriptions.email',
      accessor: (s) => s.email,
    },
    {
      key: 'createdAt',
      header: 'admin.subscriptions.subscribed_at',
      accessor: (s) => (
        <span className="text-sm text-base-content/70">
          {s.createdAt ? formatDate(s.createdAt) : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'admin.subscriptions.status',
      accessor: (s) => (
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            s.deletedAt ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
          }`}
        >
          {s.deletedAt ? t('admin.subscriptions.unsubscribed') : t('admin.subscriptions.active')}
        </span>
      ),
    },
  ]

  const actions: ActionButton<Subscription>[] = [
    {
      label: 'admin.subscriptions.send_email',
      onClick: (s) => {
        window.location.href = `mailto:${s.email}`
      },
      className: 'btn-info',
    },
    {
      label: 'admin.subscriptions.unsubscribe',
      onClick: async (s) => {
        if (!confirm(t('admin.subscriptions.confirm_unsubscribe'))) return
        await axiosInstance.delete(`/api/contact/subscription/${encodeURIComponent(s.email)}`)
      },
      className: 'btn-warning',
      hideOnMobile: true,
    },
  ]

  return (
    <TableProvider<Subscription>
      apiEndpoint="/api/contact/subscription"
      dataKey="subscriptions"
      idKey="email"
      columns={columns}
      actions={actions}
      additionalParams={{ sort: 'desc' }}
    >
      <Table>
        <TableHeader
          title="admin.subscriptions.title"
          searchPlaceholder="admin.subscriptions.search_placeholder"
        />
        <TableBody />
        <TableFooter
          showingText="admin.subscriptions.showing"
          previousText="admin.subscriptions.previous"
          nextText="admin.subscriptions.next"
        />
      </Table>
    </TableProvider>
  )
}

export default SubscriptionsPage
