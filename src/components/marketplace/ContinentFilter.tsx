import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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

const defaultContinents: Continent[] = [
  {
    id: 'africa',
    name: 'Africa',
    countries: [
      { code: 'gh', name: 'Ghana', flag: '🇬🇭', count: 124 },
      { code: 'ng', name: 'Nigeria', flag: '🇳🇬', count: 342 },
      { code: 'ke', name: 'Kenya', flag: '🇰🇪', count: 89 },
      { code: 'ug', name: 'Uganda', flag: '🇺🇬', count: 56 },
    ],
  },
  {
    id: 'europe',
    name: 'Europe',
    countries: [
      { code: 'uk', name: 'England', flag: '🇬🇧', count: 45 },
      { code: 'de', name: 'Germany', flag: '🇩🇪', count: 23 },
      { code: 'ie', name: 'Ireland', flag: '🇮🇪', count: 78 },
      { code: 'nl', name: 'Netherlands', flag: '🇳🇱', count: 12 },
    ],
  },
  {
    id: 'asia',
    name: 'Asia',
    countries: [
      { code: 'jp', name: 'Japan', flag: '🇯🇵', count: 1205 },
      { code: 'pk', name: 'Pakistan', flag: '🇵🇰', count: 430 },
      { code: 'ae', name: 'UAE', flag: '🇦🇪', count: 156 },
      { code: 'sa', name: 'Saudi Arabia', flag: '🇸🇦', count: 88 },
    ],
  },
  {
    id: 'america',
    name: 'America',
    countries: [
      { code: 'us', name: 'USA', flag: '🇺🇸', count: 45 },
      { code: 'ca', name: 'Canada', flag: '🇨🇦', count: 21 },
    ],
  },
  {
    id: 'oceania',
    name: 'Oceania',
    countries: [
      { code: 'au', name: 'Australia', flag: '🇦🇺', count: 234 },
      { code: 'nz', name: 'New Zealand', flag: '🇳🇿', count: 187 },
    ],
  },
];

interface ContinentFilterProps {
  continents?: Continent[];
  selectedCountry?: string;
  onCountrySelect?: (countryCode: string) => void;
  className?: string;
}

export function ContinentFilter({
  continents = defaultContinents,
  selectedCountry,
  onCountrySelect,
  className,
}: ContinentFilterProps) {
  const [activeCountry, setActiveCountry] = useState<string | undefined>(selectedCountry);

  const handleSelect = (code: string) => {
    const newSelected = activeCountry === code ? undefined : code;
    setActiveCountry(newSelected);
    if (onCountrySelect && newSelected) {
      onCountrySelect(newSelected);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <Accordion type="single" collapsible className="w-full bg-card rounded-lg border">
        {continents.map((continent) => (
          <AccordionItem key={continent.id} value={continent.id} className="border-b last:border-none px-4">
            <AccordionTrigger className="font-semibold text-lg hover:no-underline py-4">
              {continent.name}
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {continent.countries.map((country) => {
                  const isActive = activeCountry === country.code;
                  return (
                    <button
                      key={country.code}
                      onClick={() => handleSelect(country.code)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-md border text-left transition-colors hover:shadow-sm",
                        isActive
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-background text-card-foreground hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="text-xl shrink-0">{country.flag}</span>
                        <span className="text-sm font-medium truncate">{country.name}</span>
                      </div>
                      <span className={cn(
                        "ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                        isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {country.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
