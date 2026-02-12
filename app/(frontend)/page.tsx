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

const HomePage = () => {
  const metadata: Metadata = {
    title: 'Software Developer | Kuray Karaaslan',
    description:
      'Welcome to my tech blog! I’m Kuray Karaaslan, a frontend, backend, and mobile developer skilled in React, Next.js, Node.js, Java, and React Native. I share practical coding tutorials, industry insights, and UI/UX tips to help developers and tech enthusiasts excel. Stay updated, solve problems, and grow your tech expertise with me!',
    openGraph: {
      title: 'Software Developer | Kuray Karaaslan',
      description:
        'Welcome to my tech blog! I’m Kuray Karaaslan, a frontend, backend, and mobile developer skilled in React, Next.js, Node.js, Java, and React Native. I share practical coding tutorials, industry insights, and UI/UX tips to help developers and tech enthusiasts excel. Stay updated, solve problems, and grow your tech expertise with me!',
      type: 'website',
      url: `${APPLICATION_HOST}`,
      images: [`${APPLICATION_HOST}/assets/img/og.png`],
    },
  }

  return (
    <>
      {MetadataHelper.generateElements(metadata, { includeProfilePage: true })}
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
