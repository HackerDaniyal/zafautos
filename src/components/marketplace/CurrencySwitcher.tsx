import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag?: string;
}

const defaultCurrencies: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
];

interface CurrencySwitcherProps {
  currencies?: Currency[];
  selectedCurrency?: string;
  onCurrencyChange?: (currencyCode: string) => void;
  className?: string;
}

export function CurrencySwitcher({
  currencies = defaultCurrencies,
  selectedCurrency = 'USD',
  onCurrencyChange,
  className,
}: CurrencySwitcherProps) {
  const [active, setActive] = useState(selectedCurrency);

  const handleSelect = (code: string) => {
    setActive(code);
    if (onCurrencyChange) {
      onCurrencyChange(code);
    }
  };

  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4", className)}>
      {currencies.map((currency) => {
        const isActive = active === currency.code;
        return (
          <button
            key={currency.code}
            onClick={() => handleSelect(currency.code)}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all hover:shadow-md",
              isActive
                ? "border-primary bg-primary/5 text-primary shadow-sm"
                : "border-border bg-card text-card-foreground hover:border-primary/50"
            )}
            aria-pressed={isActive}
            aria-label={`Select ${currency.name}`}
          >
            <div className="mb-2 text-2xl">{currency.flag}</div>
            <div className="font-semibold">{currency.code}</div>
            <div className="text-xs text-muted-foreground mt-1 hidden sm:block">{currency.name}</div>
          </button>
        );
      })}
    </div>
  );
}
