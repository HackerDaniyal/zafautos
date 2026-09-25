'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

const CURRENCY_FLAG_CODES: Record<string, string> = {
  USD: 'us', JPY: 'jp', EUR: 'eu', GBP: 'gb', AUD: 'au', CAD: 'ca',
  CHF: 'ch', CNY: 'cn', KRW: 'kr', NZD: 'nz', INR: 'in', AED: 'ae',
  SGD: 'sg', MYR: 'my', THB: 'th', SAR: 'sa', QAR: 'qa', KWD: 'kw',
  BHD: 'bh', OMR: 'om', PKR: 'pk', BDT: 'bd', PHP: 'ph',
};

export function NavbarCurrencySwitcher() {
  const { selectedCurrency, currencies, setSelectedCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeCurrencies = currencies.filter((c) => c.code);
  const current = activeCurrencies.find((c) => c.code === selectedCurrency);
  const flagCode = CURRENCY_FLAG_CODES[selectedCurrency] ?? '';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (activeCurrencies.length <= 1) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-white/20 px-2.5 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:border-white/40 transition-colors"
        aria-label="Select currency"
      >
        {flagCode && (
          <img
            src={`/flags/${flagCode}.svg`}
            alt=""
            width={16}
            height={16}
            className="rounded-full"
          />
        )}
        <span className="font-semibold">{selectedCurrency}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 max-w-[calc(100vw-1rem)] rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="max-h-64 overflow-y-auto py-1">
            {activeCurrencies.map((currency) => {
              const isActive = currency.code === selectedCurrency;
              const fc = CURRENCY_FLAG_CODES[currency.code] ?? '';
              return (
                <button
                  key={currency.code}
                  onClick={() => {
                    setSelectedCurrency(currency.code);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm transition-colors',
                    isActive
                      ? 'bg-signal-red/5 text-signal-red font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {fc && (
                    <img
                      src={`/flags/${fc}.svg`}
                      alt=""
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  )}
                  <span className="flex-1">{currency.code}</span>
                  <span className="text-xs text-gray-400">{currency.symbol}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
