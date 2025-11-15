import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentSettings } from '@/app/demos/[demoId]/configure/components/AgentSettings';

// Simple, focused test that avoids complex async operations and timeouts
describe('DemoConfigurationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders agent settings component and handles input changes', () => {
    const mockSetAgentName = jest.fn();
    const mockSetAgentPersonality = jest.fn();
    const mockSetAgentGreeting = jest.fn();

    const mockDemo = {
      id: 'demo-123',
      name: 'Test Demo',
      user_id: 'user-123',
      created_at: '2024-01-01T00:00:00Z',
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

    // Test that form elements render
    const agentNameInput = screen.getByLabelText('Agent Name');
    const agentPersonalityInput = screen.getByLabelText('Personality');
    const agentGreetingInput = screen.getByLabelText('Initial Greeting');

    expect(agentNameInput).toBeInTheDocument();
    expect(agentPersonalityInput).toBeInTheDocument();
    expect(agentGreetingInput).toBeInTheDocument();

    // Test input changes trigger callbacks
    fireEvent.change(agentNameInput, { target: { value: 'New Agent Name' } });
    expect(mockSetAgentName).toHaveBeenCalledWith('New Agent Name');

    fireEvent.change(agentPersonalityInput, { target: { value: 'Very bubbly' } });
    expect(mockSetAgentPersonality).toHaveBeenCalledWith('Very bubbly');

    fireEvent.change(agentGreetingInput, { target: { value: 'Hey there!' } });
    expect(mockSetAgentGreeting).toHaveBeenCalledWith('Hey there!');
  });

  it('displays demo information correctly', () => {
    const mockDemo = {
      id: 'demo-456',
      name: 'Another Test Demo',
      user_id: 'user-456',
      created_at: '2024-01-02T00:00:00Z',
      metadata: {},
    };

    render(
      <AgentSettings
        demo={mockDemo}
        agentName="Test Agent"
        setAgentName={jest.fn()}
        agentPersonality="Friendly"
        setAgentPersonality={jest.fn()}
        agentGreeting="Hello!"
        setAgentGreeting={jest.fn()}
      />
    );

    // Test that values are displayed
    const agentNameInput = screen.getByLabelText('Agent Name') as HTMLInputElement;
    const agentPersonalityInput = screen.getByLabelText('Personality') as HTMLInputElement;
    const agentGreetingInput = screen.getByLabelText('Initial Greeting') as HTMLInputElement;

    expect(agentNameInput.value).toBe('Test Agent');
    expect(agentPersonalityInput.value).toBe('Friendly');
    expect(agentGreetingInput.value).toBe('Hello!');
  });
});