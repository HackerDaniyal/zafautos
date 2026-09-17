'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { HomepageContinent } from '@/lib/homepage-data';
import { getCountryFlagPath } from '@/lib/country-flags';

export interface Country {
  code: string;
  name: string;
  flag: string;
  count: number;
}

export interface Continent {
  id: string;
  name: string;
  countries: Country[];
}

interface ContinentFilterProps {
  continents?: HomepageContinent[];
  selectedCountry?: string;
  onCountrySelect?: (countryCode: string) => void;
  className?: string;
  variant?: 'default' | 'sidebar';
}

function CountryFlag({ src, name, slug, size = 40 }: { src: string; name?: string; slug?: string; size?: number }) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const resolvedSrc = src || (name ? getCountryFlagPath(name, slug) : null);
  if (!resolvedSrc || imgFailed) {
    return (
      <div className="w-[44px] h-[44px] rounded-full bg-gray-100 flex items-center justify-center">
        <Globe className="w-5 h-5 text-gray-400" />
      </div>
    );
  }
  return (
    <img
      src={resolvedSrc}
      alt=""
      width={size}
      height={size}
      className="rounded-full object-cover shadow-sm"
      loading="lazy"
      onError={() => setImgFailed(true)}
    />
  );
}

export function ContinentFilter({
  continents,
  selectedCountry,
  onCountrySelect,
  className,
  variant = 'default',
}: ContinentFilterProps) {
  const [activeCountry, setActiveCountry] = useState<string | undefined>(selectedCountry);

  const displayContinents: Continent[] = (continents ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    countries: c.countries.map((co) => ({
      code: co.slug,
      name: co.name,
      flag: co.flagImage || getCountryFlagPath(co.name, co.slug) || '',
      count: co.count,
    })),
  }));

  const handleSelect = (code: string) => {
    const newSelected = activeCountry === code ? undefined : code;
    setActiveCountry(newSelected);
    if (onCountrySelect) {
      onCountrySelect(newSelected || '');
    }
  };

  const isSidebar = variant === 'sidebar';

  return (
    <div className={cn('w-full', className)}>
      <Accordion
        type="single"
        collapsible
        className={cn(
          'w-full',
          isSidebar ? 'flex flex-col gap-2' : 'rounded-[6px] border border-gray-200 bg-white'
        )}
      >
        {displayContinents.map((continent) => {
          const countryCount = continent.countries.length;

          return (
            <AccordionItem
              key={continent.id}
              value={continent.id}
              className={cn(
                isSidebar
                  ? 'rounded-xl border border-gray-200 bg-white overflow-hidden'
                  : 'border-b border-gray-200 last:border-none px-3'
              )}
            >
              <AccordionTrigger
                className={cn(
                  'hover:no-underline transition-colors',
                  isSidebar
                    ? 'px-4 py-3 hover:text-[#E5231B]'
                    : 'font-[Oswald] uppercase tracking-wide hover:text-[#E5231B] py-3 text-lg'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={cn(
                    isSidebar
                      ? 'text-sm font-semibold text-gray-900'
                      : 'font-[Oswald] uppercase tracking-wide text-[#9A9A9A]'
                  )}>
                    {continent.name}
                  </span>
                  <span
                    className={cn(
                      isSidebar
                        ? 'flex items-center justify-center w-6 h-6 rounded-full bg-[#E5231B] text-white text-[10px] font-bold'
                        : 'text-[9px] font-sans tracking-normal font-semibold rounded-[3px] border text-gray-500 bg-gray-50 px-2 py-0.5 border-gray-200'
                    )}
                  >
                    {countryCount}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className={cn(isSidebar ? 'px-3 pb-3 pt-0' : 'pb-3 pt-1')}>
                <div
                  className={cn(
                    'grid gap-2',
                    isSidebar
                      ? 'grid-cols-2'
                      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
                  )}
                >
                  {continent.countries.map((country) => {
                    const isActive = activeCountry === country.code;
                    return (
                      <button
                        key={country.code}
                        onClick={() => handleSelect(country.code)}
                        className={cn(
                          'flex flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all duration-200',
                          isSidebar ? '' : '',
                          isActive
                            ? 'border-[#E5231B] bg-[#E5231B]/5 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        )}
                      >
                        {country.flag ? (
                          <CountryFlag src={country.flag} name={country.name} slug={country.code} size={44} />
                        ) : (
                          <div className="w-[44px] h-[44px] rounded-full bg-gray-100 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <span className={cn(
                          'text-xs font-semibold mt-2 leading-tight',
                          isActive ? 'text-[#E5231B]' : 'text-gray-800'
                        )}>
                          {country.name}
                        </span>
                        <span
                          className={cn(
                            'mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                            isActive
                              ? 'bg-[#E5231B] text-white'
                              : 'bg-green-500 text-white'
                          )}
                        >
                          {country.count} {country.count === 1 ? 'Car' : 'Cars'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
