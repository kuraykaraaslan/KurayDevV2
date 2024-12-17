import Welcome from '@/components/frontend/Hero/Welcome';
import React from 'react';
import Timeline from '@/components/frontend/Hero/Timeline';
import Toolbox from '@/components/frontend/Hero/Toolbox';
import GitContributions from '@/components/frontend/Hero/GitContributions';
import Contact from '@/components/frontend/Hero/Contact';
import PortfolioHero from '@/components/frontend/Hero/Portfolio';
import TimelineV2 from '@/components/frontend/Hero/TimelineV2';

const WelcomePage = () => {
  return (
    <>
      <Welcome />
      <TimelineV2 />
      <Toolbox />
      <PortfolioHero />
      <Contact />
    </>
  );
};

export default WelcomePage;