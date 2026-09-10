import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { PageForm } from '../../page-form';

export const metadata: Metadata = {
  title: 'Edit Page | ZafAutos Admin',
};

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPagePage({ params }: EditPageProps) {
  await requireAuth();
  const { id } = await params;
  return <PageForm pageId={id} />;
}
