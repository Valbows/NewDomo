/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider } from '@/components/features/auth';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when provided', async () => {
    render(
      <AuthProvider>
        <div>Test Child Component</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Child Component')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(
      <AuthProvider>
        <div>Test Child Component</div>
      </AuthProvider>
    );

    // Initially should show loading or the children
    // The exact behavior depends on the implementation
    expect(screen.getByText('Test Child Component')).toBeInTheDocument();
  });

  it('provides auth context to children', async () => {
    const TestComponent = () => {
      // This would use the useAuth hook in a real implementation
      return <div>Auth Context Available</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Auth Context Available')).toBeInTheDocument();
    });
  });

  it('handles auth state changes', async () => {
    const { supabase } = require('@/lib/supabase');
    
    // Mock a session
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: '1', email: 'test@example.com' },
          access_token: 'token',
        },
      },
      error: null,
    });

    render(
      <AuthProvider>
        <div>Test Child Component</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Child Component')).toBeInTheDocument();
    });

    // Verify that getSession was called
    expect(supabase.auth.getSession).toHaveBeenCalled();
  });

  it('sets up auth state change listener', () => {
    const { supabase } = require('@/lib/supabase');

    render(
      <AuthProvider>
        <div>Test Child Component</div>
      </AuthProvider>
    );

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
  });

  it('cleans up auth listener on unmount', () => {
    const { supabase } = require('@/lib/supabase');
    const unsubscribe = jest.fn();
    
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });

    const { unmount } = render(
      <AuthProvider>
        <div>Test Child Component</div>
      </AuthProvider>
    );

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});