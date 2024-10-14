import Contact from '@/components/frontend/Hero/Contact';
import HireMe from '@/components/frontend/Hero/HireMe';
import Platforms from '@/components/frontend/Hero/Platforms';
import Services from '@/components/frontend/Hero/Services';
import Testimonials from '@/components/frontend/Hero/Testimonials';
import React from 'react';

const FreelancePage = () => {
  return (
    <>
      <HireMe />
      <Services />
      <Testimonials />
      <Platforms />
      <Contact bsckgroundColor='bg-base-100' />
    </>
  );
};

export default FreelancePage;