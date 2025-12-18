/**
 * BuildSight Utility Functions - Formatters
 */

import { CountryCode } from '@/constants/countries';

/**
 * Locale mapping by country code for proper number/currency formatting
 */
const COUNTRY_LOCALE_MAP: Record<CountryCode, string> = {
  DE: 'de-DE',
  FR: 'fr-FR',
  ES: 'es-ES',
  IT: 'it-IT',
  NL: 'nl-NL',
  BE: 'nl-BE',
  AT: 'de-AT',
  UK: 'en-GB',
  US: 'en-US',
  BR: 'pt-BR',
};

/**
 * Get locale string for a country code
 */
export function getLocaleForCountry(country: CountryCode): string {
  return COUNTRY_LOCALE_MAP[country] || 'de-DE';
}

/**
 * Format currency with country-aware locale (no decimals)
 * Example: formatCurrency(45000, 'EUR', 'DE') -> "45.000 €"
 * Example: formatCurrency(45000, 'USD', 'US') -> "$45,000"
 */
export function formatCurrency(amount: number, currency: string = 'EUR', country?: CountryCode): string {
  const locale = country ? getLocaleForCountry(country) : 'de-DE';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with country-aware locale
 */
export function formatNumber(value: number, country?: CountryCode): string {
  const locale = country ? getLocaleForCountry(country) : 'de-DE';
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format date for display
 * Example: "2025-01-15" -> "Jan 15, 2025"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Format percentage
 * Example: 65 -> "65%"
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Format relative time
 * Example: returns "2 hours ago", "3 days ago", etc.
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(dateString);
}

/**
 * Format phone number
 * Example: "1234567890" -> "(123) 456-7890"
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  return phone;
}

/**
 * Format square footage
 * Example: 1500 -> "1,500 sq ft"
 */
export function formatSquareFootage(sqft: number): string {
  return `${new Intl.NumberFormat('en-US').format(sqft)} sq ft`;
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Truncate text with ellipsis
 * Example: truncateText("Hello World", 5) -> "Hello..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}
