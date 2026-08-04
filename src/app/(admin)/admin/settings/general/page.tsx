import type { Metadata } from 'next';
import { GeneralSettingsClient } from './client';

export const metadata: Metadata = { title: 'General Settings | ZafAutos Admin' };

export default function GeneralSettingsPage() {
  return <GeneralSettingsClient />;
}
