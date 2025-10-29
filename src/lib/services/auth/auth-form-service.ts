/**
 * Auth Form Service
 * 
 * Handles authentication form logic extracted from login/signup components.
 * Manages form validation, submission, and user feedback.
 */

import { authService } from './auth-service';
import { getErrorMessage, logError } from '@/lib/errors';
import type { SignInCredentials, SignUpCredentials, User } from './types';

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface AuthFormResult {
  success: boolean;
  user?: User;
  error?: string;
  requiresEmailConfirmation?: boolean;
}

export interface NavigationHandler {
  push: (path: string) => void;
  replace: (path: string) => void;
  refresh: () => void;
}

export interface UserStateManager {
  setUser: (user: User | null) => void;
}

/**
 * Auth Form Service Class
 * Manages authentication form operations and validation
 */
export class AuthFormService {
  /**
   * Validate email format
   * @param email - Email to validate
   * @returns Validation result
   */
  validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns Validation result
   */
  validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters long' };
    }

    return { isValid: true };
  }

  /**
   * Validate sign-in form data
   * @param credentials - Sign-in credentials
   * @returns Validation result
   */
  validateSignInForm(credentials: SignInCredentials): FormValidationResult {
    const errors: Record<string, string> = {};

    const emailValidation = this.validateEmail(credentials.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error!;
    }

    const passwordValidation = this.validatePassword(credentials.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.error!;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate sign-up form data
   * @param credentials - Sign-up credentials
   * @returns Validation result
   */
  validateSignUpForm(credentials: SignUpCredentials): FormValidationResult {
    const errors: Record<string, string> = {};

    const emailValidation = this.validateEmail(credentials.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error!;
    }

    const passwordValidation = this.validatePassword(credentials.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.error!;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Handle sign-in form submission
   * @param credentials - Sign-in credentials
   * @param userStateManager - User state manager
   * @param navigator - Navigation handler
   * @param redirectTo - Optional redirect path after successful sign-in
   * @returns Promise resolving to auth result
   */
  async handleSignIn(
    credentials: SignInCredentials,
    userStateManager: UserStateManager,
    navigator: NavigationHandler,
    redirectTo: string = '/dashboard'
  ): Promise<AuthFormResult> {
    try {
      // Validate form data
      const validation = this.validateSignInForm(credentials);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        return {
          success: false,
          error: firstError
        };
      }

      // Attempt sign-in
      const result = await authService.signIn(credentials);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Sign-in failed'
        };
      }

      // Update user state
      if (result.user) {
        userStateManager.setUser(result.user);
      }

      // Navigate to success page
      navigator.push(redirectTo);

      return {
        success: true,
        user: result.user
      };

    } catch (error: unknown) {
      logError(error, 'Sign-in form submission error');
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Handle sign-up form submission
   * @param credentials - Sign-up credentials
   * @param userStateManager - User state manager
   * @param navigator - Navigation handler
   * @param redirectTo - Optional redirect path after successful sign-up
   * @returns Promise resolving to auth result
   */
  async handleSignUp(
    credentials: SignUpCredentials,
    userStateManager: UserStateManager,
    navigator: NavigationHandler,
    redirectTo: string = '/dashboard'
  ): Promise<AuthFormResult> {
    try {
      // Validate form data
      const validation = this.validateSignUpForm(credentials);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        return {
          success: false,
          error: firstError
        };
      }

      // Attempt sign-up
      const result = await authService.signUp(credentials);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Sign-up failed'
        };
      }

      // Check if email confirmation is required
      const requiresConfirmation = result.user && !result.session;

      if (requiresConfirmation) {
        return {
          success: true,
          user: result.user,
          requiresEmailConfirmation: true
        };
      }

      // Update user state if session is available
      if (result.user && result.session) {
        userStateManager.setUser(result.user);
        navigator.push(redirectTo);
      }

      return {
        success: true,
        user: result.user,
        requiresEmailConfirmation: false
      };

    } catch (error: unknown) {
      logError(error, 'Sign-up form submission error');
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Handle sign-out
   * @param userStateManager - User state manager
   * @param navigator - Navigation handler
   * @param redirectTo - Optional redirect path after sign-out
   * @returns Promise resolving to sign-out result
   */
  async handleSignOut(
    userStateManager: UserStateManager,
    navigator: NavigationHandler,
    redirectTo: string = '/'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await authService.signOut();

      if (result.success) {
        // Clear user state
        userStateManager.setUser(null);
        
        // Navigate to redirect page
        navigator.push(redirectTo);
        navigator.refresh(); // Refresh to update auth state
      }

      return result;

    } catch (error: unknown) {
      logError(error, 'Sign-out error');
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Handle password reset request
   * @param email - Email for password reset
   * @returns Promise resolving to reset result
   */
  async handlePasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const emailValidation = this.validateEmail(email);
      if (!emailValidation.isValid) {
        return {
          success: false,
          error: emailValidation.error
        };
      }

      // Note: This would typically call a password reset service
      // For now, we'll return a placeholder response
      return {
        success: true
      };

    } catch (error: unknown) {
      logError(error, 'Password reset error');
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }
}

// Export singleton instance
export const authFormService = new AuthFormService();