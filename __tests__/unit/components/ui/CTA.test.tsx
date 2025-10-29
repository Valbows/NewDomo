/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CTA } from '@/components/ui/CTA';

describe('CTA', () => {
  const defaultProps = {
    title: 'Test CTA Title',
    description: 'Test CTA Description',
    buttonText: 'Get Started',
    buttonUrl: 'https://example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<CTA />);
    expect(screen.getByText(/ready to revolutionize/i)).toBeInTheDocument();
  });

  it('renders with custom props', () => {
    render(<CTA {...defaultProps} />);
    
    expect(screen.getByText('Test CTA Title')).toBeInTheDocument();
    expect(screen.getByText('Test CTA Description')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('renders primary button with correct href', () => {
    render(<CTA {...defaultProps} />);
    
    const button = screen.getByRole('link', { name: 'Get Started' });
    expect(button).toHaveAttribute('href', 'https://example.com');
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<CTA {...defaultProps} variant="primary" />);
    expect(screen.getByTestId('cta-container')).toHaveClass('variant-primary');
    
    rerender(<CTA {...defaultProps} variant="secondary" />);
    expect(screen.getByTestId('cta-container')).toHaveClass('variant-secondary');
    
    rerender(<CTA {...defaultProps} variant="outline" />);
    expect(screen.getByTestId('cta-container')).toHaveClass('variant-outline');
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<CTA {...defaultProps} size="sm" />);
    expect(screen.getByTestId('cta-container')).toHaveClass('size-sm');
    
    rerender(<CTA {...defaultProps} size="md" />);
    expect(screen.getByTestId('cta-container')).toHaveClass('size-md');
    
    rerender(<CTA {...defaultProps} size="lg" />);
    expect(screen.getByTestId('cta-container')).toHaveClass('size-lg');
  });

  it('applies custom className', () => {
    render(<CTA {...defaultProps} className="custom-class" />);
    expect(screen.getByTestId('cta-container')).toHaveClass('custom-class');
  });

  it('handles button click when onClick is provided', () => {
    const onClick = jest.fn();
    const props = {
      ...defaultProps,
      primaryAction: {
        text: 'Click Me',
        href: '#',
        onClick,
      },
    };
    
    render(<CTA {...props} />);
    
    const button = screen.getByRole('link', { name: 'Click Me' });
    fireEvent.click(button);
    
    expect(onClick).toHaveBeenCalled();
  });

  it('renders secondary action when provided', () => {
    const props = {
      ...defaultProps,
      secondaryAction: {
        text: 'Learn More',
        href: '/learn-more',
      },
    };
    
    render(<CTA {...props} />);
    
    expect(screen.getByRole('link', { name: 'Learn More' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Learn More' })).toHaveAttribute('href', '/learn-more');
  });

  it('renders background image when provided', () => {
    render(<CTA {...defaultProps} backgroundImage="/test-image.jpg" />);
    
    const imageSection = screen.getByTestId('cta-image-section');
    expect(imageSection).toBeInTheDocument();
  });
});