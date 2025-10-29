'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/auth';
import { useUserStore } from '@/store/user';

export default function TestLoginPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  const handleAutoLogin = async () => {
    setLoading(true);
    setMessage('Logging in...');

    try {
      const result = await authService.signIn({
        email: 'test@domo-ai.com',
        password: 'testpassword123'
      });

      if (!result.success) {
        setMessage(`Login failed: ${result.error}`);
        return;
      }

      // Update user state
      if (result.user) {
        setUser(result.user);
      }

      setMessage('Login successful! Redirecting...');
      
      // Redirect to demos create page
      setTimeout(() => {
        router.push('/demos/create');
      }, 1000);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Test Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Automatically login with test credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Test User Credentials:
              </p>
              <div className="bg-gray-50 p-4 rounded-md text-left">
                <p className="text-sm font-mono">Email: test@domo-ai.com</p>
                <p className="text-sm font-mono">Password: testpassword123</p>
              </div>
            </div>

            <button
              onClick={handleAutoLogin}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Auto Login'}
            </button>

            {message && (
              <div className={`text-center text-sm ${
                message.includes('successful') ? 'text-green-600' : 'text-red-600'
              }`}>
                {message}
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-gray-500">
                This will log you in and redirect to the demo creation page
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
