/* 
    DefaultStacked.tsx
    created: 07/10/2024
    author: @kuraykaraaslan

    Copyright © 2024 Kuray.dev 
*/

import Navbar from "@/components/backend/Navbar";
import React from "react";
import { Metadata } from "next";
import { SessionProvider } from "next-auth/react"

export const metadata: Metadata = {
    title: "kuray.dev Admin Panel",
    description: "Admin panel for kuray.dev",
};

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

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
            </body>
        </html>
    );
}
