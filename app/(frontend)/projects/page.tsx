import type { Metadata } from 'next'
import Newsletter from '@/components/frontend/Features/Newsletter'
import ProjectsFeed from '@/components/frontend/Features/Projects/Feed'
import MetadataHelper from '@/helpers/MetadataHelper'

const APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST

const description =
  'Explore my portfolio of web, mobile, desktop, and other software projects. Built with React, Next.js, Node.js, Java, React Native, and more.'

export const metadata: Metadata = {
  title: 'Projects | Kuray Karaaslan',
  description,
  robots: { index: true, follow: true },
  authors: [{ name: 'Kuray Karaaslan', url: APPLICATION_HOST || 'https://kuray.dev' }],
  openGraph: {
    title: 'Projects | Kuray Karaaslan',
    description,
    type: 'website',
    url: `${APPLICATION_HOST}/projects`,
    images: [
      {
        url: `${APPLICATION_HOST}/assets/img/og.png`,
        width: 1200,
        height: 630,
        alt: 'Kuray Karaaslan Projects',
      },
    ],
    locale: 'en_US',
    siteName: 'Kuray Karaaslan',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@kuraykaraaslan',
    creator: '@kuraykaraaslan',
    title: 'Projects | Kuray Karaaslan',
    description,
    images: [`${APPLICATION_HOST}/assets/img/og.png`],
  },
  alternates: {
    canonical: `${APPLICATION_HOST}/projects`,
  },
}

const jsonLdMetadata: Metadata = {
  title: 'Projects | Kuray Karaaslan',
  description,
  openGraph: {
    title: 'Projects | Kuray Karaaslan',
    description,
    type: 'website',
    url: `${APPLICATION_HOST}/projects`,
    images: [`${APPLICATION_HOST}/assets/img/og.png`],
  },
}

const breadcrumbs = [
  { name: 'Home', url: `${APPLICATION_HOST}/` },
  { name: 'Projects', url: `${APPLICATION_HOST}/projects` },
]

export default function ProjectsPage() {
  return (
    <>
      {MetadataHelper.generateJsonLdScripts(jsonLdMetadata, { breadcrumbs })}
      <ProjectsFeed />
      <Newsletter backgroundColor="bg-base-200" />
    </>
  )
}
