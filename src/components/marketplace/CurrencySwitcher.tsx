"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { placeholderCurrencies } from '@/data/placeholderCurrencies';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag?: string;
}

interface CurrencySwitcherProps {
  currencies?: Currency[];
  selectedCurrency?: string;
  onCurrencyChange?: (currencyCode: string) => void;
  className?: string;
  variant?: 'default' | 'sidebar';
}

export function CurrencySwitcher({
  currencies = placeholderCurrencies,
  selectedCurrency = 'USD',
  onCurrencyChange,
  className,
  variant = 'default',
}: CurrencySwitcherProps) {
  const [active, setActive] = useState(selectedCurrency);

  const handleSelect = (code: string) => {
    setActive(code);
    if (onCurrencyChange) {
      onCurrencyChange(code);
    }
  };

  return (
    <div
      className={cn(
        'grid gap-2',
        variant === 'sidebar' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4 gap-4',
        className
      )}
    >
      {currencies.map((currency) => {
        const isActive = active === currency.code;
        return (
          <button
            key={currency.code}
            onClick={() => handleSelect(currency.code)}
            className={cn(
              'flex flex-col items-center justify-center rounded-[6px] border p-2.5 text-center transition-all duration-150',
              isActive
                ? 'border-[#E5231B]/50 bg-[#E5231B]/[0.08] text-[#FFFFFF] shadow-[0_0_0_1px_rgba(229,35,27,0.1)]'
                : 'border-[#222222] bg-[#111111] text-[#7A7A7A] hover:border-[#3D3D3D] hover:text-[#B8B8B8] hover:bg-[#141414]'
            )}
            aria-pressed={isActive}
            aria-label={`Select ${currency.name}`}
          >
            <div
              className={cn(
                'mb-1 transition-transform duration-150',
                variant === 'sidebar' ? 'text-lg' : 'text-2xl mb-2',
                isActive && 'scale-110'
              )}
            >
              {currency.flag}
            </div>
            <div
              className={cn(
                'font-[Oswald] uppercase font-bold tracking-wide transition-colors duration-150',
                variant === 'sidebar' ? 'text-[11px]' : 'text-sm',
                isActive ? 'text-[#FFFFFF]' : 'text-[#9A9A9A]'
              )}
            >
              {currency.code}
            </div>
            {variant === 'default' && (
              <div className="text-[10px] text-[#5A5A5A] mt-0.5 hidden sm:block">
                {currency.name}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
