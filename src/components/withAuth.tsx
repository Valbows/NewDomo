'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';
import { debugAuth } from '@/lib/debug';

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const WithAuthComponent = (props: P) => {
    const user = useUserStore((state) => state.user);
    const router = useRouter();

    useEffect(() => {
      debugAuth('withAuth effect', { hasUser: Boolean(user), isAuthenticated: user?.isAuthenticated ?? false });
      if (user && !user.isAuthenticated) {
        debugAuth('withAuth redirect to /auth/sign-in');
        router.push('/auth/sign-in');
      }
    }, [user, router]);

    if (!user || !user.isAuthenticated) {
      debugAuth('withAuth gating render until authenticated');
      return null; // or a loading spinner
    }

    return <WrappedComponent {...props} />;
  };

  return WithAuthComponent;
};

export default withAuth;
