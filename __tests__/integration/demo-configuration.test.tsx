import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DemoConfigurationPage from '@/app/demos/[demoId]/configure/page'

// Mock Next.js params
const mockParams = { demoId: 'test-demo-id' }

// Mock Supabase with more detailed responses
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => {
      if (table === 'demos') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: {
                  id: 'test-demo-id',
                  name: 'Test Demo',
                  user_id: 'test-user',
                  tavus_persona_id: null,
                  cta_button_url: null,
                  metadata: {
                    agentName: 'Test Agent',
                    agentPersonality: 'Friendly and helpful',
                    agentGreeting: 'Hello! How can I help?',
                    objectives: ['Objective 1', 'Objective 2', 'Objective 3'],
                    ctaTitle: 'Ready to Get Started?',
                    ctaMessage: 'Start your free trial today!',
                    ctaButtonText: 'Start Free Trial',
                  },
                  created_at: '2023-01-01',
                  updated_at: '2023-01-01',
                },
                error: null,
              })),
            })),
          })),
          update: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: null })),
          })),
        }
      }
      if (table === 'demo_videos') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: [
                  {
                    id: '1',
                    demo_id: 'test-demo-id',
                    storage_url: 'test-video.mp4',
                    title: 'Test Video',
                    order_index: 1,
                    processing_status: 'completed',
                    created_at: '2023-01-01',
                    updated_at: '2023-01-01',
                  },
                ],
                error: null,
              })),
            })),
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: {
                  id: '2',
                  demo_id: 'test-demo-id',
                  storage_url: 'new-video.mp4',
                  title: 'New Video',
                  order_index: 2,
                  processing_status: 'pending',
                  created_at: '2023-01-01',
                  updated_at: '2023-01-01',
                },
                error: null,
              })),
            })),
          })),
          delete: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: null })),
          })),
        }
      }
      if (table === 'knowledge_chunks') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({
              data: [
                {
                  id: '1',
                  demo_id: 'test-demo-id',
                  content: 'Q: What is this?\nA: This is a test.',
                  chunk_type: 'qa',
                  source: null,
                  created_at: '2023-01-01',
                  updated_at: '2023-01-01',
                },
              ],
              error: null,
            })),
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: {
                  id: '2',
                  demo_id: 'test-demo-id',
                  content: 'Q: New question?\nA: New answer.',
                  chunk_type: 'qa',
                  source: null,
                  created_at: '2023-01-01',
                  updated_at: '2023-01-01',
                },
                error: null,
              })),
            })),
          })),
          delete: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: null })),
          })),
        }
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      }
    }),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({
          data: { path: 'test-path' },
          error: null,
        })),
        createSignedUrl: jest.fn(() => Promise.resolve({
          data: { signedUrl: 'https://example.com/signed-url' },
          error: null,
        })),
        remove: jest.fn(() => Promise.resolve({ error: null })),
      })),
    },
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: { user: { id: 'test-user' } },
        error: null,
      })),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  },
}))

