import axiosInstance from '@/libs/axios';
import { User } from '@/types/user/UserTypes';
import { ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";

const UserSelect = ({ selectedUserId, setSelectedUserId }: { selectedUserId: string, setSelectedUserId: (userId: string) => void }) => {
    const { t } = useTranslation();

    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        axiosInstance.get('/api/users?pageSize=100').then((response) => {
            const { users } = response.data;
            setUsers(users);
        });
    }, []);

    function onChange(e: ChangeEvent<HTMLSelectElement>) {
        const selectedUser = users.find((user) => user.userId === e.target.value);
        if (selectedUser) {
            setSelectedUserId(selectedUser.userId);
        }
    }

    return (
        <div>
            <select value={selectedUserId} onChange={onChange} className="select select-bordered w-full">
                <option value="">{t('admin.selects.select_user')}</option>
                {users.map((user) => (
                    <option key={user.userId} value={user.userId}>
                        {user.userProfile?.name || user.email}
                    </option>
                ))}

            </select>
        </div >
    );
}

export default UserSelect;