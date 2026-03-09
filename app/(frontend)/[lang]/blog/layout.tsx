import { ReactNode } from 'react'
import { Metadata } from 'next'
import BlogLayoutClient from './layout.client'

const NEXT_PUBLIC_APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST

export const metadata: Metadata = {
  alternates: {
    types: {
      'application/rss+xml': `${NEXT_PUBLIC_APPLICATION_HOST}/feed.xml`,
    },
  },
}

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      {children}
      <BlogLayoutClient />
    </>
  )
}

export default Layout
