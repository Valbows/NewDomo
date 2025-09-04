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

  test('shows validation error for invalid protocol', async () => {
    render(<AdminCTAUrlEditor currentUrl={''} onSave={async () => {}} />);

    fireEvent.click(screen.getByTestId('admin-cta-edit'));
    fireEvent.change(screen.getByTestId('admin-cta-url-input'), { target: { value: 'ftp://example.com' } });
    fireEvent.click(screen.getByTestId('admin-cta-save'));

    expect(await screen.findByTestId('admin-cta-url-error')).toHaveTextContent('valid URL');
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
