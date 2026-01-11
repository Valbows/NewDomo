import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CTASettings } from '@/app/demos/[demoId]/configure/components/CTASettings';
import { Demo } from '@/app/demos/[demoId]/configure/types';

function noop() {}

describe('CTASettings', () => {
  const baseProps = {
    ctaTitle: 'Title',
    setCTATitle: noop,
    ctaMessage: 'Message',
    setCTAMessage: noop,
    ctaButtonText: 'Start Free Trial',
    setCTAButtonText: noop,
    onSaveCTA: jest.fn().mockResolvedValue(undefined),
  };

  test('renders CTA settings form with all fields', () => {
    const demo: Demo = {
      id: 'd1',
      name: 'Demo',
      user_id: 'u1',
      created_at: new Date().toISOString(),
      metadata: {},
    };

    render(<CTASettings demo={demo} {...baseProps} />);

    // Check all form elements are present
    expect(screen.getByRole('textbox', { name: /button url/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /button text/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /headline/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save cta settings/i })).toBeInTheDocument();
  });

  test('displays existing CTA URL when demo has one configured', () => {
    const demo: Demo = {
      id: 'd1',
      name: 'Demo',
      user_id: 'u1',
      created_at: new Date().toISOString(),
      cta_button_url: 'https://example.com/signup',
      metadata: {},
    };

    render(<CTASettings demo={demo} {...baseProps} />);

    const urlInput = screen.getByRole('textbox', { name: /button url/i });
    expect(urlInput).toHaveValue('https://example.com/signup');
  });

  test('shows configured status when URL is set', () => {
    const demo: Demo = {
      id: 'd1',
      name: 'Demo',
      user_id: 'u1',
      created_at: new Date().toISOString(),
      cta_button_url: 'https://example.com/signup',
      metadata: {},
    };

    render(<CTASettings demo={demo} {...baseProps} />);

    expect(screen.getByText('CTA configured')).toBeInTheDocument();
  });

  test('shows preview with provided values', () => {
    const demo: Demo = {
      id: 'd1',
      name: 'Demo',
      user_id: 'u1',
      created_at: new Date().toISOString(),
      metadata: {},
    };

    render(<CTASettings demo={demo} {...baseProps} />);

    // Preview section should exist
    expect(screen.getByText('Preview')).toBeInTheDocument();
    // Title and Message appear in both form labels and preview - check they exist
    expect(screen.getAllByText('Title').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Message').length).toBeGreaterThanOrEqual(1);
    // Button text in preview
    expect(screen.getByRole('button', { name: 'Start Free Trial' })).toBeInTheDocument();
  });

  test('save button is disabled when URL is empty', () => {
    const demo: Demo = {
      id: 'd1',
      name: 'Demo',
      user_id: 'u1',
      created_at: new Date().toISOString(),
      metadata: {},
    };

    render(<CTASettings demo={demo} {...baseProps} />);

    const saveButton = screen.getByRole('button', { name: /save cta settings/i });
    expect(saveButton).toBeDisabled();
  });
});
