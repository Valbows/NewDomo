'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/user';
import { authProviderService } from '@/lib/services/auth';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('🔐 AuthProvider rendering');
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    console.log('🚀 AuthProvider useEffect running');
    
    // Prevent double initialization in development mode
    let isInitialized = false;
    
    const initializeAuth = async () => {
      if (isInitialized) {
        console.log('⏭️ AuthProvider already initialized, skipping');
        return;
      }
      
      isInitialized = true;
      
      // Set up state manager for the auth provider service
      authProviderService.setStateManager({
        setUser,
        getUser: () => useUserStore.getState().user
      });

      try {
        await authProviderService.initialize();
      } catch (error) {
        console.error('❌ AuthProvider initialization error:', error);
        isInitialized = false; // Reset on error
      }
    };

    initializeAuth();

    // Cleanup on unmount
    return () => {
      console.log('🧹 AuthProvider cleanup');
      authProviderService.cleanup();
      isInitialized = false;
    };
  }, []); // Empty dependency array - initialize only once

  return <>{children}</>;
};

export default AuthProvider;
