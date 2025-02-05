'use client';
import axiosInstance from '@/libs/axios';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useGlobalStore } from '@/libs/zustand';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import SessionWithUser from '@/types/SessionWithUser';


export default function CallbackPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const router = useRouter();

    const { setSession, setToken, session } = useGlobalStore();

    useEffect(() => {
        if (!window) {
            return;
        }

        if (!token) {
            return;
        }

        const fetchSession = async () => {
            try {
                const response = await axiosInstance.get('/api/auth/me/session',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }).then((response) => {

                        const session = response.data.session as SessionWithUser;

                        setSession(session);
                        setToken(token);

                        toast.success('Logged in successfully!');

                        router.push('/');

                    }
                    );





            } catch (error: any) {
                toast.error(error.message);
            }
        }

        fetchSession();

    }
        , [token]);


    return (
        <div>
            <h1>we are logging you in...</h1>
        </div>
    );
}

