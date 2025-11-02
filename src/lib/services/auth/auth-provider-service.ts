/**
 * Auth Provider Service
 * 
 * Handles authentication state management logic extracted from AuthProvider component.
 * Manages session initialization, auth state changes, and E2E test mode handling.
 */

import { authService } from './auth-service';
import { getErrorMessage, logError } from '@/lib/errors';
import type { User, AuthSession } from './types';

export interface AuthStateChangeEvent {
  event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED';
  session: AuthSession | null;
  user: User | null;
}

export interface AuthProviderConfig {
  isE2EMode?: boolean;
  enableLogging?: boolean;
}

export interface AuthStateManager {
  setUser: (user: User | null) => void;
  getUser: () => User | null;
}

/**
 * Auth Provider Service Class
 * Manages authentication state and session lifecycle
 */
export class AuthProviderService {
  private config: AuthProviderConfig;
  private stateManager: AuthStateManager | null = null;
  private authStateUnsubscribe: (() => void) | null = null;

  constructor(config: AuthProviderConfig = {}) {
    this.config = {
      isE2EMode: process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true',
      enableLogging: process.env.NODE_ENV === 'development', // Only log in development
      ...config
    };
  }

  /**
   * Initialize authentication state management
   * @param stateManager - State management interface
   */
  setStateManager(stateManager: AuthStateManager): void {
    this.stateManager = stateManager;
  }

  /**
   * Initialize authentication state
   * Sets up initial session and auth state change listeners
   */
  async initialize(): Promise<void> {
    if (!this.stateManager) {
      throw new Error('State manager must be set before initialization');
    }

    this.log('🚀 AuthProviderService initializing');

    // Handle E2E test mode
    if (this.config.isE2EMode) {
      this.log('🧪 E2E mode enabled - setting test user');
      this.stateManager.setUser({
        id: 'e2e-user',
        email: 'e2e@example.com',
        isAuthenticated: true
      });
      return;
    }

    try {
      // Get initial session
      await this.loadInitialSession();
      
      // Set up auth state change listener
      this.setupAuthStateListener();

    } catch (error: unknown) {
      logError(error, 'AuthProviderService initialization error');
      this.log('❌ AuthProviderService initialization failed:', getErrorMessage(error));
    }
  }

  /**
   * Load initial session on startup
   */
  private async loadInitialSession(): Promise<void> {
    this.log('🔑 Loading initial session');
    
    const sessionResult = await authService.getCurrentSession();
    
    if (sessionResult.success && sessionResult.session) {
      this.log('✅ Initial session found');
      this.stateManager!.setUser(sessionResult.session.user);
    } else {
      this.log('ℹ️ No initial session found');
      if (sessionResult.error) {
        this.log('⚠️ Session load error:', sessionResult.error);
      }
    }
  }

  /**
   * Set up authentication state change listener
   * Note: This is a simplified version. In a real implementation,
   * you would use Supabase's onAuthStateChange or similar
   */
  private setupAuthStateListener(): void {
    this.log('👂 Setting up auth state listener');
    
    // This is a placeholder for the actual auth state change listener
    // In the real implementation, this would use Supabase's onAuthStateChange
    // For now, we'll create a simple polling mechanism for demonstration
    
    // The actual implementation would look like:
    // const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    //   this.handleAuthStateChange(event, session);
    // });
    // this.authStateUnsubscribe = () => authListener.subscription.unsubscribe();
  }

  /**
   * Handle authentication state changes
   * @param event - Auth state change event type
   * @param session - New session data
   */
  private handleAuthStateChange(event: string, session: any): void {
    this.log(`🔄 Auth state change: ${event}`);
    
    if (!this.stateManager) {
      this.log('⚠️ No state manager available for auth state change');
      return;
    }

    if (session && session.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        isAuthenticated: true,
        createdAt: session.user.created_at,
        updatedAt: session.user.updated_at
      };
      
      this.stateManager.setUser(user);
      this.log('✅ User authenticated:', user.email);
    } else {
      this.stateManager.setUser(null);
      this.log('🚪 User signed out');
    }
  }

  /**
   * Manually refresh authentication state
   */
  async refreshAuthState(): Promise<void> {
    this.log('🔄 Manually refreshing auth state');
    
    if (!this.stateManager) {
      throw new Error('State manager not available');
    }

    try {
      const sessionResult = await authService.getCurrentSession();
      
      if (sessionResult.success && sessionResult.session) {
        this.stateManager.setUser(sessionResult.session.user);
        this.log('✅ Auth state refreshed successfully');
      } else {
        this.stateManager.setUser(null);
        this.log('ℹ️ No active session found during refresh');
      }
    } catch (error: unknown) {
      logError(error, 'Auth state refresh error');
      throw error;
    }
  }

  /**
   * Sign out user and clear state
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    this.log('🚪 Signing out user');
    
    try {
      const result = await authService.signOut();
      
      if (result.success && this.stateManager) {
        this.stateManager.setUser(null);
        this.log('✅ User signed out successfully');
      }
      
      return result;
    } catch (error: unknown) {
      logError(error, 'Sign out error');
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Clean up resources and unsubscribe from listeners
   */
  cleanup(): void {
    this.log('🧹 Cleaning up AuthProviderService');
    
    if (this.authStateUnsubscribe) {
      this.authStateUnsubscribe();
      this.authStateUnsubscribe = null;
    }
  }

  /**
   * Get current authentication status
   */
  async getAuthStatus(): Promise<{
    isAuthenticated: boolean;
    user: User | null;
    session: AuthSession | null;
  }> {
    if (this.config.isE2EMode) {
      return {
        isAuthenticated: true,
        user: {
          id: 'e2e-user',
          email: 'e2e@example.com',
          isAuthenticated: true
        },
        session: null
      };
    }

    const sessionResult = await authService.getCurrentSession();
    
    return {
      isAuthenticated: sessionResult.success && !!sessionResult.session,
      user: sessionResult.session?.user || null,
      session: sessionResult.session || null
    };
  }

  /**
   * Log messages if logging is enabled
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.enableLogging) {
      console.log(message, ...args);
    }
  }
}

// Export singleton instance
export const authProviderService = new AuthProviderService();