import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { MenusClient } from './client';

export const metadata: Metadata = {
  title: 'Menus | ZafAutos Admin',
};

export default async function MenusPage() {
  await requireAuth();
  return <MenusClient />;
}
