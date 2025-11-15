import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CTASettings } from '@/app/demos/[demoId]/configure/components/CTASettings'
import { Demo } from '@/app/demos/[demoId]/configure/types'

// Mock data
const mockDemo: Demo = {
  id: 'test-demo',
  name: 'Test Demo',
  user_id: 'test-user',
  tavus_persona_id: null,
  cta_button_url: null,
  metadata: {
    ctaTitle: 'Ready to Get Started?',
    ctaMessage: 'Start your free trial today!',
    ctaButtonText: 'Start Free Trial',
  },
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
}

const defaultProps = {
  demo: mockDemo,
  ctaTitle: 'Ready to Get Started?',
  setCTATitle: jest.fn(),
  ctaMessage: 'Start your free trial today!',
  setCTAMessage: jest.fn(),
  ctaButtonText: 'Start Free Trial',
  setCTAButtonText: jest.fn(),
  onSaveCTA: jest.fn(),
}

describe('CTASettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders CTA settings interface', () => {
    render(<CTASettings {...defaultProps} />)
    
    expect(screen.getByText('Call-to-Action Settings')).toBeInTheDocument()
    expect(screen.getByText('Configure what happens when the AI agent determines a user is ready to take action.')).toBeInTheDocument()
    expect(screen.getByLabelText('CTA Title')).toBeInTheDocument()
    expect(screen.getByLabelText('CTA Message')).toBeInTheDocument()
    expect(screen.getByLabelText('Primary Button Text')).toBeInTheDocument()
  })

  it('displays current CTA values', () => {
    render(<CTASettings {...defaultProps} />)
    
    expect(screen.getByDisplayValue('Ready to Get Started?')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Start your free trial today!')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Start Free Trial')).toBeInTheDocument()
  })

  it('handles CTA title input', async () => {
    const user = userEvent.setup()
    const setCTATitle = jest.fn()
    
    render(<CTASettings {...defaultProps} setCTATitle={setCTATitle} />)
    
    const titleInput = screen.getByLabelText('CTA Title')
    await user.clear(titleInput)
    await user.type(titleInput, 'New Title')
    
    expect(setCTATitle).toHaveBeenCalled()
  })

  it('handles CTA message input', async () => {
    const user = userEvent.setup()
    const setCTAMessage = jest.fn()
    
    render(<CTASettings {...defaultProps} setCTAMessage={setCTAMessage} />)
    
    const messageInput = screen.getByLabelText('CTA Message')
    await user.clear(messageInput)
    await user.type(messageInput, 'New Message')
    
    expect(setCTAMessage).toHaveBeenCalled()
  })

  it('handles CTA button text input', async () => {
    const user = userEvent.setup()
    const setCTAButtonText = jest.fn()
    
    render(<CTASettings {...defaultProps} setCTAButtonText={setCTAButtonText} />)
    
    const buttonTextInput = screen.getByLabelText('Primary Button Text')
    await user.clear(buttonTextInput)
    await user.type(buttonTextInput, 'New Text')
    
    expect(setCTAButtonText).toHaveBeenCalled()
  })

  it('calls onSaveCTA when save button is clicked', async () => {
    const user = userEvent.setup()
    const onSaveCTA = jest.fn()
    
    render(<CTASettings {...defaultProps} onSaveCTA={onSaveCTA} />)
    
    const saveButton = screen.getByText('Save CTA Settings')
    await user.click(saveButton)
    
    expect(onSaveCTA).toHaveBeenCalled()
  })

  it('displays CTA preview', () => {
    render(<CTASettings {...defaultProps} />)
    
    expect(screen.getByText('CTA Preview')).toBeInTheDocument()
    expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument()
    expect(screen.getAllByText('Start your free trial today!')).toHaveLength(2)
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument()
  })

  it('updates preview when values change', () => {
    const { rerender } = render(<CTASettings {...defaultProps} />)
    
    expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument()
    
    rerender(<CTASettings {...defaultProps} ctaTitle="Updated Title" />)
    
    expect(screen.getByText('Updated Title')).toBeInTheDocument()
  })

  it('renders form fields correctly', () => {
    render(<CTASettings {...defaultProps} />)
    
    // Should show form fields
    expect(screen.getByLabelText('CTA Title')).toBeInTheDocument()
    expect(screen.getByLabelText('CTA Message')).toBeInTheDocument()
    expect(screen.getByLabelText('Primary Button Text')).toBeInTheDocument()
  })
})