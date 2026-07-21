import { Continent, Country } from '@/components/marketplace/ContinentFilter';

export const placeholderCountries: Continent[] = [
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
