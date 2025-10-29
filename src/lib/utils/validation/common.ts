/**
 * Common Validation Utilities
 * General-purpose validation functions used across the application
 */

/**
 * Check if a value is not null, undefined, or empty string
 * 
 * @param value - Value to check
 * @returns True if value is present, false otherwise
 */
export function isPresent(value: any): boolean {
  return value !== null && value !== undefined && value !== '';
}

/**
 * Check if a string is not empty after trimming
 * 
 * @param str - String to check
 * @returns True if string has content, false otherwise
 */
export function isNonEmptyString(str: any): str is string {
  return typeof str === 'string' && str.trim().length > 0;
}

/**
 * Check if a value is a valid number
 * 
 * @param value - Value to check
 * @returns True if value is a valid number, false otherwise
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Check if a value is a positive integer
 * 
 * @param value - Value to check
 * @returns True if value is a positive integer, false otherwise
 */
export function isPositiveInteger(value: any): value is number {
  return isValidNumber(value) && Number.isInteger(value) && value > 0;
}

/**
 * Check if a value is within a specified range
 * 
 * @param value - Value to check
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns True if value is within range, false otherwise
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return isValidNumber(value) && value >= min && value <= max;
}

/**
 * Check if a string matches a specific length requirement
 * 
 * @param str - String to check
 * @param minLength - Minimum length (default: 0)
 * @param maxLength - Maximum length (default: Infinity)
 * @returns True if string length is within bounds, false otherwise
 */
export function isValidLength(str: string, minLength: number = 0, maxLength: number = Infinity): boolean {
  if (!isNonEmptyString(str)) return minLength === 0;
  return str.length >= minLength && str.length <= maxLength;
}

/**
 * Check if an array has elements within specified bounds
 * 
 * @param arr - Array to check
 * @param minItems - Minimum number of items (default: 0)
 * @param maxItems - Maximum number of items (default: Infinity)
 * @returns True if array length is within bounds, false otherwise
 */
export function isValidArrayLength(arr: any[], minItems: number = 0, maxItems: number = Infinity): boolean {
  if (!Array.isArray(arr)) return false;
  return arr.length >= minItems && arr.length <= maxItems;
}

/**
 * Check if a value is one of the allowed options
 * 
 * @param value - Value to check
 * @param allowedValues - Array of allowed values
 * @returns True if value is in allowed list, false otherwise
 */
export function isAllowedValue<T>(value: any, allowedValues: T[]): value is T {
  return allowedValues.includes(value);
}

/**
 * Validate an object has required properties
 * 
 * @param obj - Object to validate
 * @param requiredProps - Array of required property names
 * @returns True if all required properties are present, false otherwise
 */
export function hasRequiredProperties(obj: any, requiredProps: string[]): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  return requiredProps.every(prop => isPresent(obj[prop]));
}

/**
 * Check if a date string is valid and within reasonable bounds
 * 
 * @param dateString - Date string to validate
 * @param minDate - Minimum allowed date (optional)
 * @param maxDate - Maximum allowed date (optional)
 * @returns True if date is valid and within bounds, false otherwise
 */
export function isValidDate(dateString: string, minDate?: Date, maxDate?: Date): boolean {
  if (!isNonEmptyString(dateString)) return false;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  
  if (minDate && date < minDate) return false;
  if (maxDate && date > maxDate) return false;
  
  return true;
}