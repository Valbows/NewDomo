import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
      update: jest.fn().mockReturnThis(),
    };

    if (tableName === 'demos') {
      mock.single.mockResolvedValue({ data: { id: 'demo-123', name: 'Test Demo', metadata: {} }, error: null });
    } else if (tableName === 'demo_videos') {
      mock.order.mockResolvedValue({ data: [], error: null });
    } else if (tableName === 'knowledge_chunks') {
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

    // Use getByRole with name or getElementById since labels have extra text
    const agentNameInput = screen.getByRole('textbox', { name: /agent name/i });
    const agentPersonalityInput = screen.getByRole('textbox', { name: /personality/i });
    const agentGreetingInput = screen.getByRole('textbox', { name: /initial greeting/i });

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
