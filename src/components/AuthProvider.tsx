'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          isAuthenticated: true,
        });
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          isAuthenticated: true,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setUser]);

  return <>{children}</>;
};

export default AuthProvider;
