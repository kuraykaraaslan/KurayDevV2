'use client'
import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import axiosInstance from "@/libs/axios";
import useGlobalStore from "@/libs/zustand";

// Make sure to import the Navbar component from the correct path
const Navbar = dynamic(() => import('@/components/admin/Navbar'), { ssr: false });

const Layout = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const router = useRouter();
    const { user, setUser } = useGlobalStore();
    const [isAuthChecked, setIsAuthChecked] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axiosInstance.get('/api/auth/session');
                if (response.status === 200 && response.data.user) {
                    setUser(response.data.user);
                    
                    // Check if user has admin role
                    if (response.data.user.userRole !== 'ADMIN' && response.data.user.userRole !== 'SUPER_ADMIN') {
                        router.push('/auth/login?error=Access denied');
                        return;
                    }
                    
                    setIsAuthChecked(true);
                }
            } catch (error) {
                // Axios interceptor will handle redirect to login
                console.error('Auth check failed:', error);
            }
        };

        if (!isAuthChecked) {
            checkAuth();
        }
    }, [isAuthChecked, router, setUser]);

    // Show loading state while checking authentication
    if (!isAuthChecked) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div style={{ flex: 1 }} className="container mx-auto px-4 pt-4 md:pt-12 lg:px-8 max-w-8xl mb-8 mt- flex flex-col md:flex-row gap-4">
                {/* [children] */}
                {children}
            </div>
            <ToastContainer />
        </>
    );
}

export default Layout;