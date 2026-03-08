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
      label: 'common.edit',
      href: (u) => `/admin/users/${u.userId}`,
      className: 'btn-primary',
    },
    {
      label: 'common.delete',
      onClick: async (u) => {
        if (!confirm(t('common.confirm_delete'))) return
        await axiosInstance.delete(`/api/users/${u.userId}`)
      },
      className: 'text-danger',
      hideOnMobile: true,
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
