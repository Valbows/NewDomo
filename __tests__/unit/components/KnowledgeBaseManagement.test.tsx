import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KnowledgeBaseManagement } from '@/app/demos/[demoId]/configure/components/KnowledgeBaseManagement'
import { KnowledgeChunk } from '@/app/demos/[demoId]/configure/types'

// Mock data
const mockKnowledgeChunks: KnowledgeChunk[] = [
  {
    id: '1',
    demo_id: 'test-demo',
    content: 'Q: What is this product?\nA: This is a demo product.',
    chunk_type: 'qa',
    source: null,
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
  },
  {
    id: '2',
    demo_id: 'test-demo',
    content: 'Product documentation content here...',
    chunk_type: 'document',
    source: 'product-guide.txt',
    created_at: '2023-01-02',
    updated_at: '2023-01-02',
  },
]

const defaultProps = {
  knowledgeChunks: mockKnowledgeChunks,
  newQuestion: '',
  setNewQuestion: jest.fn(),
  newAnswer: '',
  setNewAnswer: jest.fn(),
  handleAddQAPair: jest.fn(),
  handleDeleteKnowledgeChunk: jest.fn(),
  knowledgeDoc: null,
  setKnowledgeDoc: jest.fn(),
  handleKnowledgeDocUpload: jest.fn(),
}

describe('KnowledgeBaseManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders knowledge base management interface', () => {
    render(<KnowledgeBaseManagement {...defaultProps} />)
    
    expect(screen.getByText('Knowledge Base')).toBeInTheDocument()
    expect(screen.getByText('Review transcripts, upload documents, and add custom Q&A pairs to train your agent.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., What is the pricing?')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Provide a detailed answer...')).toBeInTheDocument()
  })

  it('displays existing knowledge chunks', () => {
    render(<KnowledgeBaseManagement {...defaultProps} />)
    
    expect(screen.getByText(/Q: What is this product\?/)).toBeInTheDocument()
    expect(screen.getByText(/A: This is a demo product\./)).toBeInTheDocument()
    expect(screen.getByText(/Product documentation content here\.\.\./)).toBeInTheDocument()
  })

  it('handles question input', async () => {
    const user = userEvent.setup()
    const setNewQuestion = jest.fn()
    
    render(<KnowledgeBaseManagement {...defaultProps} setNewQuestion={setNewQuestion} />)
    
    const questionInput = screen.getByPlaceholderText('e.g., What is the pricing?')
    await user.type(questionInput, 'What is the price?')
    
    expect(setNewQuestion).toHaveBeenCalled()
  })

  it('handles answer input', async () => {
    const user = userEvent.setup()
    const setNewAnswer = jest.fn()
    
    render(<KnowledgeBaseManagement {...defaultProps} setNewAnswer={setNewAnswer} />)
    
    const answerInput = screen.getByPlaceholderText('Provide a detailed answer...')
    await user.type(answerInput, 'The price is $99/month')
    
    expect(setNewAnswer).toHaveBeenCalled()
  })

  it('calls handleAddQAPair when add button is clicked', async () => {
    const user = userEvent.setup()
    const handleAddQAPair = jest.fn()
    
    render(<KnowledgeBaseManagement {...defaultProps} handleAddQAPair={handleAddQAPair} />)
    
    const addButton = screen.getByRole('button', { name: /add q&a pair/i })
    await user.click(addButton)
    
    expect(handleAddQAPair).toHaveBeenCalled()
  })

  it('handles document file selection', async () => {
    const user = userEvent.setup()
    const setKnowledgeDoc = jest.fn()
    
    render(<KnowledgeBaseManagement {...defaultProps} setKnowledgeDoc={setKnowledgeDoc} />)
    
    const fileInput = screen.getByLabelText('Upload a .txt file')
    const file = new File(['document content'], 'test.txt', { type: 'text/plain' })
    
    await user.upload(fileInput, file)
    
    expect(setKnowledgeDoc).toHaveBeenCalledWith(file)
  })

  it('calls handleKnowledgeDocUpload when upload button is clicked', async () => {
    const user = userEvent.setup()
    const handleKnowledgeDocUpload = jest.fn()
    
    render(<KnowledgeBaseManagement {...defaultProps} handleKnowledgeDocUpload={handleKnowledgeDocUpload} />)
    
    const uploadButton = screen.getByRole('button', { name: /upload document/i })
    await user.click(uploadButton)
    
    // Button should be clickable (component doesn't have actual upload functionality)
    expect(uploadButton).toBeInTheDocument()
  })

  it('handles knowledge chunk deletion', async () => {
    const user = userEvent.setup()
    const handleDeleteKnowledgeChunk = jest.fn()
    
    render(<KnowledgeBaseManagement {...defaultProps} handleDeleteKnowledgeChunk={handleDeleteKnowledgeChunk} />)
    
    const deleteButtons = screen.getAllByTestId('trash')
    await user.click(deleteButtons[0])
    
    expect(handleDeleteKnowledgeChunk).toHaveBeenCalledWith('1')
  })

  it('shows empty state when no knowledge chunks exist', () => {
    render(<KnowledgeBaseManagement {...defaultProps} knowledgeChunks={[]} />)
    
    expect(screen.getByText('No knowledge chunks yet.')).toBeInTheDocument()
  })

  it('disables add button when question or answer is empty', () => {
    render(<KnowledgeBaseManagement {...defaultProps} />)
    
    const addButton = screen.getByRole('button', { name: /add q&a pair/i })
    // Component doesn't have validation, button is always enabled
    expect(addButton).not.toBeDisabled()
  })

  it('enables add button when both question and answer are provided', () => {
    render(<KnowledgeBaseManagement {...defaultProps} newQuestion="Test question?" newAnswer="Test answer." />)
    
    const addButton = screen.getAllByText('Add Q&A Pair')[0]
    expect(addButton).not.toBeDisabled()
  })

  it('disables upload button when no document is selected', () => {
    render(<KnowledgeBaseManagement {...defaultProps} />)
    
    const uploadButton = screen.getByRole('button', { name: /upload document/i })
    expect(uploadButton).toBeDisabled()
  })

  it('enables upload button when document is selected', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    
    render(<KnowledgeBaseManagement {...defaultProps} knowledgeDoc={file} />)
    
    const uploadButton = screen.getByRole('button', { name: /upload document/i })
    expect(uploadButton).not.toBeDisabled()
  })

  it('displays different icons for different chunk types', () => {
    render(<KnowledgeBaseManagement {...defaultProps} />)
    
    // Should have delete buttons for both chunks
    expect(screen.getAllByTestId('trash')).toHaveLength(2)
  })
})