'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/user';
import { authProviderService } from '@/lib/services/auth';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('🔐 AuthProvider rendering');
  const { setUser, user: currentUser } = useUserStore((state) => ({
    setUser: state.setUser,
    user: state.user
  }));

  useEffect(() => {
    console.log('🚀 AuthProvider useEffect running');
    
    // Set up state manager for the auth provider service
    authProviderService.setStateManager({
      setUser,
      getUser: () => currentUser
    });

    // Initialize authentication
    const initializeAuth = async () => {
      try {
        await authProviderService.initialize();
      } catch (error) {
        console.error('❌ AuthProvider initialization error:', error);
      }
    };

    initializeAuth();

    // Cleanup on unmount
    return () => {
      authProviderService.cleanup();
    };
  }, [setUser, currentUser]);

  return <>{children}</>;
};

export default AuthProvider;
