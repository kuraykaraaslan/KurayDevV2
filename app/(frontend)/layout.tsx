import Footer from "@/components/frontend/Footer";
import Navbar from "@/components/frontend/Navbar";
import ScrollToTop from "@/components/frontend/ScrollToTop";
import Sidebar from "@/components/frontend/Sidebar";
import Whatsapp from "@/components/frontend/Whatsapp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kuray Karaaslan | Software Engineer",
  description: "Self-taught and self-motivated software developer, open-source contributor, and tech enthusiast with a diverse portfolio of independent projects.",
};

export default function RootLayout({
  children,
  props = { lng: "en" },
}: Readonly<{
  children: React.ReactNode;
  props: { lng: string };
}>) {
  return (
    <>
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
    </>
  );
}
