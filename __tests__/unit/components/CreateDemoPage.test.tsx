import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CreateDemoPage from '@/app/demos/create/page';
import { supabase } from '@/lib/supabase';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('@/components/withAuth', () => {
  return function withAuth(Component: any) {
    return Component;
  };
});

jest.mock('@/components/DashboardLayout', () => {
  return function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

jest.mock('@/store/user', () => ({
  useUserStore: () => ({}),
}));

describe('CreateDemoPage', () => {
  const mockPush = jest.fn();
  const mockSupabaseInsert = jest.fn();
  const mockSupabaseSelect = jest.fn();
  const mockSupabaseSingle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Setup Supabase mock chain
    mockSupabaseSingle.mockResolvedValue({
      data: { id: 'test-demo-id', name: 'Test Demo' },
      error: null,
    });
    mockSupabaseSelect.mockReturnValue({
      single: mockSupabaseSingle,
    });
    mockSupabaseInsert.mockReturnValue({
      select: mockSupabaseSelect,
    });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: mockSupabaseInsert,
    });
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
  });

  it('renders demo creation form correctly', () => {
    render(<CreateDemoPage />);
    
    expect(screen.getByText('Create a New Demo')).toBeInTheDocument();
    expect(screen.getByLabelText('Demo Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create and configure/i })).toBeInTheDocument();
  });

  it('disables submit button when demo name is empty', async () => {
    render(<CreateDemoPage />);
    
    const submitButton = screen.getByRole('button', { name: /create and configure/i });
    expect(submitButton).toBeDisabled();
  });

  it('creates demo with proper metadata structure', async () => {
    render(<CreateDemoPage />);
    
    const nameInput = screen.getByLabelText('Demo Name');
    const submitButton = screen.getByRole('button', { name: /create and configure/i });
    
    fireEvent.change(nameInput, { target: { value: 'Test Demo' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Demo',
          user_id: 'test-user-id',
          upload_id: expect.any(String),
          video_storage_path: '',
          metadata: expect.objectContaining({
            userId: 'test-user-id',
            fileName: 'Test_Demo_demo',
            fileType: 'demo_configuration',
            fileSize: 0,
            demoName: 'Test Demo',
            uploadId: expect.any(String),
            uploadTimestamp: expect.any(String),
          }),
        })
      );
    });
  });

  it('handles authentication errors gracefully', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: new Error('Auth error'),
    });

    render(<CreateDemoPage />);
    
    const nameInput = screen.getByLabelText('Demo Name');
    const submitButton = screen.getByRole('button', { name: /create and configure/i });
    
    fireEvent.change(nameInput, { target: { value: 'Test Demo' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/User authentication failed/)).toBeInTheDocument();
    });
  });

  it('handles database insertion errors gracefully', async () => {
    mockSupabaseSingle.mockResolvedValue({
      data: null,
      error: new Error('Missing required metadata fields'),
    });

    render(<CreateDemoPage />);
    
    const nameInput = screen.getByLabelText('Demo Name');
    const submitButton = screen.getByRole('button', { name: /create and configure/i });
    
    fireEvent.change(nameInput, { target: { value: 'Test Demo' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Missing required metadata fields/)).toBeInTheDocument();
    });
  });

  it('redirects to configure page on successful creation', async () => {
    render(<CreateDemoPage />);
    
    const nameInput = screen.getByLabelText('Demo Name');
    const submitButton = screen.getByRole('button', { name: /create and configure/i });
    
    fireEvent.change(nameInput, { target: { value: 'Test Demo' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/demos/test-demo-id/configure');
    });
  });

  it('sanitizes demo name for fileName metadata', async () => {
    render(<CreateDemoPage />);
    
    const nameInput = screen.getByLabelText('Demo Name');
    const submitButton = screen.getByRole('button', { name: /create and configure/i });
    
    fireEvent.change(nameInput, { target: { value: 'Test Demo! @#$%' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            fileName: 'Test_Demo_______demo',
          }),
        })
      );
    });
  });
});
