import Welcome from '@/components/frontend/Hero/Welcome';
import Toolbox from '@/components/frontend/Hero/Toolbox';
import Contact from '@/components/frontend/Hero/Contact';
import ProjectsHero from '@/components/frontend/Hero/Projects';
import type { Metadata } from 'next';
import MetadataHelper from '@/helpers/MetadataHelper';
import AppointmentCalendar from '@/components/frontend/AppointmentCalendar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import OfflineIndicator from '@/components/frontend/OfflineIndicator';

const APPLICATION_HOST = process.env.APPLICATION_HOST;

const HomePage = () => {

  const metadata: Metadata = {
    title: "Software Developer | Kuray Karaaslan",
    description: "Welcome to my tech blog! I’m Kuray Karaaslan, a frontend, backend, and mobile developer skilled in React, Next.js, Node.js, Java, and React Native. I share practical coding tutorials, industry insights, and UI/UX tips to help developers and tech enthusiasts excel. Stay updated, solve problems, and grow your tech expertise with me!",
    openGraph: {
      title: "Software Developer | Kuray Karaaslan",
      description: "Welcome to my tech blog! I’m Kuray Karaaslan, a frontend, backend, and mobile developer skilled in React, Next.js, Node.js, Java, and React Native. I share practical coding tutorials, industry insights, and UI/UX tips to help developers and tech enthusiasts excel. Stay updated, solve problems, and grow your tech expertise with me!",
      type: 'website',
      url: `${APPLICATION_HOST}`,
      images: [
        `${APPLICATION_HOST}/assets/img/og.png`,
      ],
    },
  };

  return (
    <>
      {MetadataHelper.generateElements(metadata)}
      <Welcome />
      <Toolbox />
      <ProjectsHero />
      <AppointmentCalendar />
      <Contact />
      <ToastContainer />
      <OfflineIndicator />
    </>
  );
};

export default HomePage;
