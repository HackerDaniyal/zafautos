import type { Metadata } from 'next';
import { TaxClient } from './client';

export const metadata: Metadata = { title: 'Tax | ZafAutos Admin' };

export default function TaxPage() {
  return <TaxClient />;
}
