import type { Metadata } from 'next';
import MetadataHelper from '@/helpers/MetadataHelper';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Welcome from '@/components/freelance/Hero/Welcome';

const APPLICATION_HOST = process.env.APPLICATION_HOST;

const HomePage = () => {

  const metadata: Metadata = {
    title: "Freelancer | Kuray Karaaslan",
    description: "Welcome to my freelance portfolio! I’m Kuray Karaaslan, a versatile software developer specializing in frontend, backend, and mobile development. With expertise in React, Next.js, Node.js, Java, and React Native, I deliver tailored solutions to meet your business needs. Explore my projects, services, and get in touch to discuss how I can help bring your ideas to life!",
    openGraph: {
      title: "Freelancer | Kuray Karaaslan",
      description: "Welcome to my freelance portfolio! I’m Kuray Karaaslan, a versatile software developer specializing in frontend, backend, and mobile development. With expertise in React, Next.js, Node.js, Java, and React Native, I deliver tailored solutions to meet your business needs. Explore my projects, services, and get in touch to discuss how I can help bring your ideas to life!",
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
      <ToastContainer />
    </>
  );
};

export default HomePage;
