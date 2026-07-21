'use client';

import React, { useState, useMemo } from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { QuickSearch } from '@/components/home/QuickSearch';
import { MarketplaceSidebar, type SidebarFilterState } from '@/components/marketplace/MarketplaceSidebar';
import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import { BrowseByPrice } from '@/components/home/BrowseByPrice';
import { BrowseByCountry } from '@/components/home/BrowseByCountry';
import { BrowseByTransmission } from '@/components/home/BrowseByTransmission';
import { BrowseByFuelType } from '@/components/home/BrowseByFuelType';
import { BrowseByYear } from '@/components/home/BrowseByYear';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { ImportProcess } from '@/components/home/ImportProcess';
import { CustomerTestimonials } from '@/components/home/CustomerTestimonials';
import { LatestNews } from '@/components/home/LatestNews';
import { FaqSection } from '@/components/home/FaqSection';
import { CtaBanner } from '@/components/home/CtaBanner';
import { FooterCtaStrip } from '@/components/home/FooterCtaStrip';
import { ChequeredDivider } from '@/components/ui/ChequeredDivider';
import { MainContainer } from '@/components/layout/MainContainer';
import { placeholderVehicles } from '@/data/placeholderVehicles';

const DEFAULT_FILTERS: SidebarFilterState = {
  makes: [],
  bodyTypes: [],
  fuelTypes: [],
  transmissions: [],
  priceRange: [0, 100000],
  yearRange: [2000, 2026],
  destinationCountry: '',
};

export default function PublicLandingPage() {
  const [filters, setFilters] = useState<SidebarFilterState>(DEFAULT_FILTERS);

  const filteredVehicles = useMemo(() => {
    return placeholderVehicles.filter((v) => {
      if (filters.makes.length > 0 && !filters.makes.includes(v.make)) return false;
      if (filters.bodyTypes.length > 0 && !filters.bodyTypes.includes(v.bodyType)) return false;
      if (filters.fuelTypes.length > 0 && !filters.fuelTypes.includes(v.fuelType)) return false;
      if (filters.transmissions.length > 0 && !filters.transmissions.includes(v.transmission)) return false;
      if (v.price < filters.priceRange[0] || v.price > filters.priceRange[1]) return false;
      if (v.year < filters.yearRange[0] || v.year > filters.yearRange[1]) return false;
      if (filters.destinationCountry && v.destinationCountry !== filters.destinationCountry) return false;
      return true;
    });
  }, [filters]);

  const featuredVehicles = filteredVehicles.slice(0, 28);
  const recentlyAdded = filteredVehicles.filter((v) => v.recentlyAdded).slice(0, 14);
  const auctionVehicles = filteredVehicles.filter((v) => !v.recentlyAdded && !v.isReserved).slice(0, 14);
  const newArrivals = filteredVehicles.filter((v) => v.recentlyAdded).slice(0, 14);

  return (
    <>
      <HeroSection />
      <QuickSearch />

      {/* Marketplace — sidebar + grid */}
      <MainContainer className="pt-4 pb-2 lg:pt-5 lg:pb-2">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 lg:gap-5 items-start">
          <MarketplaceSidebar filters={filters} onFilterChange={setFilters} />
          <div className="flex flex-col gap-5 lg:gap-5">
            {featuredVehicles.length > 0 ? (
              <>
                <VehicleListingSection
                  title="Featured Vehicles"
                  description="Hand-picked premium Japanese used cars ready for export."
                  vehicles={featuredVehicles}
                />
                <ChequeredDivider />
                {recentlyAdded.length > 0 && (
                  <>
                    <VehicleListingSection
                      title="Recently Added"
                      description="Fresh stock just arrived from Japanese auctions."
                      vehicles={recentlyAdded}
                    />
                    <ChequeredDivider />
                  </>
                )}
                {auctionVehicles.length > 0 && (
                  <>
                    <VehicleListingSection
                      title="Auction Vehicles"
                      description="Live auction vehicles with competitive pricing."
                      vehicles={auctionVehicles}
                    />
                    <ChequeredDivider />
                  </>
                )}
                {newArrivals.length > 0 && (
                  <VehicleListingSection
                    title="New Arrivals"
                    description="Latest inventory updates from our partners."
                    vehicles={newArrivals}
                  />
                )}
              </>
            ) : (
              <div className="flex min-h-[400px] items-center justify-center rounded-[8px] border border-dashed border-[#2A2A2A] bg-[#141414]/50">
                <div className="text-center px-4">
                  <p className="font-[Oswald] text-[15px] font-bold uppercase tracking-wide text-[#5A5A5A]">
                    No vehicles match your filters
                  </p>
                  <p className="mt-2 text-[12px] text-[#6E6E6E]">
                    Try adjusting your filter criteria
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </MainContainer>

      {/* Browse By Sections — full width */}
      <MainContainer className="py-4 lg:py-5">
        <div className="flex flex-col gap-4 lg:gap-5">
          <BrowseByPrice />
          <ChequeredDivider />
          <BrowseByCountry />
          <ChequeredDivider />
          <BrowseByTransmission />
          <ChequeredDivider />
          <BrowseByFuelType />
          <ChequeredDivider />
          <BrowseByYear />
        </div>
      </MainContainer>

      {/* Bottom content — full width */}
      <MainContainer className="py-5 lg:py-6">
        <div className="flex flex-col gap-5 lg:gap-6">
          <WhyChooseUs />
          <ChequeredDivider />
          <ImportProcess />
          <ChequeredDivider />
          <CustomerTestimonials />
          <ChequeredDivider />
          <LatestNews />
          <ChequeredDivider />
          <FaqSection />
          <CtaBanner />
          <FooterCtaStrip />
        </div>
      </MainContainer>
    </>
  );
}
