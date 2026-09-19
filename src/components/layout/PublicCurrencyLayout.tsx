'use client';

import React from 'react';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import type { HomepageCurrency } from '@/lib/homepage-data';

interface PublicCurrencyLayoutProps {
  children: React.ReactNode;
  currencies: HomepageCurrency[];
  rates: Record<string, number>;
  defaultCurrency?: string;
}

export function PublicCurrencyLayout({
  children,
  currencies,
  rates,
  defaultCurrency = 'USD',
}: PublicCurrencyLayoutProps) {
  return (
    <CurrencyProvider currencies={currencies} rates={rates} defaultCurrency={defaultCurrency}>
      {children}
    </CurrencyProvider>
  );
}
