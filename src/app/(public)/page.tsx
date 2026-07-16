import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { QuickSearch } from '@/components/home/QuickSearch';
import { FeaturedVehicles } from '@/components/home/FeaturedVehicles';
import { ShopByMake } from '@/components/home/ShopByMake';
import { ShopByBodyType } from '@/components/home/ShopByBodyType';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { ImportProcess } from '@/components/home/ImportProcess';
import { CustomerTestimonials } from '@/components/home/CustomerTestimonials';
import { LatestNews } from '@/components/home/LatestNews';
import { FaqSection } from '@/components/home/FaqSection';
import { CtaBanner } from '@/components/home/CtaBanner';
import { FooterCtaStrip } from '@/components/home/FooterCtaStrip';
import { ContinentFilter } from '@/components/marketplace/ContinentFilter';
import { SectionWrapper, PageHeader } from '@/components/layout/ResponsiveLayout';

export default function PublicLandingPage() {
  return (
    <>
      <HeroSection />
      <QuickSearch />
      <FeaturedVehicles />
      <ShopByMake />
      <ShopByBodyType />
      <SectionWrapper>
        <PageHeader title="Shop By Region" description="Find vehicles available in your continent." />
        <ContinentFilter />
      </SectionWrapper>
      <WhyChooseUs />
      <ImportProcess />
      <CustomerTestimonials />
      <LatestNews />
      <FaqSection />
      <CtaBanner />
      <FooterCtaStrip />
    </>
  );
}
