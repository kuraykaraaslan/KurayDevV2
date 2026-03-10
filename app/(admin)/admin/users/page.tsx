'use client'
import Table, {
  TableProvider,
  TableHeader,
  TableBody,
  TableFooter,
  ImageCell,
  ColumnDef,
  ActionButton,
} from '@/components/admin/UI/Forms/DynamicTable'
import { SafeUser } from '@/types/user/UserTypes'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons'

const UserPage = () => {
  const { t } = useTranslation()

  const columns: ColumnDef<SafeUser>[] = [
    {
      key: 'image',
      header: 'common.image.title',
      className: 'w-16',
      accessor: (u) => <ImageCell src={u.userProfile?.profilePicture} alt={u.name || u.email} />,
    },
    { key: 'name', header: 'common.name', accessor: (u) => u.userProfile.name || '-' },
    { key: 'email', header: 'common.email', accessor: (u) => u.email },
    { key: 'role', header: 'common.role', accessor: (u) => u.userRole },
    { key: 'status', header: 'common.status', accessor: (u) => u.userStatus },
  ]

  const actions: ActionButton<SafeUser>[] = [
    {
      label: <FontAwesomeIcon icon={faPencil} size="sm" />,
      href: (u) => `/admin/users/${u.userId}`,
      className: 'btn-primary',
      tooltip: t('common.edit'),
    },
    {
      label: <FontAwesomeIcon icon={faTrash} size="sm" />,
      onClick: async (u) => {
        if (!confirm(t('common.confirm_delete'))) return
        await axiosInstance.delete(`/api/users/${u.userId}`)
      },
      className: 'btn-error',
      hideOnMobile: true,
      tooltip: t('common.delete'),
    },
  ]

  return (
    <TableProvider<SafeUser>
      apiEndpoint="/api/users"
      dataKey="users"
      idKey="userId"
      columns={columns}
      actions={actions}
    >
      <Table>
        <TableHeader
          title="admin.users.title"
          searchPlaceholder="common.search_placeholder"
          buttons={[{ label: 'common.create', href: '/admin/users/create' }]}
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

export default UserPage
