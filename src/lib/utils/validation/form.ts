/**
 * Form Validation Utilities
 * Validation functions specifically for form inputs and user data
 */

import { isNonEmptyString, isValidLength } from './common';

export interface FormValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email format using RFC 5322 compliant regex
 * 
 * @param email - Email address to validate
 * @returns Validation result
 */
export function validateEmail(email: string): FormValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(email)) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  // RFC 5322 compliant email regex (simplified but robust)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  if (email.length > 254) { // RFC 5321 length limit
    errors.push('Email address is too long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate password strength
 * 
 * @param password - Password to validate
 * @param minLength - Minimum password length (default: 8)
 * @returns Validation result with detailed requirements
 */
export function validatePassword(password: string, minLength: number = 8): FormValidationResult & {
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
} {
  const errors: string[] = [];

  if (!isNonEmptyString(password)) {
    errors.push('Password is required');
    return {
      isValid: false,
      errors,
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
    minLength: password.length >= minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  if (!requirements.minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!requirements.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!requirements.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!requirements.hasNumber) {
    errors.push('Password must contain at least one number');
  }
  if (!requirements.hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
    requirements,
  };
}

/**
 * Validate name field (first name, last name, etc.)
 * 
 * @param name - Name to validate
 * @param fieldName - Name of the field for error messages
 * @param minLength - Minimum length (default: 1)
 * @param maxLength - Maximum length (default: 50)
 * @returns Validation result
 */
export function validateName(
  name: string, 
  fieldName: string = 'Name', 
  minLength: number = 1, 
  maxLength: number = 50
): FormValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(name)) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  if (!isValidLength(name, minLength, maxLength)) {
    errors.push(`${fieldName} must be between ${minLength} and ${maxLength} characters`);
  }

  // Check for valid name characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) {
    errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phone number format
 * 
 * @param phone - Phone number to validate
 * @param required - Whether phone number is required (default: false)
 * @returns Validation result
 */
export function validatePhone(phone: string, required: boolean = false): FormValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(phone)) {
    if (required) {
      errors.push('Phone number is required');
    }
    return { isValid: !required, errors };
  }

  // Remove common formatting characters
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // International phone number regex (E.164 format)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  
  if (!phoneRegex.test(cleanPhone)) {
    errors.push('Invalid phone number format. Use international format (e.g., +1234567890)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate URL format
 * 
 * @param url - URL to validate
 * @param required - Whether URL is required (default: false)
 * @param allowedProtocols - Allowed protocols (default: ['http:', 'https:'])
 * @returns Validation result
 */
export function validateUrl(
  url: string, 
  required: boolean = false, 
  allowedProtocols: string[] = ['http:', 'https:']
): FormValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(url)) {
    if (required) {
      errors.push('URL is required');
    }
    return { isValid: !required, errors };
  }

  try {
    const urlObj = new URL(url);
    if (!allowedProtocols.includes(urlObj.protocol)) {
      errors.push(`URL must use one of these protocols: ${allowedProtocols.join(', ')}`);
    }
  } catch {
    errors.push('Invalid URL format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate text field with length constraints
 * 
 * @param text - Text to validate
 * @param fieldName - Name of the field for error messages
 * @param minLength - Minimum length (default: 0)
 * @param maxLength - Maximum length (default: 1000)
 * @param required - Whether field is required (default: false)
 * @returns Validation result
 */
export function validateText(
  text: string,
  fieldName: string = 'Text',
  minLength: number = 0,
  maxLength: number = 1000,
  required: boolean = false
): FormValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(text)) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
    return { isValid: !required, errors };
  }

  if (!isValidLength(text, minLength, maxLength)) {
    if (minLength > 0) {
      errors.push(`${fieldName} must be between ${minLength} and ${maxLength} characters`);
    } else {
      errors.push(`${fieldName} must be no more than ${maxLength} characters`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}