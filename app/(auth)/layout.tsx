import { ReactNode } from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin | Kuray Karaaslan',
  description: "Admin panel for Kuray Karaaslan's blog",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <>{children}</>
}
