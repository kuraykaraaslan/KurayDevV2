'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axiosInstance from '@/libs/axios';
import { SafeUser, SafeUserSchema } from '@/types/user';
import { toast } from 'react-toastify';
import { useTranslation } from "react-i18next";
import TableHeader from './TableHeader';

const UserTable = () => {
    const { t } = useTranslation();

    const [users, setUsers] = useState<SafeUser[]>([]);
    const [page, setPage] = useState(0);
    const [pageSize, _setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const [search, setSearch] = useState('');

    useEffect(() => {

        axiosInstance.get(`/api/users?page=${page + 1}&pageSize=${pageSize}&search=${search}`)
            .then((response) => {
                setUsers(response.data.users);
                setTotal(response.data.total);
            })
            .catch(() => {
            });
    }
        , [page, pageSize, search]);


    const deleteUser = async (userId: string) => {
        //confirm
        if (!confirm(t('admin.users.confirm_delete'))) {
            return;
        }
        //delete
        await axiosInstance.delete(`/api/users/${userId}`).then((response) => {
            toast.success(response.data.message || t('admin.users.delete_success'));
            setUsers(users.filter(user => user.userId !== userId));
        }).catch((error) => {
            toast.error(error.response.data.message || t('admin.users.delete_failed'));
        }
        );

    }


    return (
        <div className="container mx-auto">
            <TableHeader
                title="admin.users.title"
                searchPlaceholder="admin.users.search_placeholder"
                search={search}
                setSearch={setSearch}
                buttonText="admin.users.create_user"
                buttonLink="/admin/users/create"
            />

            <div className="overflow-x-auto w-full bg-base-200 mt-4 rounded-lg min-h-[400px]">
                <table className="table">
                    {/* head */}
                    <thead className="bg-base-300 h-12">
                        <tr className="h-12">
                            <th>Image</th>
                            <th>{t('admin.users.name')}</th>
                            <th>{t('admin.users.email')}</th>
                            <th>{t('admin.users.role')}</th>
                            <th>{t('admin.users.status')}</th>
                            <th>{t('admin.users.action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr key={index} className="h-12 hover:bg-primary hover:bg-opacity-10">
                                <td>
                                    {user.userProfile.profilePicture ?
                                        <Image width={32} height={32} src={user.userProfile!.profilePicture} className="h-8 w-8 rounded-full" alt={user.userProfile.name as string} />
                                        :
                                        <div className="h-8 w-8 bg-base-300 rounded-full"></div>
                                    }
                                </td>
                                <td>{user.userProfile?.name}</td>
                                <td>{user.email}</td>
                                <td>{user.userRole}</td>
                                <td>{user.userStatus}</td>
                                <td className="flex gap-2">
                                    <Link href={`/admin/users/${user.userId}`} className="btn btn-sm btn-primary">{t('admin.users.edit')}</Link>
                                    <button onClick={() => deleteUser(user.userId as string)} className="btn btn-sm btn-warning hidden md:flex">{t('admin.users.delete')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <div>
                    <span>{t('admin.users.showing', { count: users.length, total: total })}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setPage(page - 1)} disabled={page === 0} className="btn btn-sm btn-secondary h-12">{t('admin.users.previous')}</button>
                    <button onClick={() => setPage(page + 1)} disabled={(page + 1) * pageSize >= total} className="btn btn-sm btn-secondary h-12">{t('admin.users.next')}</button>
                </div>
            </div>
        </div>
    );
};

export default UserTable;