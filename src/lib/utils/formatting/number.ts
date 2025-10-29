/**
 * Number Formatting Utilities
 * Functions for formatting numbers, currencies, and percentages
 */

/**
 * Format a number with thousands separators
 * 
 * @param num - Number to format
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted number string
 */
export function formatNumber(num: number, locale: string = 'en-US'): string {
  if (!Number.isFinite(num)) return '0';
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format a number as currency
 * 
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string {
  if (!Number.isFinite(amount)) return '$0.00';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format a number as percentage
 * 
 * @param value - Value to format (0.5 = 50%)
 * @param decimals - Number of decimal places (default: 1)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number, 
  decimals: number = 1, 
  locale: string = 'en-US'
): string {
  if (!Number.isFinite(value)) return '0%';
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format file size in bytes to human-readable format
 * 
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format a number with compact notation (1.2K, 1.5M, etc.)
 * 
 * @param num - Number to format
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Compact formatted number string
 */
export function formatCompactNumber(num: number, locale: string = 'en-US'): string {
  if (!Number.isFinite(num)) return '0';
  
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
}

/**
 * Format a number with ordinal suffix (1st, 2nd, 3rd, etc.)
 * 
 * @param num - Number to format
 * @returns Number with ordinal suffix
 */
export function formatOrdinal(num: number): string {
  if (!Number.isInteger(num)) return num.toString();
  
  const absNum = Math.abs(num);
  const lastDigit = absNum % 10;
  const lastTwoDigits = absNum % 100;
  
  let suffix = 'th';
  
  if (lastTwoDigits < 11 || lastTwoDigits > 13) {
    switch (lastDigit) {
      case 1:
        suffix = 'st';
        break;
      case 2:
        suffix = 'nd';
        break;
      case 3:
        suffix = 'rd';
        break;
    }
  }
  
  return `${num}${suffix}`;
}

/**
 * Round a number to specified decimal places
 * 
 * @param num - Number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 */
export function roundToDecimals(num: number, decimals: number = 2): number {
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Clamp a number between min and max values
 * 
 * @param num - Number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped number
 */
export function clamp(num: number, min: number, max: number): number {
  if (!Number.isFinite(num)) return min;
  return Math.min(Math.max(num, min), max);
}

/**
 * Generate a random number between min and max (inclusive)
 * 
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random number
 */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate a random integer between min and max (inclusive)
 * 
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer
 */
export function randomIntBetween(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}