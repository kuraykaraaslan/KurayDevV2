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
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
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
