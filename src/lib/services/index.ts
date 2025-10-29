/**
 * Services Module
 * 
 * This module provides a centralized export point for all business logic services.
 * Services are organized by domain (auth, demos, tavus, webhooks) and contain
 * the core business logic separated from API handlers and UI components.
 * 
 * Architecture:
 * - Each domain service handles specific business operations
 * - Services are framework-agnostic and can be used across different interfaces
 * - Services interact with data repositories and external APIs
 * - Services provide clean interfaces for API handlers and other consumers
 */

// Domain service exports
export * from './auth';
export * from './demos';
export * from './tavus';
export * from './webhooks';