/**
 * Site metadata constants used across layouts and SEO tags.
 */
export const siteConfig = {
  name: 'Zaf Autos Japan',
  description:
    'Premium Japanese vehicle export platform. Browse, enquire, purchase, and track imported vehicles from Japan.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ogImage: '/og-image.jpg',
  keywords: [
    'Japanese cars',
    'vehicle import',
    'Japan export',
    'used cars Japan',
    'JDM vehicles',
    'car marketplace',
    'vehicle shipping',
    'Zaf Autos',
  ],
  authors: [{ name: 'Zaf Autos Japan' }],
  creator: 'Zaf Autos Japan',
} as const;
