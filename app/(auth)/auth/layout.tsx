'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { usePathname } from 'next/navigation'
import { faCode, faShieldHalved, faBolt, faGlobe } from '@fortawesome/free-solid-svg-icons'
import { ReactNode, Suspense, useEffect } from 'react'
import SSOLogin from '@/components/frontend/Integrations/Appointments/SSOLogin'
import { useTranslation } from 'react-i18next'
import AuthGridBackground from '@/components/auth/AuthGridBackground'
import { useLanguageStore } from '@/libs/zustand'
import i18n from '@/libs/localize/localize'
import { getDirection } from '@/types/common/I18nTypes'
import Logo from '@/components/common/Layout/Logo'
import LangButtonCSR from '@/components/common/UI/LangButtonCSR'
import ThemeButton from '@/components/frontend/Layout/Navbar/Partials/ThemeButton'

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const lang = useLanguageStore((s) => s.lang)

  useEffect(() => {
    if (i18n.language !== lang) i18n.changeLanguage(lang)
    document.documentElement.lang = lang
    document.documentElement.dir = getDirection(lang)
  }, [lang])

  const titles = [
    { path: '/auth/login', title: t('auth.login.welcome_back') },
    { path: '/auth/register', title: t('auth.register.title') },
    { path: '/auth/forgot-password', title: t('auth.forgot_password.title') },
    { path: '/auth/reset-password', title: t('auth.reset_password.title') },
    { path: '/auth/logout', title: t('auth.logout.title') },
  ]

  const pageTitle = titles.find((item) => pathname?.startsWith(item.path))?.title

  const features = [
    { icon: faShieldHalved, label: t('auth.branding.feature_security') },
    { icon: faBolt, label: t('auth.branding.feature_built') },
    { icon: faGlobe, label: t('auth.branding.feature_i18n') },
  ]

  return (
    <Suspense>
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-2xl shadow-xl overflow-hidden border border-base-300 bg-base-100">

          {/* Left branding panel */}
          <div className="hidden md:flex flex-col justify-between bg-primary text-primary-content p-10 relative overflow-hidden">
            <AuthGridBackground />

            <div className="relative flex items-center gap-2 text-primary-content/90 hover:text-primary-content transition-colors">
              <Logo href='/' />
              <ThemeButton />
              <LangButtonCSR />
            </div>

            <div className="relative space-y-3">
              <h2 className="text-3xl font-bold leading-snug">
                {t('auth.branding.headline_line1')}<br />{t('auth.branding.headline_line2')}
              </h2>
              <p className="text-primary-content/70 text-sm leading-relaxed">
                {t('auth.branding.tagline')}
              </p>
            </div>

            <ul className="relative space-y-3">
              {features.map((f) => (
                <li key={f.label} className="flex items-center gap-3 text-sm text-primary-content/80">
                  <FontAwesomeIcon icon={f.icon} className="w-4 h-4 shrink-0" />
                  <span>{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right form panel */}
          <div className="flex flex-col justify-center px-8 py-10 gap-6">
            {/* Mobile logo */}
            <div className="flex md:hidden justify-center">
              <Logo href='/' />
              <ThemeButton />
              <LangButtonCSR />
            </div>

            {pageTitle && (
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">{pageTitle}</h1>
                <p className="text-sm text-base-content/50">{t('auth.login.email_placeholder')}</p>
              </div>
            )}

            <div className="w-full">
              {children}
              <div className="flex items-center gap-3 my-5">
                <span className="flex-1 h-px bg-base-300" />
                <span className="text-xs text-base-content/40 uppercase tracking-widest">{t('common.or')}</span>
                <span className="flex-1 h-px bg-base-300" />
              </div>
              <SSOLogin mode="pins" />
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </Suspense>
  )
}
