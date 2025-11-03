/**
 * Transcript Diagnostics Utility
 * Helps identify and debug transcript display issues like "[object Object]"
 */

export interface TranscriptDiagnostic {
  originalType: string;
  hasObjectIssue: boolean;
  isDisplayable: boolean;
  suggestedFix: string;
  detectedFormat: string;
  sampleData: any;
}

export function diagnoseTranscript(transcript: any): TranscriptDiagnostic {
  const originalType = typeof transcript;
  const stringified = String(transcript);
  const hasObjectIssue = stringified === '[object Object]';
  
  let detectedFormat = 'unknown';
  let isDisplayable = true;
  let suggestedFix = 'No issues detected';
  let sampleData = null;

  // Null/undefined
  if (!transcript) {
    detectedFormat = 'null/undefined';
    isDisplayable = true;
    suggestedFix = 'Will show "No transcript available" message';
  }
  
  // String format
  else if (typeof transcript === 'string') {
    detectedFormat = 'string';
    isDisplayable = true;
    sampleData = transcript.substring(0, 100);
  }
  
  // Array format
  else if (Array.isArray(transcript)) {
    detectedFormat = 'array';
    isDisplayable = true;
    
    if (transcript.length > 0) {
      const firstEntry = transcript[0];
      if (typeof firstEntry === 'object' && firstEntry !== null) {
        if (firstEntry.speaker && firstEntry.text) {
          detectedFormat = 'array-speaker-text';
        } else if (firstEntry.role && firstEntry.content) {
          detectedFormat = 'array-role-content';
        } else if (firstEntry.message) {
          detectedFormat = 'array-message';
        } else {
          detectedFormat = 'array-unknown-structure';
          suggestedFix = 'Array entries should have speaker/text or role/content properties';
        }
      } else if (typeof firstEntry === 'string') {
        detectedFormat = 'array-strings';
      }
      
      sampleData = transcript.slice(0, 2);
    }
  }
  
  // Object format
  else if (typeof transcript === 'object' && transcript !== null) {
    detectedFormat = 'object';
    isDisplayable = false; // Will show [object Object] without proper handling
    
    // Check for known object structures
    if (transcript.entries && Array.isArray(transcript.entries)) {
      detectedFormat = 'object-with-entries';
      suggestedFix = 'Extract the "entries" array for display';
      isDisplayable = true;
    } else if (transcript.messages && Array.isArray(transcript.messages)) {
      detectedFormat = 'object-with-messages';
      suggestedFix = 'Extract the "messages" array for display';
      isDisplayable = true;
    } else if (transcript.conversation && Array.isArray(transcript.conversation)) {
      detectedFormat = 'object-with-conversation';
      suggestedFix = 'Extract the "conversation" array for display';
      isDisplayable = true;
    } else if (transcript.transcript && Array.isArray(transcript.transcript)) {
      detectedFormat = 'object-with-transcript';
      suggestedFix = 'Extract the "transcript" array for display';
      isDisplayable = true;
    } else {
      suggestedFix = 'Convert object to JSON string or extract relevant array property';
    }
    
    sampleData = Object.keys(transcript).slice(0, 5);
  }

  return {
    originalType,
    hasObjectIssue,
    isDisplayable,
    suggestedFix,
    detectedFormat,
    sampleData
  };
}

export function logTranscriptDiagnostic(transcript: any, conversationId?: string) {
  const diagnostic = diagnoseTranscript(transcript);
  
  console.group(`🔍 Transcript Diagnostic${conversationId ? ` (${conversationId})` : ''}`);
  console.log('Original Type:', diagnostic.originalType);
  console.log('Detected Format:', diagnostic.detectedFormat);
  console.log('Has [object Object] Issue:', diagnostic.hasObjectIssue);
  console.log('Is Displayable:', diagnostic.isDisplayable);
  console.log('Suggested Fix:', diagnostic.suggestedFix);
  
  if (diagnostic.sampleData) {
    console.log('Sample Data:', diagnostic.sampleData);
  }
  
  if (diagnostic.hasObjectIssue) {
    console.warn('⚠️ This transcript will display as "[object Object]" without proper handling!');
  }
  
  console.groupEnd();
  
  return diagnostic;
}

/**
 * Test function to validate transcript rendering
 * Use this in development to test different transcript formats
 */
export function testTranscriptFormats() {
  const testCases = [
    { name: 'Null', data: null },
    { name: 'Undefined', data: undefined },
    { name: 'Empty String', data: '' },
    { name: 'Simple String', data: 'Hello world conversation' },
    { name: 'Array - Speaker/Text', data: [
      { speaker: 'User', text: 'Hello' },
      { speaker: 'AI', text: 'Hi there!' }
    ]},
    { name: 'Array - Role/Content', data: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' }
    ]},
    { name: 'Array - Mixed', data: [
      'Simple string',
      { speaker: 'User', text: 'Object entry' },
      42
    ]},
    { name: 'Object - Entries', data: {
      entries: [
        { speaker: 'user', message: 'Hello' },
        { speaker: 'assistant', message: 'Hi!' }
      ]
    }},
    { name: 'Object - Messages', data: {
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' }
      ]
    }},
    { name: 'Object - Raw (Problematic)', data: {
      conversation_id: 'conv_123',
      some_data: 'value',
      nested: { deep: 'object' }
    }}
  ];

  console.log('🧪 Testing Transcript Formats');
  console.log('============================');
  
  testCases.forEach(testCase => {
    console.log(`\n📋 Testing: ${testCase.name}`);
    logTranscriptDiagnostic(testCase.data);
  });
}

// Export for use in development console
if (typeof window !== 'undefined') {
  (window as any).testTranscriptFormats = testTranscriptFormats;
  (window as any).diagnoseTranscript = diagnoseTranscript;
}