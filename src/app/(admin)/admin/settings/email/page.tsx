import type { Metadata } from 'next';
import { EmailClient } from './client';

export const metadata: Metadata = { title: 'Email | ZafAutos Admin' };

export default function EmailPage() {
  return <EmailClient />;
}
