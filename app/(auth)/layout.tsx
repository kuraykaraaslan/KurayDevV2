import { ReactNode } from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Auth | Kuray Karaaslan',
  description: "Authentication pages for Kuray Karaaslan's platform",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <>{children}</>
}
