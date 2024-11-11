import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Kuray Karaaslan | Software Engineer",
  description: "Self-taught and self-motivated software developer, open-source contributor, and tech enthusiast with a diverse portfolio of independent projects.",
};



export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: any;
}>) {
  return (
    <html data-theme="light" className="antialiased scroll-smooth focus:scroll-auto">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
