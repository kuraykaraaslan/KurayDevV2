import Footer from "@/components/frontend/Layout/Footer";
import Navbar from "@/components/frontend/Layout/Navbar";
import ScrollToTop from "@/components/frontend/UI/Buttons/ScrollToTop";
import Sidebar from "@/components/frontend/Layout/Sidebar";
import Whatsapp from "@/components/frontend/Features/Social/Whatsapp";
import MenuItems from "@/components/frontend/Layout/MenuItems";
import { ReactNode } from "react";

/*
export const metadata: Metadata = {
  title: "Kuray Karaaslan | Software Engineer",
  description: "Welcome to my tech blog! I’m Kuray Karaaslan, a frontend, backend, and mobile developer skilled in React, Next.js, Node.js, Java, and React Native. I share practical coding tutorials, industry insights, and UI/UX tips to help developers and tech enthusiasts excel. Stay updated, solve problems, and grow your tech expertise with me!",
};
*/

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {



  return (
    <>
      <div className="drawer">
        <input id="my-drawer" type="checkbox" className="drawer-toggle" />
        <div className="relative drawer-content flex flex-col min-h-screen bg-base-200 h-full">
          {/* Navbar */}
          <Navbar menuItems={MenuItems} />
          {/* Page content here */}
          {children}

          {/* Footer */}
          <Footer />
        </div>
        <Sidebar menuItems={MenuItems} />
      </div>
      <ScrollToTop />
      <Whatsapp />
    </>
  );
}
