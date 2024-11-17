'use client'
import Navbar from "@/components/backend/Navbar";
import React, { useEffect } from "react";
import { Metadata } from "next";
import { SessionProvider } from "next-auth/react"
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useAuthStore from "@/libs/zustand";
import { useRouter } from "next/navigation";

const Layout = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    
    const { session } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (session === undefined) {
           return;
        }

        if (session === null) {
            router.push("/auth/login");
        }

    } , [session]);

    return (
        <html lang="en">
            <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                <SessionProvider>
                    <Navbar />
                    <div style={{ flex: 1 }} className="container mx-auto px-4 pt-4 md:pt-12 lg:px-8 max-w-8xl mb-8 mt- flex flex-col md:flex-row gap-4">
                        {/* [children] */}
                        {children}
                    </div>
                </SessionProvider>
                <ToastContainer />
            </body>
        </html>
    );
}

export default Layout;