'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { HeroSection } from '@/components/home/HeroSection';
import { QuickSearch } from '@/components/home/QuickSearch';
import { MarketplaceSidebar, type SidebarFilterState } from '@/components/marketplace/MarketplaceSidebar';
import { CurrencySwitcher } from '@/components/marketplace/CurrencySwitcher';
import { VehicleListingSection } from '@/components/home/VehicleListingSection';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { CustomerTestimonials } from '@/components/home/CustomerTestimonials';
import { FaqSection } from '@/components/home/FaqSection';
import { CtaBanner } from '@/components/home/CtaBanner';
import { FooterCtaStrip } from '@/components/home/FooterCtaStrip';
import { ChequeredDivider } from '@/components/ui/ChequeredDivider';
import { MainContainer } from '@/components/layout/MainContainer';
import { ContinentFilter } from '@/components/marketplace/ContinentFilter';
import { WidgetVehicleCard } from '@/components/marketplace/WidgetVehicleCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import type { VehicleCardData } from '@/components/marketplace/VehicleCard';
import type { HomepageCurrency, HomepageMake, HomepageContinent, HomepageLookupItem } from '@/lib/homepage-data';
import type { PublicBanner, PublicTestimonial, PublicFaq, PublicBlogPost } from '@/lib/public-cms-data';

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
  currencies: HomepageCurrency[];
  exchangeRates: Record<string, number>;
  makes: HomepageMake[];
  continents: HomepageContinent[];
  bodyTypes: HomepageLookupItem[];
  fuelTypes: HomepageLookupItem[];
  transmissions: HomepageLookupItem[];
  driveTypes: HomepageLookupItem[];
  banners: PublicBanner[];
  testimonials: PublicTestimonial[];
  faqs: PublicFaq[];
  latestBlogPosts: PublicBlogPost[];
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

