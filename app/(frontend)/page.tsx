import Welcome from '@/components/frontend/Hero/Welcome';
import React from 'react';
import Timeline from '@/components/frontend/Hero/Timeline';
import Toolbox from '@/components/frontend/Hero/Toolbox';
import GitContributions from '@/components/frontend/Hero/GitContributions';
import Contact from '@/components/frontend/Hero/Contact';
import PortfolioHero from '@/components/frontend/Hero/Portfolio';

const WelcomePage = () => {
  return (
    <>
      <Welcome />
      <Toolbox />
      <PortfolioHero />
      <Timeline />
      <Contact />
    </>
  );
};

export default WelcomePage;