import './globals.css'
import Script from 'next/script'
import { ReactNode } from 'react'
import WebVitals from '@/components/frontend/WebVitals'
import type { Metadata, Viewport } from 'next'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG
const APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST || 'https://kuray.dev'

export const metadata: Metadata = {
  metadataBase: new URL(APPLICATION_HOST),
  title: {
    default: 'Kuray Karaaslan',
    // No template — all pages already include "| Kuray Karaaslan" in their title strings
    template: '%s',
  },
  description:
    'Software developer, tech blogger, and open-source enthusiast sharing coding tutorials and insights.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  authors: [{ name: 'Kuray Karaaslan', url: APPLICATION_HOST }],
  other: {
    publisher: 'Kuray Karaaslan',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1d2a35',
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" className="antialiased scroll-smooth focus:scroll-auto">
      <head>
        <meta charSet="utf-8" />
        {/* Preconnect hints for faster resource loading */}
        <link rel="preconnect" href="https://kuray-dev.s3.amazonaws.com" />
        <link rel="preconnect" href="https://www.gravatar.com" />
        <link rel="preconnect" href="https://avatars.githubusercontent.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://kuray-dev.s3.amazonaws.com" />
        <link rel="dns-prefetch" href="https://www.gravatar.com" />
        <link rel="dns-prefetch" href="https://avatars.githubusercontent.com" />
      </head>
      <body className="min-h-screen">
        <WebVitals />
        {children}

        {/* Google Analytics 4 */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              id="ga4-script"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_MEASUREMENT_ID}', { page_path: window.location.pathname });
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  )
}
