import {
  handleAddQAPair,
  handleDeleteKnowledgeChunk,
  handleKnowledgeDocUpload,
} from '@/app/demos/[demoId]/configure/handlers/knowledgeHandlers';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  },
}));

// Import after mocking
const { supabase: mockSupabase } = require('@/lib/supabase');

describe('Configure Knowledge Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleAddQAPair', () => {
    it('should validate Q&A inputs', async () => {
      const setError = jest.fn();
      const params = {
        newQuestion: '',
        newAnswer: 'Answer',
        demoId: 'demo1',
        knowledgeChunks: [],
        setKnowledgeChunks: jest.fn(),
        setNewQuestion: jest.fn(),
        setNewAnswer: jest.fn(),
        setError,
      };

      await handleAddQAPair(
        params.newQuestion,
        params.newAnswer,
        params.demoId,
        params.knowledgeChunks,
        params.setKnowledgeChunks,
        params.setNewQuestion,
        params.setNewAnswer,
        params.setError
      );

      expect(setError).toHaveBeenCalledWith('Please provide both a question and an answer.');
    });

    it('should add Q&A pair successfully', async () => {
      const setKnowledgeChunks = jest.fn();
      const setNewQuestion = jest.fn();
      const setNewAnswer = jest.fn();
      const setError = jest.fn();

      const mockFrom = mockSupabase.from('knowledge_chunks');
      const mockInsert = (mockFrom.insert as jest.Mock)();
      const mockSelect = (mockInsert.select as jest.Mock)();
      (mockSelect.single as jest.Mock).mockResolvedValue({
        data: {
          id: 'chunk1',
          demo_id: 'demo1',
          content: 'Q: What is this?\nA: This is a test',
          chunk_type: 'qa',
        },
        error: null,
      });

      const existingChunks = [
        { id: 'existing1', content: 'Old content', chunk_type: 'qa' },
      ];

      await handleAddQAPair(
        'What is this?',
        'This is a test',
        'demo1',
        existingChunks as any,
        setKnowledgeChunks,
        setNewQuestion,
        setNewAnswer,
        setError
      );

      expect(setKnowledgeChunks).toHaveBeenCalled();
      expect(setNewQuestion).toHaveBeenCalledWith('');
      expect(setNewAnswer).toHaveBeenCalledWith('');
      expect(setError).toHaveBeenCalledWith(null);
    });

    it('should handle insertion error', async () => {
      const setKnowledgeChunks = jest.fn();
      const setError = jest.fn();

      const mockFrom = mockSupabase.from('knowledge_chunks');
      const mockInsert = (mockFrom.insert as jest.Mock)();
      const mockSelect = (mockInsert.select as jest.Mock)();
      (mockSelect.single as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await handleAddQAPair(
        'Question',
        'Answer',
        'demo1',
        [],
        setKnowledgeChunks,
        jest.fn(),
        jest.fn(),
        setError
      );

      expect(setKnowledgeChunks).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalled();
    });
  });

  describe('handleDeleteKnowledgeChunk', () => {
    it('should delete knowledge chunk successfully', async () => {
      const chunks = [
        { id: 'chunk1', content: 'Content 1' },
        { id: 'chunk2', content: 'Content 2' },
      ];
      const setKnowledgeChunks = jest.fn();
      const setError = jest.fn();

      const mockFrom = mockSupabase.from('knowledge_chunks');
      const mockDelete = (mockFrom.delete as jest.Mock)();
      (mockDelete.eq as jest.Mock).mockResolvedValue({
        error: null,
      });

      await handleDeleteKnowledgeChunk(
        'chunk1',
        chunks as any,
        setKnowledgeChunks,
        setError
      );

      expect(setKnowledgeChunks).toHaveBeenCalledWith([chunks[1]]);
      expect(setError).not.toHaveBeenCalled();
    });

    it('should handle deletion error', async () => {
      const setKnowledgeChunks = jest.fn();
      const setError = jest.fn();

      const mockFrom = mockSupabase.from('knowledge_chunks');
      const mockDelete = (mockFrom.delete as jest.Mock)();
      (mockDelete.eq as jest.Mock).mockResolvedValue({
        error: new Error('Delete failed'),
      });

      await handleDeleteKnowledgeChunk(
        'chunk1',
        [],
        setKnowledgeChunks,
        setError
      );

      expect(setKnowledgeChunks).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalled();
    });
  });

  describe('handleKnowledgeDocUpload', () => {
    it('should validate document selection', async () => {
      const setError = jest.fn();

      await handleKnowledgeDocUpload(
        null,
        'demo1',
        [],
        jest.fn(),
        jest.fn(),
        setError
      );

      expect(setError).toHaveBeenCalledWith('Please select a document to upload.');
    });

    it('should upload document successfully', async () => {
      const mockFile = new File(['Document content'], 'doc.txt', { type: 'text/plain' });
      const setKnowledgeChunks = jest.fn();
      const setKnowledgeDoc = jest.fn();
      const setError = jest.fn();

      const mockFrom = mockSupabase.from('knowledge_chunks');
      const mockInsert = (mockFrom.insert as jest.Mock)();
      const mockSelect = (mockInsert.select as jest.Mock)();
      (mockSelect.single as jest.Mock).mockResolvedValue({
        data: {
          id: 'chunk1',
          demo_id: 'demo1',
          content: 'Document content',
          chunk_type: 'document',
          source: 'doc.txt',
        },
        error: null,
      });

      // Mock FileReader
      const originalFileReader = global.FileReader;
      const mockFileReader = {
        readAsText: jest.fn(function (this: any) {
          if (this.onload) {
            this.onload({ target: { result: 'Document content' } });
          }
        }),
        onload: null as any,
      };
      global.FileReader = jest.fn(() => mockFileReader as any) as any;

      await handleKnowledgeDocUpload(
        mockFile,
        'demo1',
        [],
        setKnowledgeChunks,
        setKnowledgeDoc,
        setError
      );

      // Wait for async FileReader callback
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith(null);
      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile);

      global.FileReader = originalFileReader;
    });

    it('should handle empty file', async () => {
      const mockFile = new File([], 'empty.txt', { type: 'text/plain' });
      const setError = jest.fn();

      // Mock FileReader with empty result
      const originalFileReader = global.FileReader;
      const mockFileReader = {
        readAsText: jest.fn(function (this: any) {
          if (this.onload) {
            this.onload({ target: { result: '' } });
          }
        }),
        onload: null as any,
      };
      global.FileReader = jest.fn(() => mockFileReader as any) as any;

      await handleKnowledgeDocUpload(
        mockFile,
        'demo1',
        [],
        jest.fn(),
        jest.fn(),
        setError
      );

      // Wait for async FileReader callback
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('File is empty or could not be read.');

      global.FileReader = originalFileReader;
    });
  });
});
