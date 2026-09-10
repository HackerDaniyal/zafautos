"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CurrencySwitcherProps {
  className?: string;
  variant?: 'default' | 'sidebar';
}

function FlagIcon({ countryCode, size = 20 }: { countryCode: string; size?: number }) {
  return (
    <img
      src={`/flags/${countryCode}.svg`}
      alt=""
      width={size}
      height={size}
      className="rounded-full object-cover"
      loading="lazy"
    />
  );
}

const CURRENCY_FLAG_CODES: Record<string, string> = {
  USD: 'us', JPY: 'jp', EUR: 'eu', GBP: 'gb', AUD: 'au', CAD: 'ca',
  CHF: 'ch', CNY: 'cn', KRW: 'kr', NZD: 'nz', INR: 'in', AED: 'ae',
  SGD: 'sg', MYR: 'my', THB: 'th', SAR: 'sa', QAR: 'qa', KWD: 'kw',
  BHD: 'bh', OMR: 'om', PKR: 'pk', BDT: 'bd', PHP: 'ph',
};

export function CurrencySwitcher({ className, variant = 'default' }: CurrencySwitcherProps) {
  const { selectedCurrency, currencies, setSelectedCurrency } = useCurrency();

  const activeCurrencies = currencies.filter((c) => c.code);

  const handleSelect = (code: string) => {
    setSelectedCurrency(code);
  };

  if (variant === 'sidebar') {
    return (
      <div className={cn('rounded-xl bg-white p-4 shadow-sm border border-gray-200', className)}>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Currency</h3>
        <div className="grid grid-cols-2 gap-2">
          {activeCurrencies.length === 0 && (
            <p className="col-span-full text-center text-[11px] text-gray-400 py-2">
              No currencies configured
            </p>
          )}
          {activeCurrencies.map((currency) => {
            const isActive = selectedCurrency === currency.code;
            const flagCode = CURRENCY_FLAG_CODES[currency.code] ?? '';
            return (
              <button
                key={currency.code}
                onClick={() => handleSelect(currency.code)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-150',
                  isActive
                    ? 'border-[#E5231B] bg-red-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                )}
                aria-pressed={isActive}
                aria-label={`Select ${currency.name}`}
              >
                {flagCode && (
                  <FlagIcon countryCode={flagCode} size={18} />
                )}
                <span className={cn(
                  'text-xs font-bold',
                  isActive ? 'text-[#E5231B]' : 'text-gray-700'
                )}>
                  {currency.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
      <h3 className="text-base font-semibold text-gray-900 mb-3">Currency</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {activeCurrencies.length === 0 && (
          <p className="col-span-full text-center text-sm text-gray-400 py-4">
            No currencies configured
          </p>
        )}
        {activeCurrencies.map((currency) => {
          const isActive = selectedCurrency === currency.code;
          const flagCode = CURRENCY_FLAG_CODES[currency.code] ?? '';
          return (
            <button
              key={currency.code}
              onClick={() => handleSelect(currency.code)}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all duration-200',
                isActive
                  ? 'border-[#E5231B] bg-[#E5231B] text-white shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              )}
              aria-pressed={isActive}
              aria-label={`Select ${currency.name}`}
            >
              {flagCode && (
                <FlagIcon countryCode={flagCode} size={28} />
              )}
              <span className={cn(
                'text-sm font-bold mt-1.5',
                isActive ? 'text-white' : 'text-gray-900'
              )}>
                {currency.code}
              </span>
              <span className={cn(
                'text-base font-bold',
                isActive ? 'text-white/80' : 'text-gray-500'
              )}>
                {currency.symbol}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
