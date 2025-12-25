'use client'
import Table, {
    TableProvider,
    TableHeader,
    TableBody,
    TableFooter,
    ImageCell,
    ColumnDef,
    ActionButton
} from '@/components/admin/UI/DynamicTable';
import { SafeUser } from '@/types/user/UserTypes';
import axiosInstance from '@/libs/axios';
import { useTranslation } from 'react-i18next';

const UserPage = () => {
    const { t } = useTranslation();

    const columns: ColumnDef<SafeUser>[] = [
        { key: 'image', header: 'Image', className: 'w-16', accessor: (u) => <ImageCell src={u.userProfile?.avatar} alt={u.name || u.email} /> },
        { key: 'name', header: 'admin.users.name', accessor: (u) => u.name || '-' },
        { key: 'email', header: 'admin.users.email', accessor: (u) => u.email },
        { key: 'role', header: 'admin.users.role', accessor: (u) => u.userRole },
        { key: 'status', header: 'admin.users.status', accessor: (u) => u.userStatus },
    ];

    const actions: ActionButton<SafeUser>[] = [
        { label: 'admin.users.edit', href: (u) => `/admin/users/${u.userId}`, className: 'btn-primary' },
        { 
            label: 'admin.users.delete', 
            onClick: async (u) => {
                if (!confirm(t('admin.users.confirm_delete'))) return;
                await axiosInstance.delete(`/api/users/${u.userId}`);
            },
            className: 'text-danger',
            hideOnMobile: true,
        },
    ];

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
                    searchPlaceholder="admin.users.search_placeholder"
                    buttonText="admin.users.create_user"
                    buttonLink="/admin/users/create"
                />
                <TableBody />
                <TableFooter
                    showingText="admin.users.showing"
                    previousText="admin.users.previous"
                    nextText="admin.users.next"
                />
            </Table>
        </TableProvider>
    );
}

export default UserPage;