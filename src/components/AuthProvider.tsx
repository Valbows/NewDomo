'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import { debugAuth } from '@/lib/debug';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const setUser = useUserStore((state) => state.setUser);
  const isE2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

  useEffect(() => {
    debugAuth('AuthProvider mount', { isE2E });
    if (isE2E) {
      // In tests, bypass real auth so protected pages render.
      debugAuth('AuthProvider test mode: setting e2e-user');
      setUser({ id: 'e2e-user', email: 'e2e@example.com', isAuthenticated: true });
      return;
    }

    let unsub: (() => void) | undefined;
    (async () => {
      try {
        debugAuth('AuthProvider getSession start');
        const { data: { session } } = await supabase.auth.getSession();
        debugAuth('AuthProvider getSession result', { hasSession: Boolean(session), userId: session?.user?.id });
        if (session) {
          setUser({ id: session.user.id, email: session.user.email || '', isAuthenticated: true });
        }
      } catch (e) {
        debugAuth('AuthProvider getSession error', e);
      }

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        debugAuth('AuthProvider onAuthStateChange', { event, hasSession: Boolean(session) });
        if (session) {
          setUser({ id: session.user.id, email: session.user.email || '', isAuthenticated: true });
          debugAuth('AuthProvider setUser from session', { userId: session.user.id });
        } else {
          setUser(null);
          debugAuth('AuthProvider cleared user (no session)');
        }
      });
      unsub = () => authListener.subscription.unsubscribe();
    })();

    return () => {
      if (unsub) unsub();
      debugAuth('AuthProvider unmount');
    };
  }, [setUser, isE2E]);

  return <>{children}</>;
};

export default AuthProvider;
