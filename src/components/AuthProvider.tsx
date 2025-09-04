'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setUser = useUserStore((state) => state.setUser);
  const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

  useEffect(() => {
    if (isE2E) {
      // In tests, bypass real auth so protected pages render.
      setUser({ id: 'e2e-user', email: 'e2e@example.com', isAuthenticated: true });
      return;
    }

    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser({ id: session.user.id, email: session.user.email || '', isAuthenticated: true });
        }
      } catch {
        // ignore
      }

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          setUser({ id: session.user.id, email: session.user.email || '', isAuthenticated: true });
        } else {
          setUser(null);
        }
      });
      unsub = () => authListener.subscription.unsubscribe();
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [setUser, isE2E]);

  return <>{children}</>;
};

export default AuthProvider;
