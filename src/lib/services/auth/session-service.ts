/**
 * Session Service Implementation
 * 
 * Handles session management operations including session validation,
 * creation, destruction, and refresh operations.
 */

import { supabase } from '@/lib/supabase';
import { getErrorMessage, logError } from '@/lib/errors';
import type { 
  ISessionService, 
  User, 
  AuthSession,
  SessionResult
} from './types';

export class SessionService implements ISessionService {
  private getSupabase() {
    return supabase;
  }

  /**
   * Validate a session token
   * @param token - Session token to validate
   * @returns Promise resolving to validation result
   */
  async validateSession(token: string): Promise<{ valid: boolean; user?: User; error?: string }> {
    try {
      const supabase = this.getSupabase();
      // Set the session token and get user info
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error) {
        logError(error, 'Session validation failed');
        return {
          valid: false,
          error: getErrorMessage(error)
        };
      }

      if (!user) {
        return {
          valid: false,
          error: 'Invalid session - no user found'
        };
      }

      const validatedUser: User = {
        id: user.id,
        email: user.email || '',
        isAuthenticated: true,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };

      return {
        valid: true,
        user: validatedUser
      };

    } catch (error: unknown) {
      logError(error, 'Session validation service error');
      return {
        valid: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Create a new session for a user
   * Note: This is typically handled by the auth service during sign-in
   * @param user - User to create session for
   * @returns Promise resolving to session creation result
   */
  async createSession(user: User): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    try {
      const supabase = this.getSupabase();
      // In Supabase, sessions are created during authentication
      // This method is more of a utility for session management
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        logError(error, 'Failed to create/get session');
        return {
          success: false,
          error: getErrorMessage(error)
        };
      }

      if (!session) {
        return {
          success: false,
          error: 'No active session found'
        };
      }

      const authSession: AuthSession = {
        user,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at
      };

      return {
        success: true,
        session: authSession
      };

    } catch (error: unknown) {
      logError(error, 'Create session service error');
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Destroy a session
   * @param sessionId - Session ID to destroy (not used in Supabase, but kept for interface compatibility)
   * @returns Promise resolving to destruction result
   */
  async destroySession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = this.getSupabase();
      // In Supabase, we sign out to destroy the session
      const { error } = await supabase.auth.signOut();

      if (error) {
        logError(error, 'Failed to destroy session');
        return {
          success: false,
          error: getErrorMessage(error)
        };
      }

      return { success: true };

    } catch (error: unknown) {
      logError(error, 'Destroy session service error');
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  /**
   * Refresh a session using refresh token
   * @param refreshToken - Refresh token to use
   * @returns Promise resolving to session refresh result
   */
  async refreshSession(refreshToken: string): Promise<SessionResult> {
    try {
      const supabase = this.getSupabase();
      // Set the refresh token and refresh the session
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) {
        logError(error, 'Failed to refresh session with token');
        return {
          success: false,
          error: getErrorMessage(error)
        };
      }

      if (!data.session || !data.user) {
        return {
          success: false,
          error: 'Session refresh failed - no session or user returned'
        };
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        isAuthenticated: true,
        createdAt: data.user.created_at,
        updatedAt: data.user.updated_at
      };

      const session: AuthSession = {
        user,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
      };

      return {
        success: true,
        session
      };

    } catch (error: unknown) {
      logError(error, 'Refresh session with token service error');
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService();