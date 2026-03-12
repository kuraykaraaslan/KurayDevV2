'use client'
import { Suspense, ReactNode } from 'react'
import 'react-toastify/dist/ReactToastify.css'
import '@/libs/localize/localize' // i18n initialization (lazy-loads other languages on demand)

const Layout = ({ children }: { children: ReactNode }) => {
  return <Suspense>{children}</Suspense>
}

export default Layout
