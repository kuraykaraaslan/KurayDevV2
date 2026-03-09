import type { Metadata } from 'next'
import Newsletter from '@/components/frontend/Features/Newsletter'
import ProjectsFeed from '@/components/frontend/Features/Projects/Feed'
import MetadataHelper from '@/helpers/MetadataHelper'
import { AVAILABLE_LANGUAGES } from '@/types/common/I18nTypes'
import { buildAlternates, getOgLocale } from '@/helpers/HreflangHelper'
import { getPageMetadata } from '@/libs/localize/getDictionary'

const NEXT_PUBLIC_APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST

type Props = {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const { canonical, languages } = buildAlternates(lang, '/projects', [...AVAILABLE_LANGUAGES])
  const { title, description, keywords } = await getPageMetadata(lang, 'projects')

  return {
    title,
    description,
    keywords,
    robots: { index: true, follow: true },
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
          alt: 'Kuray Karaaslan Projects',
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
      images: [`${NEXT_PUBLIC_APPLICATION_HOST}/assets/img/og.png`],
    },
    alternates: { canonical, languages },
  }
}

export default async function ProjectsPage({ params }: Props) {
  const { lang } = await params
  const canonical = `${NEXT_PUBLIC_APPLICATION_HOST}${lang !== 'en' ? `/${lang}` : ''}/projects`
  const { title, description } = await getPageMetadata(lang, 'projects')

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
    { name: 'Projects', url: canonical },
  ]

  return (
    <>
      {MetadataHelper.generateJsonLdScripts(jsonLdMetadata, { breadcrumbs })}
      <ProjectsFeed />
      <Newsletter backgroundColor="bg-base-200" />
    </>
  )
}
