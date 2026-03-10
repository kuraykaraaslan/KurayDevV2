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
import { formatDateTime as formatDate } from '@/helpers/TimeHelper'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faUserMinus } from '@fortawesome/free-solid-svg-icons'

const SubscriptionsPage = () => {
  const { t } = useTranslation()

  const columns: ColumnDef<Subscription>[] = [
    {
      key: 'email',
      header: 'common.email',
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
      header: 'common.status',
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
      label: <FontAwesomeIcon icon={faEnvelope} size="sm" />,
      onClick: (s) => {
        window.location.href = `mailto:${s.email}`
      },
      className: 'btn-info',
      tooltip: t('admin.subscriptions.send_email'),
    },
    {
      label: <FontAwesomeIcon icon={faUserMinus} size="sm" />,
      onClick: async (s) => {
        if (!confirm(t('admin.subscriptions.confirm_unsubscribe'))) return
        await axiosInstance.delete(`/api/contact/subscription/${encodeURIComponent(s.email)}`)
      },
      className: 'btn-warning',
      hideOnMobile: true,
      tooltip: t('admin.subscriptions.unsubscribe'),
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
          searchPlaceholder="common.search_placeholder"
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

export default SubscriptionsPage
