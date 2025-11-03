import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfigurationHeader } from '@/app/demos/[demoId]/configure/components/ConfigurationHeader';

describe('ConfigurationHeader', () => {
  const mockDemo = {
    id: 'demo-123',
    name: 'Test Demo',
    user_id: 'user-456',
    tavus_conversation_id: 'conv-789',
    metadata: {}
  };

  test('renders demo name and description', () => {
    render(<ConfigurationHeader demo={mockDemo} demoId="demo-123" />);

    expect(screen.getByText('Configure: Test Demo')).toBeInTheDocument();
    expect(screen.getByText('Manage your demo videos, knowledge base, and agent settings.')).toBeInTheDocument();
  });

  test('renders View Demo Experience button with correct href', () => {
    render(<ConfigurationHeader demo={mockDemo} demoId="demo-123" />);

    const viewDemoButton = screen.getByRole('link', { name: 'View Demo Experience' });
    expect(viewDemoButton).toBeInTheDocument();
    expect(viewDemoButton).toHaveAttribute('href', '/demos/demo-123/experience');
    expect(viewDemoButton).toHaveClass('px-4', 'py-2', 'bg-indigo-600', 'text-white');
  });

  test('handles null demo gracefully', () => {
    render(<ConfigurationHeader demo={null} demoId="demo-123" />);

    expect(screen.getByText('Configure:')).toBeInTheDocument();
    const viewDemoButton = screen.getByRole('link', { name: 'View Demo Experience' });
    expect(viewDemoButton).toHaveAttribute('href', '/demos/demo-123/experience');
  });

  test('uses demoId parameter for navigation link', () => {
    render(<ConfigurationHeader demo={mockDemo} demoId="different-demo-id" />);

    const viewDemoButton = screen.getByRole('link', { name: 'View Demo Experience' });
    expect(viewDemoButton).toHaveAttribute('href', '/demos/different-demo-id/experience');
  });

  test('button has correct styling classes', () => {
    render(<ConfigurationHeader demo={mockDemo} demoId="demo-123" />);

    const viewDemoButton = screen.getByRole('link', { name: 'View Demo Experience' });
    expect(viewDemoButton).toHaveClass(
      'px-4',
      'py-2', 
      'bg-indigo-600',
      'text-white',
      'font-medium',
      'rounded-md',
      'hover:bg-indigo-700',
      'transition-colors'
    );
  });

  test('renders with long demo name', () => {
    const longNameDemo = {
      ...mockDemo,
      name: 'This is a very long demo name that might cause layout issues if not handled properly'
    };

    render(<ConfigurationHeader demo={longNameDemo} demoId="demo-123" />);

    expect(screen.getByText('Configure: This is a very long demo name that might cause layout issues if not handled properly')).toBeInTheDocument();
  });

  test('renders with special characters in demo name', () => {
    const specialCharDemo = {
      ...mockDemo,
      name: 'Demo with "quotes" & <special> chars'
    };

    render(<ConfigurationHeader demo={specialCharDemo} demoId="demo-123" />);

    expect(screen.getByText('Configure: Demo with "quotes" & <special> chars')).toBeInTheDocument();
  });
});