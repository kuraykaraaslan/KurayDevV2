import Welcome from '@/components/frontend/Hero/Welcome';
import React from 'react';
import Toolbox from '@/components/frontend/Hero/Toolbox';
import Contact from '@/components/frontend/Hero/Contact';
import ProjectsHero from '@/components/frontend/Hero/Projects';
import type { Metadata } from 'next';
import MetadataHelper from '@/helpers/MetadataHelper';
import Timeline from '@/components/frontend/Hero/Timeline';


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
      <Timeline />
      <ProjectsHero />
      <Contact />
    </>
  );
};

export default HomePage;
