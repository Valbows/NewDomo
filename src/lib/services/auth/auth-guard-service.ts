/**
 * Auth Guard Service
 * 
 * Handles authentication guard logic extracted from withAuth HOC.
 * Manages route protection, authentication checks, and redirect logic.
 */

import { authService } from './auth-service';
import { getErrorMessage, logError } from '@/lib/errors';
import type { User } from './types';

export interface AuthGuardConfig {
  requireAuth?: boolean;
  redirectTo?: string;
  allowedRoles?: string[];
  checkInterval?: number;
}

export interface AuthGuardResult {
  isAllowed: boolean;
  user?: User;
  redirectTo?: string;
  error?: string;
}

export interface NavigationHandler {
  push: (path: string) => void;
  replace: (path: string) => void;
}

/**
 * Auth Guard Service Class
 * Manages authentication checks and route protection logic
 */
export class AuthGuardService {
  private config: AuthGuardConfig;

  constructor(config: AuthGuardConfig = {}) {
    this.config = {
      requireAuth: true,
      redirectTo: '/auth/sign-in',
      allowedRoles: [],
      checkInterval: 30000, // 30 seconds
      ...config
    };
  }

  /**
   * Check if user is authenticated and authorized
   * @param user - Current user object
   * @returns Promise resolving to guard result
   */
  async checkAccess(user: User | null): Promise<AuthGuardResult> {
    try {
      // If authentication is not required, allow access
      if (!this.config.requireAuth) {
        return { isAllowed: true, user: user || undefined };
      }

      // Check if user exists and is authenticated
      if (!user || !user.isAuthenticated) {
        return {
          isAllowed: false,
          redirectTo: this.config.redirectTo,
          error: 'Authentication required'
        };
      }

      // Check role-based access if roles are specified
      if (this.config.allowedRoles && this.config.allowedRoles.length > 0) {
        const hasRequiredRole = await this.checkUserRoles(user, this.config.allowedRoles);
        if (!hasRequiredRole) {
          return {
            isAllowed: false,
            redirectTo: '/unauthorized',
            error: 'Insufficient permissions'
          };
        }
      }

      // Verify session is still valid
      const sessionResult = await authService.getCurrentSession();
      if (!sessionResult.success || !sessionResult.session) {
        return {
          isAllowed: false,
          redirectTo: this.config.redirectTo,
          error: 'Session expired'
        };
      }

      return {
        isAllowed: true,
        user: sessionResult.session.user
      };

    } catch (error: unknown) {
      logError(error, 'Auth guard check error');
      return {
        isAllowed: false,
        redirectTo: this.config.redirectTo,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Check if user has required roles
   * @param user - User to check
   * @param requiredRoles - Required roles
   * @returns Promise resolving to role check result
   */
  private async checkUserRoles(user: User, requiredRoles: string[]): Promise<boolean> {
    // For now, implement a simple role check based on email
    // In a real application, this would check against a proper role system
    
    // Admin role check
    if (requiredRoles.includes('admin')) {
      return user.email.includes('admin') || user.email.includes('test');
    }

    // Default to allowing access if no specific role logic is implemented
    return true;
  }

  /**
   * Handle authentication redirect
   * @param navigator - Navigation handler
   * @param redirectTo - Redirect path
   */
  handleRedirect(navigator: NavigationHandler, redirectTo?: string): void {
    const targetPath = redirectTo || this.config.redirectTo || '/auth/sign-in';
    
    try {
      navigator.push(targetPath);
    } catch (error: unknown) {
      logError(error, 'Auth redirect error');
      // Fallback to window location if navigation fails
      if (typeof window !== 'undefined') {
        window.location.href = targetPath;
      }
    }
  }

  /**
   * Create a periodic authentication check
   * @param user - Current user
   * @param onAuthChange - Callback for auth state changes
   * @returns Cleanup function
   */
  createPeriodicCheck(
    user: User | null,
    onAuthChange: (result: AuthGuardResult) => void
  ): () => void {
    const interval = setInterval(async () => {
      const result = await this.checkAccess(user);
      if (!result.isAllowed) {
        onAuthChange(result);
      }
    }, this.config.checkInterval);

    return () => clearInterval(interval);
  }

  /**
   * Validate authentication for component mounting
   * @param user - Current user
   * @param navigator - Navigation handler
   * @returns Promise resolving to validation result
   */
  async validateForComponent(
    user: User | null,
    navigator: NavigationHandler
  ): Promise<{ shouldRender: boolean; user?: User }> {
    const result = await this.checkAccess(user);

    if (!result.isAllowed) {
      if (result.redirectTo) {
        this.handleRedirect(navigator, result.redirectTo);
      }
      return { shouldRender: false };
    }

    return {
      shouldRender: true,
      user: result.user
    };
  }

  /**
   * Create auth guard configuration for different protection levels
   */
  static createConfig(level: 'public' | 'protected' | 'admin'): AuthGuardConfig {
    switch (level) {
      case 'public':
        return {
          requireAuth: false
        };
      case 'protected':
        return {
          requireAuth: true,
          redirectTo: '/auth/sign-in'
        };
      case 'admin':
        return {
          requireAuth: true,
          redirectTo: '/auth/sign-in',
          allowedRoles: ['admin']
        };
      default:
        return {};
    }
  }
}

// Export singleton instances for common use cases
export const publicGuard = new AuthGuardService(AuthGuardService.createConfig('public'));
export const protectedGuard = new AuthGuardService(AuthGuardService.createConfig('protected'));
export const adminGuard = new AuthGuardService(AuthGuardService.createConfig('admin'));