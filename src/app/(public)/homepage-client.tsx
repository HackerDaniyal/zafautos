'use client';

import React, { useState, useMemo } from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { QuickSearch } from '@/components/home/QuickSearch';
import { MarketplaceSidebar, type SidebarFilterState } from '@/components/marketplace/MarketplaceSidebar';
import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import { BrowseByCountry } from '@/components/home/BrowseByCountry';
import { BrowseByFuelType } from '@/components/home/BrowseByFuelType';
import { BrowseByTransmission } from '@/components/home/BrowseByTransmission';
import { BrowseByPrice } from '@/components/home/BrowseByPrice';
import { BrowseByYear } from '@/components/home/BrowseByYear';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { CustomerTestimonials } from '@/components/home/CustomerTestimonials';
import { FaqSection } from '@/components/home/FaqSection';
import { CtaBanner } from '@/components/home/CtaBanner';
import { FooterCtaStrip } from '@/components/home/FooterCtaStrip';
import { ChequeredDivider } from '@/components/ui/ChequeredDivider';
import { MainContainer } from '@/components/layout/MainContainer';
import type { VehicleCardData } from '@/components/marketplace/VehicleCard';

interface SectionData {
  id: string;
  type: string;
  isEnabled: boolean;
  displayOrder: number;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  buttonLabel: string | null;
  buttonUrl: string | null;
  button2Label: string | null;
  button2Url: string | null;
  extraData: Record<string, unknown> | null;
}

interface HomepageClientProps {
  sections: SectionData[];
  featuredVehicles: VehicleCardData[];
  latestVehicles: VehicleCardData[];
}

const DEFAULT_FILTERS: SidebarFilterState = {
  makes: [],
  bodyTypes: [],
  fuelTypes: [],
  transmissions: [],
  priceRange: [0, 100000],
  yearRange: [2000, 2026],
  destinationCountry: '',
};

function getSectionByType(sections: SectionData[], type: string): SectionData | undefined {
  return sections.find((s) => s.type === type && s.isEnabled);
}

