'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const WithAuthComponent = (props: P) => {
    const user = useUserStore((state) => state.user);
    const router = useRouter();

    useEffect(() => {
      if (user && !user.isAuthenticated) {
        router.push('/auth/sign-in');
      }
    }, [user, router]);

    if (!user || !user.isAuthenticated) {
      return null; // or a loading spinner
    }

    return <WrappedComponent {...props} />;
  };

  return WithAuthComponent;
};

export default withAuth;
