/**
 * Unit Tests for Transcript Data Processing
 * Tests to catch "[object Object]" display issues and ensure proper transcript data handling
 */

import { describe, it, expect } from '@jest/globals';

// Helper function to simulate transcript processing logic
function processTranscriptData(transcript: any): { hasObjectIssue: boolean; processedData: any } {
  if (transcript === null) {
    return { hasObjectIssue: false, processedData: null };
  }
  if (transcript === undefined) {
    return { hasObjectIssue: false, processedData: undefined };
  }
  
  // Check for [object Object] issues
  const stringified = String(transcript);
  const hasObjectIssue = stringified === '[object Object]';
  
  let processedData = transcript;
  
  // Handle array format
  if (Array.isArray(transcript)) {
    processedData = transcript.map((entry: any) => {
      if (typeof entry === 'object' && entry !== null) {
        return {
          speaker: entry.speaker || entry.role || entry.user || "Unknown",
          text: entry.text || entry.message || entry.content || JSON.stringify(entry)
        };
      }
      return { speaker: "Unknown", text: String(entry) };
    });
  }
  
  // Handle object format
  else if (typeof transcript === 'object' && transcript !== null) {
    if (transcript.entries && Array.isArray(transcript.entries)) {
      processedData = transcript.entries;
    } else if (transcript.messages && Array.isArray(transcript.messages)) {
      processedData = transcript.messages;
    } else {
      // Convert object to readable format
      processedData = JSON.stringify(transcript, null, 2);
    }
  }
  
  return { hasObjectIssue, processedData };
}

describe('Transcript Data Processing Tests', () => {
  describe('Object Display Issue Detection', () => {
    it('should detect [object Object] issues', () => {
      const problematicTranscript = { some: 'data' };
      const stringified = String(problematicTranscript);
      expect(stringified).toBe('[object Object]');
    });

    it('should handle null transcript', () => {
      const result = processTranscriptData(null);
      expect(result.hasObjectIssue).toBe(false);
      expect(result.processedData).toBe(null);
    });

    it('should handle undefined transcript', () => {
      const result = processTranscriptData(undefined);
      expect(result.hasObjectIssue).toBe(false);
      expect(result.processedData).toBeUndefined();
    });

    it('should handle string transcript correctly', () => {
      const transcript = 'This is a simple transcript';
      const result = processTranscriptData(transcript);
      expect(result.hasObjectIssue).toBe(false);
      expect(result.processedData).toBe('This is a simple transcript');
    });

    it('should handle array transcript with proper structure', () => {
      const transcript = [
        { speaker: 'User', text: 'Hello there' },
        { speaker: 'AI', text: 'Hi! How can I help you?' }
      ];
      const result = processTranscriptData(transcript);
      
      expect(result.hasObjectIssue).toBe(false);
      expect(result.processedData).toHaveLength(2);
      expect(result.processedData[0].speaker).toBe('User');
      expect(result.processedData[0].text).toBe('Hello there');
    });

    it('should handle array transcript with missing speaker', () => {
      const transcript = [
        { text: 'Hello there' },
        { speaker: 'AI', text: 'Hi! How can I help you?' }
      ];
      const result = processTranscriptData(transcript);
      
      expect(result.hasObjectIssue).toBe(false);
      expect(result.processedData[0].speaker).toBe('Unknown');
      expect(result.processedData[0].text).toBe('Hello there');
    });

    it('should handle malformed object transcript', () => {
      const transcript = {
        conversation: 'This is a conversation',
        participants: ['User', 'AI']
      };
      const result = processTranscriptData(transcript);
      
      expect(result.hasObjectIssue).toBe(true); // Raw object would show [object Object]
      expect(typeof result.processedData).toBe('string'); // Should be converted to JSON string
      expect(result.processedData).toContain('conversation');
      expect(result.processedData).toContain('participants');
    });

    it('should handle Tavus-style transcript format', () => {
      const transcript = {
        entries: [
          { speaker: 'user', message: 'Hello' },
          { speaker: 'assistant', message: 'Hi there!' }
        ]
      };
      const result = processTranscriptData(transcript);
      
      expect(result.hasObjectIssue).toBe(true); // Raw object would be problematic
      expect(Array.isArray(result.processedData)).toBe(true); // Should extract entries
      expect(result.processedData).toHaveLength(2);
    });

    it('should handle nested message format', () => {
      const transcript = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' }
        ]
      };
      const result = processTranscriptData(transcript);
      
      expect(result.hasObjectIssue).toBe(true); // Raw object would be problematic
      expect(Array.isArray(result.processedData)).toBe(true); // Should extract messages
    });
  });

  describe('Data Format Validation', () => {
    it('should identify problematic transcript formats', () => {
      const problematicFormats = [
        { some: 'random', data: 'here' },
        { nested: { deeply: { structured: 'data' } } },
        { circular: null as any }
      ];
      
      // Create circular reference
      problematicFormats[2].circular = problematicFormats[2];
      
      problematicFormats.forEach((transcript, index) => {
        const stringified = String(transcript);
        expect(stringified).toBe('[object Object]');
      });
    });

    it('should handle array with mixed data types', () => {
      const transcript = [
        'Simple string message',
        { speaker: 'User', text: 'Object message' },
        42,
        null,
        { malformed: 'object' }
      ];
      const result = processTranscriptData(transcript);
      
      expect(result.hasObjectIssue).toBe(false);
      expect(result.processedData).toHaveLength(5);
      expect(result.processedData[0].text).toBe('Simple string message');
      expect(result.processedData[1].speaker).toBe('User');
      expect(result.processedData[2].text).toBe('42');
    });
  });

  describe('Real-world Transcript Formats', () => {
    it('should handle Tavus conversation format', () => {
      const tavusFormat = {
        conversation_id: 'conv_123',
        transcript: [
          { speaker: 'user', text: 'Hello' },
          { speaker: 'assistant', text: 'Hi there!' }
        ]
      };
      
      // This would show [object Object] without proper handling
      expect(String(tavusFormat)).toBe('[object Object]');
      
      const result = processTranscriptData(tavusFormat);
      expect(result.hasObjectIssue).toBe(true);
      expect(typeof result.processedData).toBe('string');
    });

    it('should handle OpenAI-style format', () => {
      const openaiFormat = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' }
        ]
      };
      
      const result = processTranscriptData(openaiFormat);
      expect(result.processedData).toHaveLength(2);
    });

    it('should handle simple array format', () => {
      const simpleFormat = [
        { speaker: 'User', text: 'Hello' },
        { speaker: 'Bot', text: 'Hi!' }
      ];
      
      const result = processTranscriptData(simpleFormat);
      expect(result.hasObjectIssue).toBe(false);
      expect(result.processedData).toHaveLength(2);
    });
  });
});