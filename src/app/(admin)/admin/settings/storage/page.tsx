import type { Metadata } from 'next';
import { StorageClient } from './client';

export const metadata: Metadata = { title: 'Storage | ZafAutos Admin' };

export default function StoragePage() {
  return <StorageClient />;
}
