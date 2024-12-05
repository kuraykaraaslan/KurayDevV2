'use client'
import Navbar from "@/components/backend/Navbar";
import React, { useEffect } from "react";
import { Metadata } from "next";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useGlobalStore from "@/libs/zustand";
import { useRouter } from "next/navigation";

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

        //if already loaded and session is null, redirect to login
        if (window && !session) {
            router.push('/auth/login');
        }
        
    }, [session]);



    return (
        <html lang="en">
            <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                {window ?
                    <>
                            <Navbar />
                            <div style={{ flex: 1 }} className="container mx-auto px-4 pt-4 md:pt-12 lg:px-8 max-w-8xl mb-8 mt- flex flex-col md:flex-row gap-4">
                                {/* [children] */}
                                {children}
                            </div>
                        <ToastContainer />
                    </>
                    :
                    <div className="flex items-center justify-center h-screen bg-base-200">
                            <p className="">Loading...</p>
                    </div>
                }
            </body>
        </html>
    );
}

export default Layout;