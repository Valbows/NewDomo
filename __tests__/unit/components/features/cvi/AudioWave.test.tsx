/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AudioWave } from '@/components/features/cvi/components/audio-wave';

// Mock Daily React hooks
jest.mock('@daily-co/daily-react', () => ({
  useActiveSpeakerId: jest.fn(() => null),
  useAudioLevelObserver: jest.fn(() => 0),
}));

describe('AudioWave', () => {
  const defaultProps = {
    id: 'test-participant-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<AudioWave {...defaultProps} />);
    expect(screen.getByTestId('audio-wave')).toBeInTheDocument();
  });

  it('applies correct participant ID', () => {
    render(<AudioWave {...defaultProps} />);
    const audioWave = screen.getByTestId('audio-wave');
    expect(audioWave).toHaveAttribute('data-participant-id', 'test-participant-id');
  });

  it('shows audio level visualization', () => {
    const { useAudioLevelObserver } = require('@daily-co/daily-react');
    useAudioLevelObserver.mockReturnValue(0.5);

    render(<AudioWave {...defaultProps} />);
    
    const audioWave = screen.getByTestId('audio-wave');
    expect(audioWave).toBeInTheDocument();
  });

  it('highlights when participant is active speaker', () => {
    const { useActiveSpeakerId } = require('@daily-co/daily-react');
    useActiveSpeakerId.mockReturnValue('test-participant-id');

    render(<AudioWave {...defaultProps} />);
    
    const audioWave = screen.getByTestId('audio-wave');
    expect(audioWave).toHaveClass('active-speaker');
  });

  it('applies custom className when provided', () => {
    render(<AudioWave {...defaultProps} className="custom-class" />);
    
    const audioWave = screen.getByTestId('audio-wave');
    expect(audioWave).toHaveClass('custom-class');
  });

  it('handles different audio levels', () => {
    const { useAudioLevelObserver } = require('@daily-co/daily-react');
    
    // Test low audio level
    useAudioLevelObserver.mockReturnValue(0.1);
    const { rerender } = render(<AudioWave {...defaultProps} />);
    
    let audioWave = screen.getByTestId('audio-wave');
    expect(audioWave).toHaveAttribute('data-audio-level', 'low');
    
    // Test high audio level
    useAudioLevelObserver.mockReturnValue(0.8);
    rerender(<AudioWave {...defaultProps} />);
    
    audioWave = screen.getByTestId('audio-wave');
    expect(audioWave).toHaveAttribute('data-audio-level', 'high');
  });
});