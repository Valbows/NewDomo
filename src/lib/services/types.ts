/**
 * Service Types and Interfaces
 * 
 * Common types and interfaces used across all service modules.
 * This includes base service interfaces, error types, and shared data structures.
 */

/**
 * Base service result type for consistent error handling
 */
export type ServiceResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  code?: string;
};

/**
 * Base service interface that all services should implement
 */
export interface BaseService {
  readonly name: string;
}

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  environment: 'development' | 'staging' | 'production';
  debug?: boolean;
}

/**
 * Common service error codes
 */
export enum ServiceErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}