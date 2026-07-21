'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { placeholderCountries } from '@/data/placeholderCountries';

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
  continents?: Continent[];
  selectedCountry?: string;
  onCountrySelect?: (countryCode: string) => void;
  className?: string;
  variant?: 'default' | 'sidebar';
}

export function ContinentFilter({
  continents = placeholderCountries,
  selectedCountry,
  onCountrySelect,
  className,
  variant = 'default',
}: ContinentFilterProps) {
  const [activeCountry, setActiveCountry] = useState<string | undefined>(selectedCountry);

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
          isSidebar ? 'flex flex-col gap-1' : 'rounded-[6px] border border-iron bg-carbon'
        )}
      >
        {continents.map((continent) => {
          const totalCount = continent.countries.reduce(
            (sum, c) => sum + c.count,
            0
          );

          return (
            <AccordionItem
              key={continent.id}
              value={continent.id}
              className={cn(
                isSidebar
                  ? 'rounded-[6px] border border-[#222222] bg-[#111111] px-2.5 overflow-hidden'
                  : 'border-b border-iron/50 last:border-none px-3'
              )}
            >
              <AccordionTrigger
                className={cn(
                  'font-[Oswald] uppercase tracking-wide hover:no-underline hover:text-[#E5231B] transition-colors',
                  isSidebar ? 'py-2 text-[10px] tracking-[0.12em]' : 'py-3 text-lg'
                )}
              >
                <div className="flex items-center justify-between w-full pr-2">
                  <span className={cn(isSidebar && 'text-[#9A9A9A]')}>
                    {continent.name}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] font-sans tracking-normal font-semibold rounded-[3px] border',
                      isSidebar
                        ? 'text-[#5A5A5A] bg-[#0E0E0E] border-[#222222] px-1.5 py-[1px]'
                        : 'text-steel bg-deep-carbon px-2 py-0.5 border-iron/50'
                    )}
                  >
                    {totalCount}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className={cn(isSidebar ? 'pb-2 pt-1' : 'pb-3 pt-1')}>
                <div
                  className={cn(
                    'grid gap-1.5 pr-1',
                    isSidebar
                      ? 'grid-cols-1 max-h-[200px] overflow-y-auto scrollbar-thin'
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
                          'flex items-center justify-between rounded-[4px] border text-left transition-all duration-150',
                          isSidebar ? 'p-[7px] px-2' : 'p-2',
                          isActive
                            ? 'border-[#E5231B]/40 bg-[#E5231B]/[0.08] text-[#FFFFFF]'
                            : 'border-transparent bg-[#0E0E0E] hover:border-[#2A2A2A] hover:bg-[#141414] text-[#9A9A9A]'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={cn(isSidebar ? 'text-base' : 'text-lg')}>
                            {country.flag}
                          </span>
                          <span
                            className={cn(
                              'font-medium truncate',
                              isSidebar ? 'text-[10px]' : 'text-xs'
                            )}
                          >
                            {country.name}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'ml-2 shrink-0 rounded-[3px] font-semibold',
                            isSidebar
                              ? 'px-1.5 py-[1px] text-[8px]'
                              : 'rounded-full px-1.5 py-0.5 text-[10px]',
                            isActive
                              ? 'bg-[#E5231B]/15 text-[#E5231B]'
                              : 'text-[#5A5A5A]'
                          )}
                        >
                          {country.count}
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
