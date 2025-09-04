import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CTASettings } from '@/app/demos/[demoId]/configure/components/CTASettings';
import { Demo } from '@/app/demos/[demoId]/configure/types';

function noop() {}

describe('CTASettings - Admin-controlled URL', () => {
  const baseProps = {
    ctaTitle: 'Title',
    setCTATitle: noop,
    ctaMessage: 'Message',
    setCTAMessage: noop,
    ctaButtonText: 'Start Free Trial',
    setCTAButtonText: noop,
    onSaveCTA: noop,
  };

  test('shows admin-controlled badge and displays admin CTA URL (no input)', () => {
    const demo: Demo = {
      id: 'd1',
      name: 'Demo',
      user_id: 'u1',
      created_at: new Date().toISOString(),
      cta_title: 'Admin Title',
      cta_message: 'Admin Message',
      cta_button_text: 'Admin Button',
      cta_button_url: 'https://dashboard.example.com/trial',
      metadata: {},
    };

    render(<CTASettings demo={demo} {...baseProps} />);

    // Label present
    expect(screen.getByText(/Primary Button URL/i)).toBeInTheDocument();
    // Admin-controlled badge visible
    expect(screen.getByText(/Admin-controlled/i)).toBeInTheDocument();
    // URL shown as text (not an editable input)
    expect(screen.getByText('https://dashboard.example.com/trial')).toBeInTheDocument();
    // Ensure there is NO input associated with Primary Button URL
    expect(screen.queryByLabelText(/Primary Button URL/i)).toBeNull();
  });

  test('shows legacy metadata warning when using metadata.ctaButtonUrl fallback', () => {
    const demo: Demo = {
      id: 'd2',
      name: 'Demo',
      user_id: 'u2',
      created_at: new Date().toISOString(),
      cta_title: null,
      cta_message: null,
      cta_button_text: null,
      cta_button_url: null,
      metadata: {
        ctaButtonUrl: 'https://legacy.example.com/trial',
      },
    };

    render(<CTASettings demo={demo} {...baseProps} />);

    expect(screen.getByText('https://legacy.example.com/trial')).toBeInTheDocument();
    expect(
      screen.getByText(/Using legacy metadata URL. Contact an admin to set the official CTA URL./i)
    ).toBeInTheDocument();
  });
});
