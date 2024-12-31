import Welcome from '@/components/frontend/Hero/Welcome';
import React from 'react';
import Toolbox from '@/components/frontend/Hero/Toolbox';
import Contact from '@/components/frontend/Hero/Contact';
import TimelineV2 from '@/components/frontend/Hero/TimelineV2';
import ProjectsHero from '@/components/frontend/Hero/Projects';

const WelcomePage = () => {
  return (
    <>
      <Welcome />
      <TimelineV2 />
      <Toolbox />
      <ProjectsHero />
      <Contact />
    </>
  );
};

export default WelcomePage;