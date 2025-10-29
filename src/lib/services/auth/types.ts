/**
 * Authentication Service Types
 * 
 * Type definitions for authentication services including user data,
 * session information, and service interfaces.
 */

export interface User {
  id: string;
  email: string;
  isAuthenticated: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  emailConfirm?: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
}

export interface SessionResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

export interface UserCreationResult {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Authentication Service Interface
 * Defines the contract for authentication operations
 */
export interface IAuthService {
  signIn(credentials: SignInCredentials): Promise<AuthResult>;
  signUp(credentials: SignUpCredentials): Promise<AuthResult>;
  signOut(): Promise<{ success: boolean; error?: string }>;
  getCurrentSession(): Promise<SessionResult>;
  refreshSession(): Promise<SessionResult>;
}

/**
 * User Service Interface
 * Defines the contract for user management operations
 */
export interface IUserService {
  createTestUser(): Promise<UserCreationResult>;
  getUserById(id: string): Promise<{ success: boolean; user?: User; error?: string }>;
  updateUser(id: string, updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }>;
  deleteUser(id: string): Promise<{ success: boolean; error?: string }>;
}

/**
 * Session Service Interface
 * Defines the contract for session management operations
 */
export interface ISessionService {
  validateSession(token: string): Promise<{ valid: boolean; user?: User; error?: string }>;
  createSession(user: User): Promise<{ success: boolean; session?: AuthSession; error?: string }>;
  destroySession(sessionId: string): Promise<{ success: boolean; error?: string }>;
  refreshSession(refreshToken: string): Promise<SessionResult>;
}