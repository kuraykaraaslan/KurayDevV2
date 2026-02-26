import Welcome from '@/components/frontend/Features/Hero/Welcome'
import Toolbox from '@/components/frontend/Features/Hero/Toolbox'
import Contact from '@/components/frontend/Features/Hero/Contact'
import ProjectsHero from '@/components/frontend/Features/Hero/Projects'
import type { Metadata } from 'next'
import MetadataHelper from '@/helpers/MetadataHelper'
//import AppointmentCalendar from '@/components/frontend/Features/Appointments/AppointmentCalendar'; // Uncomment this line to enable the Appointment Calendar feature
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import OfflineIndicator from '@/components/common/UI/Indicators/OfflineIndicator'
import { AVAILABLE_LANGUAGES } from '@/types/common/I18nTypes'
import { buildAlternates, buildLangUrl, getOgLocale } from '@/helpers/HreflangHelper'
import { getPageMetadata } from '@/libs/localize/getDictionary'

const APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST

type Props = {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const { canonical, languages } = buildAlternates(lang, '', [...AVAILABLE_LANGUAGES])
  const { title, description, keywords } = await getPageMetadata(lang, 'home')

  return {
    title,
    description,
    keywords,
    robots: { index: true, follow: true },
    authors: [{ name: 'Kuray Karaaslan', url: `${APPLICATION_HOST}` }],
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      images: [
        {
          url: `${APPLICATION_HOST}/assets/img/og.png`,
          width: 1200,
          height: 630,
          alt: 'Kuray Karaaslan - Software Developer',
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
      images: [`${APPLICATION_HOST}/assets/img/og.png`],
    },
    alternates: { canonical, languages },
  }
}

const HomePage = async ({ params }: Props) => {
  const { lang } = await params
  const url = buildLangUrl(lang, '')
  const { title, description } = await getPageMetadata(lang, 'home')

  const jsonLdMeta: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      images: [`${APPLICATION_HOST}/assets/img/og.png`],
    },
  }

  return (
    <>
      {MetadataHelper.generateJsonLdScripts(jsonLdMeta, { includeProfilePage: true })}
      <Welcome />
      <Toolbox />
      <ProjectsHero />
      <Contact />
      <ToastContainer />
      <OfflineIndicator />
    </>
  )
}

export default HomePage
