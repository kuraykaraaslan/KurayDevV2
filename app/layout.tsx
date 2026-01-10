import "./globals.css";
import Script from "next/script";
import { ReactNode } from "react";

const NEXT_PUBLIC_GOOGLE_TAG = process.env.NEXT_PUBLIC_GOOGLE_TAG;

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html data-theme="dark" className="antialiased scroll-smooth focus:scroll-auto">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        {/* DNS Prefetch - External Domains */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* Preconnect - Critical Third-party */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Favicon and PWA */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen">
        {children}

        <Script
          id="gtm-script"
          strategy="lazyOnload"
          src={`https://www.googletagmanager.com/gtm.js?id=${NEXT_PUBLIC_GOOGLE_TAG}`}
        />

        {/* Optional noscript fallback for analytics accuracy */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${NEXT_PUBLIC_GOOGLE_TAG}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
      </body>
    </html>
  );
}
