import type { Metadata } from 'next';
import { SeoClient } from './client';

export const metadata: Metadata = { title: 'SEO | ZafAutos Admin' };

export default function SeoPage() {
  return <SeoClient />;
}
