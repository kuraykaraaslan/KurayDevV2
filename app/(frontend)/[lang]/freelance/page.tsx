import type { Metadata } from 'next'
import Hero from '@/components/frontend/Features/Freelance/Hero'
import Capabilities from '@/components/frontend/Features/Freelance/Capabilities'
import Engagement from '@/components/frontend/Features/Freelance/Engagement'
import Platforms from '@/components/frontend/Features/Hero/Platforms'
import Testimonials from '@/components/frontend/Features/Hero/Testimonials'
import Contact from '@/components/frontend/Features/Hero/Contact'
import MetadataHelper from '@/helpers/MetadataHelper'
import { INDEXABLE_LANGUAGES } from '@/types/common/I18nTypes'
import { buildAlternates, getOgLocale, robotsFor } from '@/helpers/HreflangHelper'
import { getPageMetadata } from '@/libs/localize/getDictionary'
import { SITE_URL } from '@/libs/seo/siteUrl'

const NEXT_PUBLIC_APPLICATION_HOST = SITE_URL

type Props = {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const { canonical, languages, indexableLangs } = buildAlternates(lang, '/freelance', INDEXABLE_LANGUAGES)
  const indexable = indexableLangs.includes(lang)
  const { title, description, keywords } = await getPageMetadata(lang, 'freelance')

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
          alt: 'Kuray Karaaslan - Freelance Software Architect & Product Engineer',
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
      images: [{ url: `${NEXT_PUBLIC_APPLICATION_HOST}/assets/img/og.png`, alt: 'Kuray Karaaslan Freelance' }],
    },
    alternates: { canonical, languages },
  }
}

export default async function FreelancePage({ params }: Props) {
  const { lang } = await params
  const canonical = `${NEXT_PUBLIC_APPLICATION_HOST}${lang !== 'en' ? `/${lang}` : ''}/freelance`
  const { title, description } = await getPageMetadata(lang, 'freelance')

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
    { name: 'Freelance', url: canonical },
  ]

  return (
    <>
      {MetadataHelper.generateJsonLdScripts(jsonLdMetadata, { breadcrumbs })}
      <Hero />
      <Capabilities />
      <Engagement />
      <Platforms />
      <Testimonials />
      <Contact />
    </>
  )
}
