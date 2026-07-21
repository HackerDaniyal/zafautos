import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes with conflict resolution.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a price value with currency symbol.
 * Uses Intl.NumberFormat for locale-aware formatting.
 */
export function formatPrice(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats mileage in kilometers with comma separators.
 */
export function formatMileage(km: number): string {
  return km.toLocaleString('en-US');
}

/**
 * Generates a placeholder image URL for a vehicle.
 */
export function vehiclePlaceholderImage(make: string, model: string, year: number): string {
  return `https://placehold.co/800x500/1A1A1A/E5231B?text=${encodeURIComponent(`${year}\n${make}\n${model}`)}`;
}
