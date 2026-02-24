import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { AVAILABLE_LANGUAGES, type AppLanguage } from '@/types/common/I18nTypes'
import I18nProvider from '@/components/frontend/I18nProvider'

interface LangLayoutProps {
  children: ReactNode
  params: Promise<{ lang: string }>
}

export function generateStaticParams() {
  return AVAILABLE_LANGUAGES.map((lang) => ({ lang }))
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params

  if (!AVAILABLE_LANGUAGES.includes(lang as AppLanguage)) {
    notFound()
  }

  return <I18nProvider lang={lang as AppLanguage}>{children}</I18nProvider>
}