export function HomepageClient({ sections, featuredVehicles, latestVehicles }: HomepageClientProps) {
  const [filters, setFilters] = useState<SidebarFilterState>(DEFAULT_FILTERS);

  const heroSection = getSectionByType(sections, 'hero');
  const whyChooseUsSection = getSectionByType(sections, 'why_choose_us');
  const ctaSection = getSectionByType(sections, 'cta');
  const faqSection = getSectionByType(sections, 'faq');
  const statisticsSection = getSectionByType(sections, 'statistics');
  const testimonialsSection = getSectionByType(sections, 'testimonials');

  const allVehicles = useMemo(() => [...featuredVehicles, ...latestVehicles], [featuredVehicles, latestVehicles]);

  const filteredFeatured = useMemo(() => {
    return featuredVehicles.filter((v) => {
      if (filters.makes.length > 0 && !filters.makes.includes(v.make)) return false;
      if (filters.bodyTypes.length > 0 && !filters.bodyTypes.includes(v.bodyType)) return false;
      if (filters.fuelTypes.length > 0 && !filters.fuelTypes.includes(v.fuelType)) return false;
      if (filters.transmissions.length > 0 && !filters.transmissions.includes(v.transmission)) return false;
      if (v.price < filters.priceRange[0] || v.price > filters.priceRange[1]) return false;
      if (v.year < filters.yearRange[0] || v.year > filters.yearRange[1]) return false;
      if (filters.destinationCountry && v.location !== filters.destinationCountry) return false;
      return true;
    });
  }, [featuredVehicles, filters]);

  const filteredLatest = useMemo(() => {
    return latestVehicles.filter((v) => {
      if (filters.makes.length > 0 && !filters.makes.includes(v.make)) return false;
      if (filters.bodyTypes.length > 0 && !filters.bodyTypes.includes(v.bodyType)) return false;
      if (filters.fuelTypes.length > 0 && !filters.fuelTypes.includes(v.fuelType)) return false;
      if (filters.transmissions.length > 0 && !filters.transmissions.includes(v.transmission)) return false;
      if (v.price < filters.priceRange[0] || v.price > filters.priceRange[1]) return false;
      if (v.year < filters.yearRange[0] || v.year > filters.yearRange[1]) return false;
      if (filters.destinationCountry && v.location !== filters.destinationCountry) return false;
      return true;
    });
  }, [latestVehicles, filters]);

  const parsedTestimonials = useMemo(() => {
    if (!testimonialsSection?.extraData) return null;
    const data = testimonialsSection.extraData;
    if (typeof data === 'object' && data !== null && 'testimonials' in data) {
      return (data as { testimonials: unknown }).testimonials;
    }
    return null;
  }, [testimonialsSection]);

  const parsedFaq = useMemo(() => {
    if (!faqSection?.extraData) return null;
    const data = faqSection.extraData;
    if (typeof data === 'object' && data !== null && 'items' in data) {
      return (data as { items: unknown }).items;
    }
    return null;
  }, [faqSection]);

  return (
    <>
      <HeroSection
        title={heroSection?.title}
        subtitle={heroSection?.subtitle}
        imageUrl={heroSection?.imageUrl}
        buttonLabel={heroSection?.buttonLabel}
        buttonUrl={heroSection?.buttonUrl}
        button2Label={heroSection?.button2Label}
        button2Url={heroSection?.button2Url}
      />
      <QuickSearch />

      <MainContainer className="pt-4 pb-2 lg:pt-5 lg:pb-2">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 lg:gap-5 items-start">
          <MarketplaceSidebar filters={filters} onFilterChange={setFilters} />
          <div className="flex flex-col gap-5 lg:gap-5">
            {filteredFeatured.length > 0 ? (
              <>
                <VehicleListingSection
                  title="Featured Vehicles"
                  description="Handpicked quality vehicles ready for export"
                  vehicles={filteredFeatured}
                />
                <ChequeredDivider />
                {filteredLatest.length > 0 && (
                  <>
                    <VehicleListingSection
                      title="Latest Arrivals"
                      description="Recently added to our inventory"
                      vehicles={filteredLatest}
                    />
                    <ChequeredDivider />
                  </>
                )}
              </>
            ) : (
              featuredVehicles.length > 0 ? (
                <>
                  <VehicleListingSection
                    title="Featured Vehicles"
                    description="Handpicked quality vehicles ready for export"
                    vehicles={featuredVehicles}
                  />
                  <ChequeredDivider />
                  {latestVehicles.length > 0 && (
                    <>
                      <VehicleListingSection
                        title="Latest Arrivals"
                        description="Recently added to our inventory"
                        vehicles={latestVehicles}
                      />
                      <ChequeredDivider />
                    </>
                  )}
                </>
              ) : (
                <div className="rounded-[10px] border border-iron/30 bg-carbon p-12 text-center">
                  <p className="text-steel">No vehicles match your current filters.</p>
                  <p className="text-sm text-iron mt-1">Try adjusting your search criteria.</p>
                </div>
              )
            )}
          </div>
        </div>
      </MainContainer>

      <MainContainer className="py-4 lg:py-5">
        <BrowseByPrice vehicles={allVehicles.slice(0, 14)} />
        <ChequeredDivider />
        <BrowseByCountry vehicles={allVehicles.slice(0, 14)} />
        <ChequeredDivider />
        <BrowseByTransmission vehicles={allVehicles.slice(0, 14)} />
        <ChequeredDivider />
        <BrowseByFuelType vehicles={allVehicles.slice(0, 14)} />
        <ChequeredDivider />
        <BrowseByYear vehicles={allVehicles.slice(0, 14)} />
      </MainContainer>

      <MainContainer className="py-5 lg:py-6">
        <WhyChooseUs
          title={whyChooseUsSection?.title}
          subtitle={whyChooseUsSection?.subtitle}
          features={whyChooseUsSection?.extraData}
        />
        <ChequeredDivider />
        {statisticsSection && (
          <>
            <FooterCtaStrip
              title={statisticsSection.title}
              stats={statisticsSection.extraData}
            />
            <ChequeredDivider />
          </>
        )}
        <CustomerTestimonials
          title={testimonialsSection?.title}
          testimonials={parsedTestimonials}
        />
        <ChequeredDivider />
        <FaqSection
          title={faqSection?.title}
          subtitle={faqSection?.subtitle}
          items={parsedFaq}
        />
        <CtaBanner
          title={ctaSection?.title}
          subtitle={ctaSection?.subtitle}
          buttonLabel={ctaSection?.buttonLabel}
          buttonUrl={ctaSection?.buttonUrl}
          button2Label={ctaSection?.button2Label}
          button2Url={ctaSection?.button2Url}
        />
        <FooterCtaStrip
          title={statisticsSection?.title}
          stats={statisticsSection?.extraData}
        />
      </MainContainer>
    </>
  );
}
