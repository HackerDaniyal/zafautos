'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { HomepageCurrency } from '@/lib/homepage-data';

const STORAGE_KEY = 'zaf_selected_currency';

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

const FALLBACK_CURRENCY = { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 1 } as HomepageCurrency;
const FALLBACK_RATES: Record<string, number> = { USD: 1 };

const fallbackValue: CurrencyContextValue = {
  selectedCurrency: 'USD',
  currencies: [FALLBACK_CURRENCY],
  rates: FALLBACK_RATES,
  setSelectedCurrency: () => {},
  convertPrice: (basePrice: number) => basePrice,
  formatConvertedPrice: (basePrice: number) => `$${basePrice.toLocaleString('en-US')}`,
};

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  return ctx ?? fallbackValue;
}

function readPersistedCurrency(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistCurrency(code: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore
  }
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
  const [selectedCurrency, setSelectedCurrencyState] = useState(defaultCurrency);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    const persisted = readPersistedCurrency();
    if (persisted && persisted !== defaultCurrency) {
      // Verify the persisted currency exists in available currencies
      if (currencies.some((c) => c.code === persisted)) {
        setSelectedCurrencyState(persisted);
      }
    }
    setHydrated(true);
  }, [currencies, defaultCurrency]);

  const setSelectedCurrency = useCallback((code: string) => {
    setSelectedCurrencyState(code);
    persistCurrency(code);
  }, []);

  const convertPrice = useCallback(
    (basePrice: number, baseCurrency: string = 'USD'): number => {
      if (baseCurrency === selectedCurrency) return basePrice;
      const fromRate = rates[baseCurrency];
      const toRate = rates[selectedCurrency];
      if (!fromRate || !toRate || fromRate === 0) return basePrice;
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
    [selectedCurrency, currencies, rates, setSelectedCurrency, convertPrice, formatConvertedPrice],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
