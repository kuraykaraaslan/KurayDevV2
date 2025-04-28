import Footer from "@/components/frontend/Footer";
import Navbar from "@/components/frontend/Navbar";
import ScrollToTop from "@/components/frontend/ScrollToTop";
import Sidebar from "@/components/frontend/Sidebar";
import TerminalButton from "@/components/frontend/TerminalButton";
import Whatsapp from "@/components/frontend/Whatsapp";
import { Suspense , useEffect, useState } from "react";
import { useGlobalStore } from "@/libs/zustand";
/*
export const metadata: Metadata = {
  title: "Kuray Karaaslan | Software Engineer",
  description: "Welcome to my tech blog! I’m Kuray Karaaslan, a frontend, backend, and mobile developer skilled in React, Next.js, Node.js, Java, and React Native. I share practical coding tutorials, industry insights, and UI/UX tips to help developers and tech enthusiasts excel. Stay updated, solve problems, and grow your tech expertise with me!",
};
*/

export default function RootLayout({
  children,
  props = { lng: "en" },
}: Readonly<{
  children: React.ReactNode;
  props: { lng: string };
}>) {



  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <div className="drawer">
        <input id="my-drawer" type="checkbox" className="drawer-toggle" />
        <div className="relative drawer-content flex flex-col min-h-screen bg-base-200 h-full">
          {/* Navbar */}
          <Navbar />
          {/* Page content here */}
          {children}

          {/* Footer */}
          <Footer />
        </div>
        <Sidebar />
      </div>
      <ScrollToTop />
      <Whatsapp />
    </Suspense>
  );
}
