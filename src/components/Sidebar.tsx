'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/lib/services/auth';
import { useUserStore } from '@/store/user';

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const setUser = useUserStore((state) => state.setUser);

  const handleLogout = async () => {
    const result = await authService.signOut();
    if (!result.success) {
      console.error('Error logging out:', result.error);
    } else {
      // Clear user state
      setUser(null);
      router.push('/');
    }
  };

  return (
    <div className="w-64 bg-white shadow-md">
      <div className="p-5 text-2xl font-bold text-domo-dark-text">DOMO</div>
      <nav className="mt-10 flex flex-col space-y-1 px-2">
        <Link 
          href="/dashboard" 
          className={`block py-2.5 px-4 rounded transition duration-200 ${
            pathname === '/dashboard' 
              ? 'bg-domo-blue-accent text-white' 
              : 'hover:bg-gray-200'
          }`}
        >
          Dashboard
        </Link>
        <Link 
          href="/demos" 
          className={`block py-2.5 px-4 rounded transition duration-200 ${
            pathname === '/demos' 
              ? 'bg-domo-blue-accent text-white' 
              : 'hover:bg-gray-200'
          }`}
        >
          Demos
        </Link>
        <span className="block py-2.5 px-4 rounded transition duration-200 text-gray-400 cursor-not-allowed">
          Settings
        </span>
        <button onClick={handleLogout} className="block w-full text-left py-2.5 px-4 rounded transition duration-200 hover:bg-gray-200">
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
