'use client';
import axiosInstance from '@/libs/axios';
import { faInstagram, faTiktok, faFacebook } from '@fortawesome/free-brands-svg-icons';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/libs/zustand';
import { useRouter } from 'next/navigation';


const LogoutPage = () => {

    const { setSession, setToken } = useAuthStore();

    const router = useRouter();
    const { session } = useAuthStore();

    const handleLogout = async () => {
        const res = await axiosInstance.post(`/api/auth/logout`, {},
            {
                headers: {
                    Authorization: `Bearer ${session?.sessionToken}`
                }
            }
        ).catch(err => {
            console.log(err);
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