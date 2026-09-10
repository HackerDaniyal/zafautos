import type { Metadata } from 'next';
import { CompanyClient } from './client';

export const metadata: Metadata = { title: 'Company | ZafAutos Admin' };

export default function CompanyPage() {
  return <CompanyClient />;
}
