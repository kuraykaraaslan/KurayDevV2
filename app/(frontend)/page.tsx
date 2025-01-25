import Welcome from '@/components/frontend/Hero/Welcome';
import React from 'react';
import Toolbox from '@/components/frontend/Hero/Toolbox';
import Contact from '@/components/frontend/Hero/Contact';
import TimelineV2 from '@/components/frontend/Hero/TimelineV2';
import ProjectsHero from '@/components/frontend/Hero/Projects';
import type { Metadata } from 'next';


export const metadata: Metadata = {
  title: "Software Developer | Kuray Karaaslan",
  description: "Welcome to my tech blog! I’m Kuray Karaaslan, a frontend, backend, and mobile developer skilled in React, Next.js, Node.js, Java, and React Native. I share practical coding tutorials, industry insights, and UI/UX tips to help developers and tech enthusiasts excel. Stay updated, solve problems, and grow your tech expertise with me!",
  openGraph: {
    title: "Software Developer | Kuray Karaaslan",
    description: "Welcome to my tech blog! I’m Kuray Karaaslan, a frontend, backend, and mobile developer skilled in React, Next.js, Node.js, Java, and React Native. I share practical coding tutorials, industry insights, and UI/UX tips to help developers and tech enthusiasts excel. Stay updated, solve problems, and grow your tech expertise with me!",
    type: 'website',
    url: 'https://kuray.dev',
    images: [
      'https://kuray.dev/images/logo.png',
    ],
  },
};

export default function Home() {

  return (
    <>
      <Welcome />
      <Toolbox />
      <ProjectsHero />
      <Contact />
    </>
  );
};
