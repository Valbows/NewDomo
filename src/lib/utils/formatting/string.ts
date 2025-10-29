/**
 * String Formatting Utilities
 * Functions for formatting and manipulating strings consistently
 */

/**
 * Capitalize the first letter of a string
 * 
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert string to title case (capitalize each word)
 * 
 * @param str - String to convert
 * @returns Title case string
 */
export function toTitleCase(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Convert camelCase or PascalCase to kebab-case
 * 
 * @param str - String to convert
 * @returns kebab-case string
 */
export function toKebabCase(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Convert kebab-case or snake_case to camelCase
 * 
 * @param str - String to convert
 * @returns camelCase string
 */
export function toCamelCase(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase());
}

/**
 * Convert string to snake_case
 * 
 * @param str - String to convert
 * @returns snake_case string
 */
export function toSnakeCase(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

/**
 * Truncate string to specified length with ellipsis
 * 
 * @param str - String to truncate
 * @param maxLength - Maximum length (default: 100)
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number = 100, suffix: string = '...'): string {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Remove extra whitespace and normalize spacing
 * 
 * @param str - String to normalize
 * @returns Normalized string
 */
export function normalizeWhitespace(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Extract initials from a name
 * 
 * @param name - Full name string
 * @param maxInitials - Maximum number of initials (default: 2)
 * @returns Initials string
 */
export function getInitials(name: string, maxInitials: number = 2): string {
  if (!name || typeof name !== 'string') return '';
  
  const words = normalizeWhitespace(name).split(' ');
  const initials = words
    .slice(0, maxInitials)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  
  return initials;
}

/**
 * Generate a slug from a string (URL-friendly)
 * 
 * @param str - String to convert to slug
 * @returns URL-friendly slug
 */
export function slugify(str: string): string {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Mask sensitive information (e.g., email, phone)
 * 
 * @param str - String to mask
 * @param visibleStart - Number of characters to show at start (default: 2)
 * @param visibleEnd - Number of characters to show at end (default: 2)
 * @param maskChar - Character to use for masking (default: '*')
 * @returns Masked string
 */
export function maskString(
  str: string, 
  visibleStart: number = 2, 
  visibleEnd: number = 2, 
  maskChar: string = '*'
): string {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= visibleStart + visibleEnd) return str;
  
  const start = str.slice(0, visibleStart);
  const end = str.slice(-visibleEnd);
  const maskLength = str.length - visibleStart - visibleEnd;
  const mask = maskChar.repeat(maskLength);
  
  return start + mask + end;
}

/**
 * Format a string as a phone number
 * 
 * @param phone - Phone number string
 * @param format - Format pattern (default: US format)
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string, format: string = '(###) ###-####'): string {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Apply format pattern
  let formatted = format;
  let digitIndex = 0;
  
  for (let i = 0; i < formatted.length && digitIndex < digits.length; i++) {
    if (formatted[i] === '#') {
      formatted = formatted.substring(0, i) + digits[digitIndex] + formatted.substring(i + 1);
      digitIndex++;
    }
  }
  
  return formatted.replace(/#/g, '');
}

/**
 * Pluralize a word based on count
 * 
 * @param word - Word to pluralize
 * @param count - Count to determine singular/plural
 * @param pluralForm - Custom plural form (optional)
 * @returns Pluralized word
 */
export function pluralize(word: string, count: number, pluralForm?: string): string {
  if (!word || typeof word !== 'string') return '';
  if (count === 1) return word;
  
  if (pluralForm) return pluralForm;
  
  // Simple pluralization rules
  if (word.endsWith('y')) {
    return word.slice(0, -1) + 'ies';
  } else if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
    return word + 'es';
  } else {
    return word + 's';
  }
}