import type { Metadata } from 'next';
import { CurrenciesClient } from './client';

export const metadata: Metadata = { title: 'Currencies | ZafAutos Admin' };

export default function CurrenciesPage() {
  return <CurrenciesClient />;
}
