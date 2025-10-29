'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';
import { protectedGuard, AuthGuardService } from '@/lib/services/auth/auth-guard-service';
import type { AuthGuardConfig } from '@/lib/services/auth/auth-guard-service';

interface WithAuthOptions extends AuthGuardConfig {
  loadingComponent?: React.ComponentType;
  fallbackComponent?: React.ComponentType;
}

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) => {
  const WithAuthComponent = (props: P) => {
    const user = useUserStore((state) => state.user);
    const router = useRouter();
    const [isValidating, setIsValidating] = useState(true);
    const [shouldRender, setShouldRender] = useState(false);

    // Create auth guard with custom options or use default protected guard
    const authGuard = options.requireAuth !== undefined || options.allowedRoles
      ? new AuthGuardService(options)
      : protectedGuard;

    useEffect(() => {
      const validateAuth = async () => {
        setIsValidating(true);
        
        try {
          const result = await authGuard.validateForComponent(user, {
            push: router.push,
            replace: router.replace
          });
          
          setShouldRender(result.shouldRender);
        } catch (error) {
          console.error('Auth validation error:', error);
          setShouldRender(false);
        } finally {
          setIsValidating(false);
        }
      };

      validateAuth();
    }, [user, router, authGuard]);

    // Show loading component while validating
    if (isValidating) {
      const LoadingComponent = options.loadingComponent;
      return LoadingComponent ? <LoadingComponent /> : null;
    }

    // Show fallback or nothing if not authorized
    if (!shouldRender) {
      const FallbackComponent = options.fallbackComponent;
      return FallbackComponent ? <FallbackComponent /> : null;
    }

    return <WrappedComponent {...props} />;
  };

  // Set display name for debugging
  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithAuthComponent;
};

// Convenience HOCs for common use cases
export const withProtectedAuth = <P extends object>(component: React.ComponentType<P>) =>
  withAuth(component, { requireAuth: true });

export const withAdminAuth = <P extends object>(component: React.ComponentType<P>) =>
  withAuth(component, { requireAuth: true, allowedRoles: ['admin'] });

export const withOptionalAuth = <P extends object>(component: React.ComponentType<P>) =>
  withAuth(component, { requireAuth: false });

export default withAuth;
