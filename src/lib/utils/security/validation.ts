/**
 * Security Validation Utilities
 * Common validation functions for security-related operations
 */

/**
 * Validate email format using RFC 5322 compliant regex
 * 
 * @param email - Email address to validate
 * @returns True if email format is valid, false otherwise
 */
export function validateEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // RFC 5322 compliant email regex (simplified but robust)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email) && email.length <= 254; // RFC 5321 length limit
}

/**
 * Validate UUID format (v4)
 * 
 * @param uuid - UUID string to validate
 * @returns True if UUID format is valid, false otherwise
 */
export function validateUuidFormat(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate URL format and protocol
 * 
 * @param url - URL string to validate
 * @param allowedProtocols - Array of allowed protocols (default: ['http:', 'https:'])
 * @returns True if URL format is valid, false otherwise
 */
export function validateUrlFormat(url: string, allowedProtocols: string[] = ['http:', 'https:']): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return allowedProtocols.includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize string input to prevent XSS attacks
 * 
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate password strength
 * 
 * @param password - Password to validate
 * @returns Object with validation result and requirements
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
} {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      requirements: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
      }
    };
  }

  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const isValid = Object.values(requirements).every(req => req);

  return { isValid, requirements };
}

/**
 * Validate phone number format (international)
 * 
 * @param phone - Phone number to validate
 * @returns True if phone format is valid, false otherwise
 */
export function validatePhoneFormat(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  // International phone number regex (E.164 format)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  
  // Remove common formatting characters
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  
  return phoneRegex.test(cleanPhone);
}

/**
 * Validate JSON string format
 * 
 * @param jsonString - JSON string to validate
 * @returns True if JSON is valid, false otherwise
 */
export function validateJsonFormat(jsonString: string): boolean {
  if (!jsonString || typeof jsonString !== 'string') return false;
  
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}