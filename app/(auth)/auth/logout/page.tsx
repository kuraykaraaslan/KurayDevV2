'use client';
import axiosInstance from '@/libs/axios';
import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useGlobalStore } from '@/libs/zustand';
import { useRouter } from 'next/navigation';


const LogoutPage = () => {

    const { setSession, setToken } = useGlobalStore();

    const router = useRouter();
    const { session } = useGlobalStore();

    const handleLogout = async () => {
        const res = await axiosInstance.post(`/api/auth/logout`, {},
            {
                headers: {
                    Authorization: `Bearer ${session?.sessionToken}`
                }
            }
        ).catch(err => {
            toast.error(err.response.data.message);
        }).finally(() => {
            setSession(undefined);
            setToken(undefined  );
            router.push('/auth/login');
        });
    }

    useEffect(() => {
        handleLogout();
    }, []);

    return (
        <>

        </>
    )
}

export default LogoutPage;