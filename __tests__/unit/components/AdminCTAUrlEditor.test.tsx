import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminCTAUrlEditor } from '@/app/demos/[demoId]/configure/components/AdminCTAUrlEditor';

describe('AdminCTAUrlEditor', () => {
  test('renders current URL and toggles to edit mode', () => {
    render(<AdminCTAUrlEditor currentUrl="https://example.com/path" onSave={async () => {}} />);

    expect(screen.getByText('Admin CTA URL')).toBeInTheDocument();
    expect(screen.getByTestId('admin-cta-current-url')).toHaveTextContent('https://example.com/path');

    fireEvent.click(screen.getByTestId('admin-cta-edit'));

    expect(screen.getByTestId('admin-cta-url-input')).toBeInTheDocument();
  });

  test('can enter edit mode and save URL', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<AdminCTAUrlEditor currentUrl={''} onSave={onSave} />);

    // Click edit button to enter edit mode
    fireEvent.click(screen.getByTestId('admin-cta-edit'));
    
    // Verify we're in edit mode
    expect(screen.getByTestId('admin-cta-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('admin-cta-save')).toBeInTheDocument();
    
    // Enter a valid URL
    fireEvent.change(screen.getByTestId('admin-cta-url-input'), { 
      target: { value: 'https://example.com' } 
    });
    
    // Click save button
    fireEvent.click(screen.getByTestId('admin-cta-save'));

    // Verify onSave was called (URL gets normalized with trailing slash)
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('https://example.com/');
    });
  });

  test('can cancel editing', async () => {
    render(<AdminCTAUrlEditor currentUrl='https://existing.com' onSave={async () => {}} />);

    fireEvent.click(screen.getByTestId('admin-cta-edit'));
    
    // Wait for edit form to appear
    await screen.findByTestId('admin-cta-url-input');
    
    // Change the input
    fireEvent.change(screen.getByTestId('admin-cta-url-input'), { target: { value: 'https://changed.com' } });
    
    // Cancel editing
    fireEvent.click(screen.getByTestId('admin-cta-cancel'));

    // Should show original URL
    expect(screen.getByTestId('admin-cta-current-url')).toHaveTextContent('https://existing.com');
  });

  test('normalizes and saves URL missing protocol', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<AdminCTAUrlEditor currentUrl={''} onSave={onSave} />);

    fireEvent.click(screen.getByTestId('admin-cta-edit'));
    fireEvent.change(screen.getByTestId('admin-cta-url-input'), { target: { value: 'example.com/path' } });
    fireEvent.click(screen.getByTestId('admin-cta-save'));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const calledWith = onSave.mock.calls[0][0];
    expect(calledWith).toMatch(/^https:\/\/example.com\/path\/?$/);
  });
});
