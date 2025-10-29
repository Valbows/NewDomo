/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CustomObjectivesManager } from '@/components/features/objectives';

// Mock the custom hook
jest.mock('@/hooks/useCustomObjectives', () => ({
  useCustomObjectives: jest.fn(() => ({
    objectives: [],
    loading: false,
    error: null,
    createObjective: jest.fn(),
    updateObjective: jest.fn(),
    deleteObjective: jest.fn(),
    activateObjective: jest.fn(),
  })),
}));

describe('CustomObjectivesManager', () => {
  const defaultProps = {
    demoId: 'test-demo-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<CustomObjectivesManager {...defaultProps} />);
    expect(screen.getByText(/custom objectives/i)).toBeInTheDocument();
  });

  it('shows add objective button', () => {
    render(<CustomObjectivesManager {...defaultProps} />);
    expect(screen.getByRole('button', { name: /add objective/i })).toBeInTheDocument();
  });

  it('opens form when add button is clicked', () => {
    render(<CustomObjectivesManager {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add objective/i });
    fireEvent.click(addButton);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('displays loading state', () => {
    const { useCustomObjectives } = require('@/hooks/useCustomObjectives');
    useCustomObjectives.mockReturnValue({
      objectives: [],
      loading: true,
      error: null,
      createObjective: jest.fn(),
      updateObjective: jest.fn(),
      deleteObjective: jest.fn(),
      activateObjective: jest.fn(),
    });

    render(<CustomObjectivesManager {...defaultProps} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays error state', () => {
    const { useCustomObjectives } = require('@/hooks/useCustomObjectives');
    useCustomObjectives.mockReturnValue({
      objectives: [],
      loading: false,
      error: 'Test error message',
      createObjective: jest.fn(),
      updateObjective: jest.fn(),
      deleteObjective: jest.fn(),
      activateObjective: jest.fn(),
    });

    render(<CustomObjectivesManager {...defaultProps} />);
    expect(screen.getByText(/test error message/i)).toBeInTheDocument();
  });

  it('displays objectives when available', () => {
    const mockObjectives = [
      {
        id: '1',
        name: 'Test Objective',
        description: 'Test Description',
        objectives: [],
        demo_id: 'test-demo-id',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
    ];

    const { useCustomObjectives } = require('@/hooks/useCustomObjectives');
    useCustomObjectives.mockReturnValue({
      objectives: mockObjectives,
      loading: false,
      error: null,
      createObjective: jest.fn(),
      updateObjective: jest.fn(),
      deleteObjective: jest.fn(),
      activateObjective: jest.fn(),
    });

    render(<CustomObjectivesManager {...defaultProps} />);
    expect(screen.getByText('Test Objective')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });
});