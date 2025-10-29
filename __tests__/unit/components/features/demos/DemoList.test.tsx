/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DemoList, type Demo } from '@/components/features/demos';

describe('DemoList', () => {
  const mockDemos: Demo[] = [
    {
      id: '1',
      name: 'Test Demo 1',
      description: 'First test demo',
      status: 'active',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      user_id: 'user-1',
    },
    {
      id: '2',
      name: 'Test Demo 2',
      description: 'Second test demo',
      status: 'inactive',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
      user_id: 'user-1',
    },
  ];

  const defaultProps = {
    demos: mockDemos,
    loading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<DemoList {...defaultProps} />);
    expect(screen.getByText('Test Demo 1')).toBeInTheDocument();
    expect(screen.getByText('Test Demo 2')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<DemoList {...defaultProps} loading={true} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays error state', () => {
    render(<DemoList {...defaultProps} error="Test error message" />);
    expect(screen.getByText(/test error message/i)).toBeInTheDocument();
  });

  it('displays empty state when no demos', () => {
    render(<DemoList {...defaultProps} demos={[]} />);
    expect(screen.getByText(/no demos found/i)).toBeInTheDocument();
  });

  it('calls onDemoSelect when demo is clicked', () => {
    const onDemoSelect = jest.fn();
    render(<DemoList {...defaultProps} onDemoSelect={onDemoSelect} />);
    
    const demoCard = screen.getByText('Test Demo 1').closest('[data-testid="demo-card"]');
    if (demoCard) {
      fireEvent.click(demoCard);
      expect(onDemoSelect).toHaveBeenCalledWith(mockDemos[0]);
    }
  });

  it('calls onDemoDelete when delete button is clicked', () => {
    const onDemoDelete = jest.fn();
    render(<DemoList {...defaultProps} onDemoDelete={onDemoDelete} />);
    
    const deleteButtons = screen.getAllByLabelText(/delete demo/i);
    fireEvent.click(deleteButtons[0]);
    
    expect(onDemoDelete).toHaveBeenCalledWith('1');
  });

  it('calls onDemoEdit when edit button is clicked', () => {
    const onDemoEdit = jest.fn();
    render(<DemoList {...defaultProps} onDemoEdit={onDemoEdit} />);
    
    const editButtons = screen.getAllByLabelText(/edit demo/i);
    fireEvent.click(editButtons[0]);
    
    expect(onDemoEdit).toHaveBeenCalledWith(mockDemos[0]);
  });

  it('displays demo status correctly', () => {
    render(<DemoList {...defaultProps} />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('displays demo descriptions', () => {
    render(<DemoList {...defaultProps} />);
    
    expect(screen.getByText('First test demo')).toBeInTheDocument();
    expect(screen.getByText('Second test demo')).toBeInTheDocument();
  });
});