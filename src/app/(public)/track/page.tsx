import type { Metadata } from 'next';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { TrackOrderClient } from './client';

export const metadata: Metadata = {
  title: 'Track Your Order | ZafAutos',
  description: 'Track your ZafAutos order status, payment, and shipment details.',
};

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-obsidian">
      <PublicNavbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <TrackOrderClient />
      </main>
      <PublicFooter />
    </div>
  );
}
