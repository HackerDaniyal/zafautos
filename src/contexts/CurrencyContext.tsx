'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { HomepageCurrency } from '@/lib/homepage-data';

interface CurrencyState {
  selectedCurrency: string;
  currencies: HomepageCurrency[];
  rates: Record<string, number>;
}

interface CurrencyContextValue extends CurrencyState {
  setSelectedCurrency: (code: string) => void;
  convertPrice: (basePrice: number, baseCurrency?: string) => number;
  formatConvertedPrice: (basePrice: number, baseCurrency?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

interface CurrencyProviderProps {
  children: React.ReactNode;
  currencies: HomepageCurrency[];
  rates: Record<string, number>;
  defaultCurrency?: string;
}

export function CurrencyProvider({
  children,
  currencies,
  rates,
  defaultCurrency = 'USD',
}: CurrencyProviderProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency);

  const convertPrice = useCallback(
    (basePrice: number, baseCurrency: string = 'USD'): number => {
      if (baseCurrency === selectedCurrency) return basePrice;
      const fromRate = rates[baseCurrency];
      const toRate = rates[selectedCurrency];
      if (!fromRate || !toRate || fromRate === 0) return basePrice;
      // Convert: basePrice / fromRate gives USD value, * toRate gives target
      return Math.round((basePrice / fromRate) * toRate);
    },
    [selectedCurrency, rates],
  );

  const formatConvertedPrice = useCallback(
    (basePrice: number, baseCurrency: string = 'USD'): string => {
      const converted = convertPrice(basePrice, baseCurrency);
      const currency = currencies.find((c) => c.code === selectedCurrency);
      const symbol = currency?.symbol ?? selectedCurrency;
      return symbol + converted.toLocaleString('en-US');
    },
    [convertPrice, currencies, selectedCurrency],
  );

  const value = useMemo(
    () => ({
      selectedCurrency,
      currencies,
      rates,
      setSelectedCurrency,
      convertPrice,
      formatConvertedPrice,
    }),
    [selectedCurrency, currencies, rates, convertPrice, formatConvertedPrice],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
