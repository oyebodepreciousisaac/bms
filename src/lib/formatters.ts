import { bakeryBranding } from '../config/branding.config';

/**
 * Formats a numeric amount to Nigerian Naira (or configured currency)
 */
export function formatCurrency(amount: number): string {
  return `${bakeryBranding.currency.symbol}${amount.toLocaleString(bakeryBranding.currency.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats integer quantity with thousand separators
 */
export function formatQuantity(quantity: number, unit = 'loaves'): string {
  return `${quantity.toLocaleString()} ${unit}`;
}

/**
 * Formats date string into readable short format (e.g., 29 Oct 2026)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats date and time (e.g., 29 Oct 2026, 09:30 AM)
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

