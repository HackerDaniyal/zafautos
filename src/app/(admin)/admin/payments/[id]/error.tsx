'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentError() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <p className="text-lg font-medium text-pure-white">Payment not found</p>
      <p className="mt-2 text-sm text-ash">The requested payment does not exist.</p>
      <Button asChild className="mt-4">
        <Link href="/admin/payments">
          <ArrowLeft className="mr-2 size-4" />
          Back to Payments
        </Link>
      </Button>
    </div>
  );
}