import type { Metadata } from 'next'
import Faq from '@/components/frontend/Features/About/Faq'
import MetadataHelper from '@/helpers/MetadataHelper'
import { INDEXABLE_LANGUAGES } from '@/types/common/I18nTypes'
import { buildAlternates, getOgLocale, robotsFor } from '@/helpers/HreflangHelper'
import { getDictionary, getPageMetadata } from '@/libs/localize/getDictionary'
import { SITE_URL } from '@/libs/seo/siteUrl'

const NEXT_PUBLIC_APPLICATION_HOST = SITE_URL

type Props = {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const { canonical, languages, indexableLangs } = buildAlternates(lang, '/faq', INDEXABLE_LANGUAGES)
  const indexable = indexableLangs.includes(lang)
  const { title, description, keywords } = await getPageMetadata(lang, 'about')

  return {
    // dictionary titles already include "| Kuray Karaaslan"
    title: { absolute: title },
    description,
    keywords,
    robots: robotsFor(indexable),
    authors: [{ name: 'Kuray Karaaslan', url: NEXT_PUBLIC_APPLICATION_HOST || 'http://localhost:3000' }],
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      images: [
        {
          url: `${NEXT_PUBLIC_APPLICATION_HOST}/assets/img/og.png`,
          width: 1200,
          height: 630,
          alt: 'Kuray Karaaslan - FAQ',
        },
      ],
      locale: getOgLocale(lang),
      siteName: 'Kuray Karaaslan',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@kuraykaraaslan',
      creator: '@kuraykaraaslan',
      title,
      description,
      images: [{ url: `${NEXT_PUBLIC_APPLICATION_HOST}/assets/img/og.png`, alt: 'Kuray Karaaslan FAQ' }],
    },
    alternates: { canonical, languages },
  }
}

export default async function FaqPage({ params }: Props) {
  const { lang } = await params
  const canonical = `${NEXT_PUBLIC_APPLICATION_HOST}${lang !== 'en' ? `/${lang}` : ''}/faq`
  const { title, description } = await getPageMetadata(lang, 'about')
  const dict = await getDictionary(lang)

  const jsonLdMetadata: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      images: [`${NEXT_PUBLIC_APPLICATION_HOST}/assets/img/og.png`],
    },
  }

  const breadcrumbs = [
    { name: 'Home', url: `${NEXT_PUBLIC_APPLICATION_HOST}/` },
    { name: 'FAQ', url: canonical },
  ]

  const pages = dict.pages as { about?: { faq_items?: Record<string, { question: string; answer: string }> } }
  const items = pages.about?.faq_items ?? {}
  const faqPage = Object.values(items).map(({ question, answer }) => ({ question, answer }))

  return (
    <>
      {MetadataHelper.generateJsonLdScripts(jsonLdMetadata, {
        includeProfilePage: true,
        breadcrumbs,
        faqPage,
      })}
      <Faq />
    </>
  )
}
