'use client'
import React, { useEffect } from "react";
import { Metadata } from "next";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useGlobalStore from "@/libs/zustand";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Make sure to import the Navbar component from the correct path
const Navbar = dynamic(() => import('@/components/backend/Navbar'), { ssr: false });

const Layout = ({
    children,
}: {
    children: React.ReactNode;
}) => {

    const { session } = useGlobalStore();
    const router = useRouter();

    useEffect(() => {
        if (typeof session !== 'object') {
            return;
        }

        //check if the user is not logged in and role is not admin
        setTimeout(() => {
            if (!session?.user || session?.user?.role !== 'ADMIN') {
                //check if the user is not logged in and role is not admin
                router.push('/auth/login');
            }
        }, 500);

    }, [session]);



    return (
        <html lang="en">
            <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                <>
                    <Navbar />
                    <div style={{ flex: 1 }} className="container mx-auto px-4 pt-4 md:pt-12 lg:px-8 max-w-8xl mb-8 mt- flex flex-col md:flex-row gap-4">
                        {/* [children] */}
                        {children}
                    </div>
                    <ToastContainer />
                </>
            </body>
        </html>
    );
}

export default Layout;