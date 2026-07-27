import Welcome from '@/components/frontend/Features/Hero/Welcome'
import Toolbox from '@/components/frontend/Features/Hero/Toolbox'
import Contact from '@/components/frontend/Features/Hero/Contact'
import ProjectsHero from '@/components/frontend/Features/Hero/Projects'
import type { Metadata } from 'next'
import MetadataHelper from '@/helpers/MetadataHelper'
import ProjectService from '@/services/ProjectService'
//import AppointmentCalendar from '@/components/frontend/Features/Appointments/AppointmentCalendar'; // Uncomment this line to enable the Appointment Calendar feature
import ToastContainerClient from '@/components/common/UI/Toast/ToastContainerClient'
import 'react-toastify/dist/ReactToastify.css'
import OfflineIndicator from '@/components/common/UI/Indicators/OfflineIndicator'
import { INDEXABLE_LANGUAGES } from '@/types/common/I18nTypes'
import { buildAlternates, buildLangUrl, getOgLocale, robotsFor } from '@/helpers/HreflangHelper'
import { getPageMetadata } from '@/libs/localize/getDictionary'
import { SITE_URL } from '@/libs/seo/siteUrl'
import { SITE_SAME_AS } from '@/helpers/MetadataHelper'

const NEXT_PUBLIC_APPLICATION_HOST = SITE_URL

type Props = {
  params: Promise<{ lang: string }>
}

const DEFAULT_HOME_TITLE = 'Kuray Karaaslan | Software Architect & Product Engineer'
const DEFAULT_HOME_DESCRIPTION =
  'Software architect and product engineer with hands-on BIM and IoT experience, designing production-grade SaaS, Autodesk Revit automation, MQTT telemetry, and real-time platforms across architecture, backend, frontend, and infrastructure.'
const DEFAULT_HOME_KEYWORDS = [
  'software architect',
  'product engineer',
  'platform engineer',
  'bim developer',
  'iot developer',
  'autodesk revit',
  'bim automation',
  'mqtt',
  'websocket',
  'snmp',
  'saas architecture',
  'iot platform',
  'iot telemetry',
  'real-time systems',
  'systems builder',
  'next.js',
  'kuray karaaslan',
]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const { canonical, languages, indexableLangs } = buildAlternates(lang, '', INDEXABLE_LANGUAGES)
  const indexable = indexableLangs.includes(lang)
  const dictMeta = await getPageMetadata(lang, 'home')
  const title = dictMeta.title || DEFAULT_HOME_TITLE
  const description = dictMeta.description || DEFAULT_HOME_DESCRIPTION
  const keywords = dictMeta.keywords && dictMeta.keywords.length ? dictMeta.keywords : DEFAULT_HOME_KEYWORDS

  return {
    // absolute prevents the layout template ("%s | Kuray Karaaslan") from
    // duplicating the brand name — the homepage title already includes it.
    title: { absolute: title },
    description,
    keywords,
    robots: robotsFor(indexable),
    authors: [{ name: 'Kuray Karaaslan', url: `${NEXT_PUBLIC_APPLICATION_HOST}` }],
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
          alt: 'Kuray Karaaslan - Software Architect & Product Engineer',
          type: 'image/png',
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

const HomePage = async ({ params }: Props) => {
  const { lang } = await params
  const url = buildLangUrl(lang, '')

  const [dictMeta, projects] = await Promise.all([
    getPageMetadata(lang, 'home'),
    ProjectService.getAllProjectSlugs().catch(() => []),
  ])

  const title = dictMeta.title || DEFAULT_HOME_TITLE
  const description = dictMeta.description || DEFAULT_HOME_DESCRIPTION

  const jsonLdMeta: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      images: [`${NEXT_PUBLIC_APPLICATION_HOST}/assets/img/og.png`],
    },
  }

  const breadcrumbs = [{ name: 'Home', url }]

  const portfolioItems = projects.slice(0, 10).map((p: any) => ({
    name: p.title,
    url: `${NEXT_PUBLIC_APPLICATION_HOST}/projects/${p.slug}`,
    image: p.image || undefined,
  }))

  return (
    <>
      {MetadataHelper.generateJsonLdScripts(jsonLdMeta, {
        includeProfilePage: true,
        profilePage: { sameAs: SITE_SAME_AS },
        breadcrumbs,
        portfolioItems,
      })}
      <Welcome />
      <Toolbox />
      <ProjectsHero />
      <Contact />
      <ToastContainerClient />
      <OfflineIndicator />
    </>
  )
}

export default HomePage
