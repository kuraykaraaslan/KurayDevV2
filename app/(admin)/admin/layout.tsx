'use client'
import { useEffect, useState, ReactNode } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import axiosInstance from '@/libs/axios'
import { useUserStore, useLanguageStore } from '@/libs/zustand'
import i18n from '@/libs/localize/localize'
import { getDirection } from '@/types/common/I18nTypes'

// Make sure to import the Navbar component from the correct path
const Navbar = dynamic(() => import('@/components/admin/Layout/Navbar'), { ssr: false })

const Layout = ({ children }: { children: ReactNode }) => {
  const router = useRouter()
  const { setUser } = useUserStore()
  const lang = useLanguageStore((s) => s.lang)
  const [isAuthChecked, setIsAuthChecked] = useState(false)

  useEffect(() => {
    if (i18n.language !== lang) i18n.changeLanguage(lang)
    document.documentElement.lang = lang
    document.documentElement.dir = getDirection(lang)
  }, [lang])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axiosInstance.get('/api/auth/session')
        if (response.status === 200 && response.data.user) {
          setUser(response.data.user)

          // Check if user has admin role
          if (
            response.data.user.userRole !== 'ADMIN' &&
            response.data.user.userRole !== 'AUTHOR' &&
            response.data.user.userRole !== 'SUPER_ADMIN'
          ) {
            router.push('/auth/login?error=Access denied')
            return
          }

          setIsAuthChecked(true)
        }
      } catch (error) {
        // Axios interceptor will handle redirect to login
        console.error('Auth check failed:', error)
      }
    }

    if (!isAuthChecked) {
      checkAuth()
    }
  }, [isAuthChecked, router, setUser])

  // Show loading state while checking authentication
  if (!isAuthChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div
        style={{ flex: 1 }}
        className="container mx-auto px-4 pt-4 md:pt-12 lg:px-8 max-w-8xl mb-8 mt- flex flex-col md:flex-row gap-4"
      >
        {/* [children] */}
        {children}
      </div>
      <ToastContainer />
    </>
  )
}

export default Layout
