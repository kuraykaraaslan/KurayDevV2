import axiosInstance from '@/libs/axios';
import { User } from '@prisma/client';
import React, { useEffect, useState } from 'react';

const UserSelect = ({ selectedUserId, setSelectedUserId }: { selectedUserId: string, setSelectedUserId: (userId: string) => void }) => {

    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        axiosInstance.get('/api/users?pageSize=100').then((response) => {
            const { users } = response.data;
            setUsers(users);
        });
    }, []);

    function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const selectedUser = users.find((user) => user.userId === e.target.value);
        if (selectedUser) {
            setSelectedUserId(selectedUser.userId);
        }
    }

    return (
        <div>
            <select value={selectedUserId} onChange={onChange} className="select select-bordered w-full">
                <option value="">Select User</option>
                {users.map((user) => (
                    <option key={user.userId} value={user.userId}>
                        {user.name}
                    </option>
                ))}

            </select>
        </div >
    );
}

export default UserSelect;