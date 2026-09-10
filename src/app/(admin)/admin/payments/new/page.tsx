import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { Suspense } from 'react';
import { PaymentFormPage } from '../components/payment-form-page';

export const metadata: Metadata = {
  title: 'Record Payment | ZafAutos Admin',
};

export default async function NewPaymentPage() {
  await requireAuth();
  return (
    <Suspense>
      <PaymentFormPage />
    </Suspense>
  );
}
