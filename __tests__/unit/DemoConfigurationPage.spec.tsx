import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DemoConfigurationPage from '@/app/demos/[demoId]/configure/page';
import { AgentSettings } from '@/app/demos/[demoId]/configure/components/AgentSettings';

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));

jest.mock('@/lib/supabase', () => {
  const from = jest.fn().mockImplementation((tableName) => {
    const mock = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(), // Add mock for update
    };

    if (tableName === 'demos') {
      mock.single.mockResolvedValue({ data: { id: 'demo-123', name: 'Test Demo', metadata: {} }, error: null });
    } else if (tableName === 'demo_videos') {
      mock.order.mockResolvedValue({ data: [], error: null });
    } else if (tableName === 'knowledge_chunks') {
      // This call is awaited directly without a terminating method like .single() or .order()
      // So we make the mock itself thenable.
      (mock as any).then = (resolve: any) => resolve({ data: [], error: null });
    }

    return mock;
  });

  return {
    supabase: {
      from,
      storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn().mockResolvedValue({ error: null }),
      },
    },
  };
});

describe('DemoConfigurationPage', () => {
  // Use real timers to allow the async save in useEffect to work correctly
  beforeAll(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    jest.useFakeTimers();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders agent settings and allows input changes', () => {
    const mockSetAgentName = jest.fn();
    const mockSetAgentPersonality = jest.fn();
    const mockSetAgentGreeting = jest.fn();

    const mockDemo = {
      id: 'demo-123',
      name: 'Test Demo',
      user_id: 'user-123',
      created_at: new Date().toISOString(),
      metadata: {},
    };

    render(
      <AgentSettings
        demo={mockDemo}
        agentName=""
        setAgentName={mockSetAgentName}
        agentPersonality=""
        setAgentPersonality={mockSetAgentPersonality}
        agentGreeting=""
        setAgentGreeting={mockSetAgentGreeting}
      />
    );

    const agentNameInput = screen.getByLabelText('Agent Name');
    const agentPersonalityInput = screen.getByLabelText('Personality');
    const agentGreetingInput = screen.getByLabelText('Initial Greeting');

    expect(agentNameInput).toBeInTheDocument();
    expect(agentPersonalityInput).toBeInTheDocument();
    expect(agentGreetingInput).toBeInTheDocument();

    fireEvent.change(agentNameInput, { target: { value: 'New Agent Name' } });
    expect(mockSetAgentName).toHaveBeenCalledWith('New Agent Name');

    fireEvent.change(agentPersonalityInput, { target: { value: 'Very bubbly' } });
    expect(mockSetAgentPersonality).toHaveBeenCalledWith('Very bubbly');

    fireEvent.change(agentGreetingInput, { target: { value: 'Hey there!' } });
    expect(mockSetAgentGreeting).toHaveBeenCalledWith('Hey there!');
  });
});
