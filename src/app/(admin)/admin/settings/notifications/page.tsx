import type { Metadata } from 'next';
import { NotificationsClient } from './client';

export const metadata: Metadata = { title: 'Notifications | ZafAutos Admin' };

export default function NotificationsPage() {
  return <NotificationsClient />;
}
