/**
 * Authentication Services
 * 
 * This module provides authentication-related business logic services.
 * Services in this module handle user authentication, session management,
 * user account operations, and authentication middleware.
 */

// Types
export * from './types';

// Services
export { authService } from './auth-service';
export { userService } from './user-service';
export { sessionService } from './session-service';
export { authProviderService } from './auth-provider-service';
export { authFormService } from './auth-form-service';
export { AuthGuardService, publicGuard, protectedGuard, adminGuard } from './auth-guard-service';

// Note: Middleware exports are server-side only and should be imported directly from './middleware'
// This prevents client-side components from accidentally importing server-side code

export type {
  AuthGuardConfig,
  AuthGuardResult,
  NavigationHandler as AuthNavigationHandler
} from './auth-guard-service';

export type {
  FormValidationResult,
  AuthFormResult,
  UserStateManager,
  NavigationHandler as FormNavigationHandler
} from './auth-form-service';

export type {
  AuthStateChangeEvent,
  AuthProviderConfig,
  AuthStateManager
} from './auth-provider-service';