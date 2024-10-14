import Welcome from '@/components/frontend/Hero/Welcome';
import React from 'react';
import Timeline from '@/components/frontend/Hero/Timeline';
import Toolbox from '@/components/frontend/Hero/Toolbox';
import GitContributions from '@/components/frontend/Hero/GitContributions';
import Contact from '@/components/frontend/Hero/Contact';

const WelcomePage = () => {
  return (
    <>
      <Welcome />
      <GitContributions />
      <Toolbox />
      <Contact />
    </>
  );
};

export default WelcomePage;