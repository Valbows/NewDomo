/**
 * Authentication Middleware for API Routes
 * 
 * Provides middleware functions for protecting API routes and validating
 * user authentication status in Next.js API handlers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getErrorMessage, logError } from '@/lib/errors';
import type { User, AuthSession } from './types';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
  session?: AuthSession;
}

export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  allowAnonymous?: boolean;
  adminOnly?: boolean;
}

/**
 * Authentication middleware result
 */
export interface AuthMiddlewareResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
  response?: NextResponse;
}

/**
 * Validate authentication for API routes using server-side Supabase client
 * @param request - Next.js request object
 * @param options - Authentication options
 * @returns Promise resolving to authentication result
 */
export async function validateAuthentication(
  request: NextRequest,
  options: AuthMiddlewareOptions = {}
): Promise<AuthMiddlewareResult> {
  const { requireAuth = true, allowAnonymous = false, adminOnly = false } = options;

  try {
    // If anonymous access is allowed and no auth is required, skip validation
    if (allowAnonymous && !requireAuth) {
      return { success: true };
    }

    // Use server-side Supabase client to get user from cookies
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      logError(error, 'Error getting user from Supabase');
      if (requireAuth) {
        return {
          success: false,
          error: 'Authentication error',
          response: NextResponse.json(
            { error: 'Authentication error' },
            { status: 401 }
          )
        };
      }
      return { success: true };
    }

    if (!user) {
      if (requireAuth) {
        return {
          success: false,
          error: 'Authentication required',
          response: NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        };
      }
      return { success: true };
    }

    // Convert Supabase user to our User type
    const authUser: User = {
      id: user.id,
      email: user.email || '',
      isAuthenticated: true,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    // Check admin requirements
    if (adminOnly) {
      // For now, we'll use a simple email check for admin status
      // This should be replaced with proper role-based access control
      const isAdmin = authUser.email.includes('admin') || authUser.email.includes('test');
      if (!isAdmin) {
        return {
          success: false,
          error: 'Admin access required',
          response: NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          )
        };
      }
    }

    // Get session information
    const { data: { session } } = await supabase.auth.getSession();
    let authSession: AuthSession | undefined;
    
    if (session) {
      authSession = {
        user: authUser,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at
      };
    }

    return {
      success: true,
      user: authUser,
      session: authSession
    };

  } catch (error: unknown) {
    logError(error, 'Authentication middleware error');
    return {
      success: false,
      error: getErrorMessage(error),
      response: NextResponse.json(
        { error: 'Authentication service error' },
        { status: 500 }
      )
    };
  }
}

/**
 * Higher-order function to wrap API route handlers with authentication
 * @param handler - API route handler function
 * @param options - Authentication options
 * @returns Wrapped handler with authentication
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await validateAuthentication(request, options);
    
    if (!authResult.success) {
      return authResult.response || NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    // Attach user and session to request for handler access
    if (authResult.user) {
      (request as AuthenticatedRequest).user = authResult.user;
    }
    if (authResult.session) {
      (request as AuthenticatedRequest).session = authResult.session;
    }

    return handler(request, ...args);
  };
}

/**
 * Middleware for admin-only routes
 * @param handler - API route handler function
 * @returns Wrapped handler with admin authentication
 */
export function withAdminAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withAuth(handler, { requireAuth: true, adminOnly: true });
}

/**
 * Middleware for optional authentication (allows both authenticated and anonymous access)
 * @param handler - API route handler function
 * @returns Wrapped handler with optional authentication
 */
export function withOptionalAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withAuth(handler, { requireAuth: false, allowAnonymous: true });
}

/**
 * Extract user from authenticated request
 * @param request - Authenticated request object
 * @returns User object or null
 */
export function getRequestUser(request: AuthenticatedRequest): User | null {
  return request.user || null;
}

/**
 * Extract session from authenticated request
 * @param request - Authenticated request object
 * @returns Session object or null
 */
export function getRequestSession(request: AuthenticatedRequest): AuthSession | null {
  return request.session || null;
}