export function HomepageClient({
  sections, featuredVehicles, latestVehicles, currencies, exchangeRates, makes, continents,
  bodyTypes, fuelTypes, transmissions, driveTypes,
  banners, testimonials, faqs, latestBlogPosts,
}: HomepageClientProps) {
  const [filters, setFilters] = useState<SidebarFilterState>(DEFAULT_FILTERS);

  const heroSection = getSectionByType(sections, 'hero');
  const whyChooseUsSection = getSectionByType(sections, 'why_choose_us');
  const ctaSection = getSectionByType(sections, 'cta');
  const faqSection = getSectionByType(sections, 'faq');
  const statisticsSection = getSectionByType(sections, 'statistics');
  const testimonialsSection = getSectionByType(sections, 'testimonials');

  const allVehicles = useMemo(() => [...featuredVehicles, ...latestVehicles], [featuredVehicles, latestVehicles]);

  const compact33 = useMemo(() => {
    const seen = new Set<string>();
    const result: VehicleCardData[] = [];
    for (const v of allVehicles) {
      if (seen.has(v.id)) continue;
      seen.add(v.id);
      result.push(v);
      if (result.length >= 33) break;
    }
    return result;
  }, [allVehicles]);

  const filterVehicles = useMemo(() => {
    return (vehicles: VehicleCardData[]) => {
      return vehicles.filter((v) => {
        if (filters.makes.length > 0 && !filters.makes.includes(v.make)) return false;
        if (filters.bodyTypes.length > 0 && !filters.bodyTypes.includes(v.bodyType)) return false;
        if (filters.fuelTypes.length > 0 && !filters.fuelTypes.includes(v.fuelType)) return false;
        if (filters.transmissions.length > 0 && !filters.transmissions.includes(v.transmission)) return false;
        if (v.price < filters.priceRange[0] || v.price > filters.priceRange[1]) return false;
        if (v.year < filters.yearRange[0] || v.year > filters.yearRange[1]) return false;
        if (filters.destinationCountry && !(v.destinationCountryIds ?? []).includes(filters.destinationCountry)) return false;
        return true;
      });
    };
  }, [filters]);

  const filteredFeatured = useMemo(() => filterVehicles(featuredVehicles), [featuredVehicles, filterVehicles]);
  const filteredLatest = useMemo(() => filterVehicles(latestVehicles), [latestVehicles, filterVehicles]);

  const parsedTestimonials = useMemo(() => {
    if (testimonials.length > 0) return testimonials;
    if (!testimonialsSection?.extraData) return null;
    const data = testimonialsSection.extraData;
    if (typeof data === 'object' && data !== null && 'testimonials' in data) {
      return (data as { testimonials: unknown }).testimonials;
    }
    return null;
  }, [testimonials, testimonialsSection]);

  const parsedFaq = useMemo(() => {
    if (faqs.length > 0) return faqs;
    if (!faqSection?.extraData) return null;
    const data = faqSection.extraData;
    if (typeof data === 'object' && data !== null && 'items' in data) {
      return (data as { items: unknown }).items;
    }
    return null;
  }, [faqs, faqSection]);

  return (
    <CurrencyProvider currencies={currencies} rates={exchangeRates}>
      <div className="bg-white">
        {/* Hero Section */}
        <HeroSection
          title={heroSection?.title}
          subtitle={heroSection?.subtitle}
          imageUrl={heroSection?.imageUrl}
          buttonLabel={heroSection?.buttonLabel}
          buttonUrl={heroSection?.buttonUrl}
          button2Label={heroSection?.button2Label}
          button2Url={heroSection?.button2Url}
        />

        {/* Dynamic Banners */}
        {banners.length > 0 && (
          <MainContainer className="py-4">
            <div className="flex gap-4 overflow-x-auto">
              {banners.map((banner) => (
                <Link key={banner.id} href={banner.buttonLink || '#'} className="shrink-0">
                  <Card className="border-gray-200 bg-white overflow-hidden hover:border-[#E5231B]/30 transition-colors">
                    {banner.imageUrl && (
                      <div className="aspect-[3/1] overflow-hidden">
                        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900">{banner.title}</h3>
                      {banner.description && <p className="text-sm text-gray-500 mt-1">{banner.description}</p>}
                      {banner.buttonText && (
                        <span className="inline-block mt-2 text-sm text-[#E5231B] font-medium">{banner.buttonText} →</span>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </MainContainer>
        )}

        {/* Quick Search */}
        <QuickSearch makes={makes} bodyTypes={bodyTypes} />

        {/* Vehicle Listings with Sidebar */}
        <MainContainer className="pt-6 pb-4 lg:pt-8 lg:pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_220px] gap-5 lg:gap-6 items-start">
            {/* Left Sidebar */}
            <MarketplaceSidebar filters={filters} onFilterChange={setFilters} makes={makes} />
            <div className="flex flex-col gap-6">
              {/* Compact Vehicle Cards — 6 per row */}
              {compact33.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {compact33.map((vehicle) => (
                    <WidgetVehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>
              )}
            </div>

            {/* Right Sidebar - Currency + Destination Country */}
            <aside className="hidden lg:flex flex-col gap-4">
              <CurrencySwitcher variant="sidebar" />
              <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Destination Country</h3>
                  {filters.destinationCountry && (
                    <button
                      onClick={() => setFilters({ ...filters, destinationCountry: '' })}
                      className="text-[11px] text-[#E5231B] hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <ContinentFilter
                  variant="sidebar"
                  selectedCountry={filters.destinationCountry}
                  onCountrySelect={(code) =>
                    setFilters({ ...filters, destinationCountry: filters.destinationCountry === code ? '' : code })
                  }
                  continents={continents}
                />
              </div>
            </aside>
          </div>
        </MainContainer>

        {/* Featured / Latest / Best Sellers — Full Width */}
        <MainContainer className="pb-6 lg:pb-8">
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
              <VehicleListingSection
                title="Best Sellers"
                description="Our most popular vehicles this month"
                vehicles={allVehicles.slice(0, 14)}
              />
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
                <VehicleListingSection
                  title="Best Sellers"
                  description="Our most popular vehicles this month"
                  vehicles={allVehicles.slice(0, 14)}
                />
              </>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <p className="text-gray-500">No vehicles match your current filters.</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria.</p>
              </div>
            )
          )}
        </MainContainer>

        {/* Why Choose Us + Statistics */}
        <MainContainer className="py-6 lg:py-8">
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

          {/* Testimonials — DB-driven */}
          {Array.isArray(parsedTestimonials) && parsedTestimonials.length > 0 && (
            <>
              <CustomerTestimonials
                title={testimonialsSection?.title}
                testimonials={parsedTestimonials}
              />
              <ChequeredDivider />
            </>
          )}

          {/* FAQs — DB-driven */}
          {Array.isArray(parsedFaq) && parsedFaq.length > 0 && (
            <>
              <FaqSection
                title={faqSection?.title}
                subtitle={faqSection?.subtitle}
                items={parsedFaq}
              />
              <ChequeredDivider />
            </>
          )}

          {/* Latest Blog Posts — DB-driven */}
          {latestBlogPosts.length > 0 && (
            <div className="py-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Latest from Our Blog</h2>
                  <p className="text-gray-500 mt-1 text-sm">News, guides, and updates about Japanese vehicle imports.</p>
                </div>
                <Link href="/blog" className="text-[#E5231B] hover:underline text-sm font-medium">View All →</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {latestBlogPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <Card className="border-gray-200 bg-white hover:border-gray-300 transition-colors h-full">
                      {post.featuredImageUrl && (
                        <div className="aspect-video overflow-hidden rounded-t-xl">
                          <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <CardContent className="p-5">
                        {post.category && <Badge variant="outline" className="mb-2 border-gray-200 text-gray-600">{post.category}</Badge>}
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                        {post.excerpt && <p className="text-gray-500 text-sm line-clamp-2">{post.excerpt}</p>}
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                          {post.author && <span>By {post.author}</span>}
                          {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString()}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA Banner */}
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
      </div>
    </CurrencyProvider>
  );
}
