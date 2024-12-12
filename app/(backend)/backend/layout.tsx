'use client'
import React, { useEffect, useState } from "react";
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
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (session?.sessionToken === undefined) {
    
            setLoading(true); // Wait for Zustand to load
        } else {
            //wait for 1 second
            setTimeout(() => {
                setLoading(false);
            }, 1000);
        }
    }, [session]);

    useEffect(() => {
        if (!loading) {
            if (!session || !session.user) {
                router.push('/auth/login');
                return;
            }

            if (!session.user.role || session.user.role !== 'ADMIN') {
                router.push('/auth/login');
                return;
            }
        }
        
    }, [session, router, loading]);



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