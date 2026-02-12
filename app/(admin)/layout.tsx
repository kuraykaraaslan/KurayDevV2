'use client'
import { Suspense, ReactNode } from 'react'
import 'react-toastify/dist/ReactToastify.css'
import '@/libs/localize/localize' // i18n initialization

const Layout = ({ children }: { children: ReactNode }) => {
  return <Suspense>{children}</Suspense>
}

export default Layout
