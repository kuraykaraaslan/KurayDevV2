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

const APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST

const title = 'Software Developer | Kuray Karaaslan'
const description =
  'Welcome to my tech blog! I\u2019m Kuray Karaaslan, a frontend, backend, and mobile developer skilled in React, Next.js, Node.js, Java, and React Native. I share practical coding tutorials, industry insights, and UI/UX tips to help developers and tech enthusiasts excel. Stay updated, solve problems, and grow your tech expertise with me!'

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    'Kuray Karaaslan',
    'Software Developer',
    'Full Stack Developer',
    'React',
    'Next.js',
    'Node.js',
    'TypeScript',
    'Java',
    'React Native',
    'Web Development',
    'Mobile Development',
    'Tech Blog',
    'İzmir',
    'Turkey',
  ],
  robots: { index: true, follow: true },
  authors: [{ name: 'Kuray Karaaslan', url: `${APPLICATION_HOST}` }],
  openGraph: {
    title,
    description,
    type: 'website',
    url: `${APPLICATION_HOST}`,
    images: [
      {
        url: `${APPLICATION_HOST}/assets/img/og.png`,
        width: 1200,
        height: 630,
        alt: 'Kuray Karaaslan - Software Developer',
      },
    ],
    locale: 'en_US',
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
  alternates: {
    canonical: `${APPLICATION_HOST}`,
  },
}

const jsonLdMeta: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
    url: `${APPLICATION_HOST}`,
    images: [`${APPLICATION_HOST}/assets/img/og.png`],
  },
}

const HomePage = () => {
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