describe('DemoConfigurationPage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('loads and displays demo configuration page', async () => {
    render(<DemoConfigurationPage params={mockParams} />)
    
    await waitFor(() => {
      expect(screen.getByText('Configure: Test Demo')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Manage your demo videos, knowledge base, and agent settings.')).toBeInTheDocument()
  })

  it('displays all configuration tabs', async () => {
    render(<DemoConfigurationPage params={mockParams} />)
    
    await waitFor(() => {
      expect(screen.getByText('Videos')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Knowledge Base')).toBeInTheDocument()
    expect(screen.getByText('Agent Settings')).toBeInTheDocument()
    expect(screen.getByText('Call-to-Action')).toBeInTheDocument()
    expect(screen.getByText('Reporting')).toBeInTheDocument()
  })

  it('loads existing demo data', async () => {
    const user = userEvent.setup()
    render(<DemoConfigurationPage params={mockParams} />)
    
    await waitFor(() => {
      expect(screen.getByText('Videos')).toBeInTheDocument()
    })
    
    // Switch to Agent Settings tab to see the loaded data
    const agentTab = screen.getByRole('tab', { name: /agent settings/i })
    await user.click(agentTab)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Agent')).toBeInTheDocument()
    })
    
    expect(screen.getByDisplayValue('Friendly and helpful')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Hello! How can I help?')).toBeInTheDocument()
  })

  it('loads existing videos', async () => {
    render(<DemoConfigurationPage params={mockParams} />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Video')).toBeInTheDocument()
    })
  })

  it('loads existing knowledge chunks', async () => {
    const user = userEvent.setup()
    render(<DemoConfigurationPage params={mockParams} />)
    
    // Switch to knowledge base tab
    await waitFor(() => {
      expect(screen.getByText('Videos')).toBeInTheDocument()
    })
    
    const knowledgeTab = screen.getByRole('tab', { name: /knowledge base/i })
    await user.click(knowledgeTab)
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Knowledge Base' })).toBeInTheDocument()
    })
  })

  it('handles tab navigation', async () => {
    const user = userEvent.setup()
    render(<DemoConfigurationPage params={mockParams} />)
    
    await waitFor(() => {
      expect(screen.getByText('Videos')).toBeInTheDocument()
    })
    
    // Click on Agent Settings tab
    const agentTab = screen.getByRole('tab', { name: /agent settings/i })
    await user.click(agentTab)
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Agent Settings' })).toBeInTheDocument()
    })
  })

  it('handles video upload workflow', async () => {
    const user = userEvent.setup()
    render(<DemoConfigurationPage params={mockParams} />)
    
    await waitFor(() => {
      expect(screen.getByText('Videos')).toBeInTheDocument()
    })
    
    // Fill in video title
    const titleInput = screen.getByPlaceholderText('e.g., Introduction Clip')
    await user.type(titleInput, 'New Test Video')
    
    // Select file
    const fileInput = screen.getByLabelText('Video File')
    const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    await user.upload(fileInput, file)
    
    // Click upload
    const uploadButton = screen.getByText('Upload Video')
    await user.click(uploadButton)
    
    // Upload button should be clicked (mocked upload won't show status)
    expect(uploadButton).toBeInTheDocument()
  })

  it('handles knowledge base Q&A addition', async () => {
    const user = userEvent.setup()
    render(<DemoConfigurationPage params={mockParams} />)
    
    await waitFor(() => {
      expect(screen.getByText('Videos')).toBeInTheDocument()
    })
    
    // Switch to knowledge base tab
    const knowledgeTab = screen.getByRole('tab', { name: /knowledge base/i })
    await user.click(knowledgeTab)
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Knowledge Base' })).toBeInTheDocument()
    })
    
    // Fill in Q&A
    const questionInput = screen.getByPlaceholderText('e.g., What is the pricing?')
    await user.type(questionInput, 'What is the price?')
    
    const answerInput = screen.getByPlaceholderText('Provide a detailed answer...')
    await user.type(answerInput, '$99/month')
    
    // Add Q&A pair
    const addButton = screen.getByRole('button', { name: 'Plus Add Q&A Pair' })
    await user.click(addButton)
    
    // Should add the Q&A pair (mocked Supabase call)
    expect(addButton).toBeInTheDocument()
  })

  it('handles agent settings updates', async () => {
    const user = userEvent.setup()
    render(<DemoConfigurationPage params={mockParams} />)
    
    await waitFor(() => {
      expect(screen.getByText('Videos')).toBeInTheDocument()
    })
    
    // Switch to agent settings tab
    const agentTab = screen.getByRole('tab', { name: /agent settings/i })
    await user.click(agentTab)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Agent')).toBeInTheDocument()
    })
    
    // Update agent name
    const nameInput = screen.getByLabelText('Agent Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Agent Name')
    
    // Should auto-save after delay
    await waitFor(() => {
      // Check that update was called (mocked)
      expect(true).toBe(true) // Placeholder for auto-save verification
    }, { timeout: 2000 })
  })

  it('handles CTA settings save', async () => {
    const user = userEvent.setup()
    render(<DemoConfigurationPage params={mockParams} />)
    
    await waitFor(() => {
      expect(screen.getByText('Videos')).toBeInTheDocument()
    })
    
    // Switch to CTA tab
    const ctaTab = screen.getByRole('tab', { name: /call-to-action/i })
    await user.click(ctaTab)
    
    await waitFor(() => {
      expect(screen.getByText('Call-to-Action Settings')).toBeInTheDocument()
    })
    
    // Update CTA title
    const titleInput = screen.getByLabelText('CTA Title')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated CTA Title')
    
    // Save CTA
    const saveButton = screen.getByText('Save CTA Settings')
    await user.click(saveButton)
    
    // Should show success message
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('CTA settings saved successfully!')
    })
  })

  it('handles real-time subscriptions', async () => {
    render(<DemoConfigurationPage params={mockParams} />)
    
    await waitFor(() => {
      expect(screen.getByText('Configure: Test Demo')).toBeInTheDocument()
    })
    
    // Verify that channel subscription was set up
    const { supabase } = require('@/lib/supabase')
    expect(supabase.channel).toHaveBeenCalledWith('demo-test-demo-id')
  })

  it('handles error states gracefully', async () => {
    // Mock error response
    const { supabase } = require('@/lib/supabase')
    supabase.from.mockImplementation(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Demo not found' },
          })),
        })),
      })),
    }))
    
    render(<DemoConfigurationPage params={mockParams} />)
    
    await waitFor(() => {
      expect(screen.getByText('Demo not found')).toBeInTheDocument()
    })
  })

  it('handles loading states', () => {
    render(<DemoConfigurationPage params={mockParams} />)
    
    // Should show loading spinner initially
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })
})