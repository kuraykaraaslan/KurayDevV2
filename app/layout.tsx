import "./globals.css";
import { GoogleTagManager } from '@next/third-parties/google'

/*
export const metadata: Metadata = {
  title: "Kuray Karaaslan | Software Engineer",
  description: "Self-taught and self-motivated software developer, open-source contributor, and tech enthusiast with a diverse portfolio of independent projects.",
};
*/

const NEXT_PUBLIC_GOOGLE_TAG = process.env.NEXT_PUBLIC_GOOGLE_TAG;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}> ) {
  return (
    <html data-theme="dark" className="antialiased scroll-smooth focus:scroll-auto">
      <head>
        <GoogleTagManager gtmId={NEXT_PUBLIC_GOOGLE_TAG as string} />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
