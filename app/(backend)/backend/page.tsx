import Navbar from "@/components/backend/Navbar";
import React from "react";
import { Metadata } from "next";
import { SessionProvider } from "next-auth/react"
import StatsSection from "@/components/backend/StatsSection";


const Page = () => {
    return (
        <div className="container mx-auto items-center justify-center">
            <StatsSection />
        </div>
    );
}

export default Page;
