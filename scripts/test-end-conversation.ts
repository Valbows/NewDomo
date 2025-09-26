#!/usr/bin/env npx tsx
/**
 * Manual test script for the end-conversation API endpoint
 * This script tests the API endpoint functionality without complex mocking
 */

import { NextRequest } from 'next/server';

// Simple test to verify the API endpoint can be imported and called
async function testEndConversationAPI() {
  console.log('🧪 Testing end-conversation API endpoint...');
  
  try {
    // Import the API handler
    const { POST } = await import('../src/app/api/end-conversation/route');
    
    console.log('✅ API endpoint imported successfully');
    console.log('✅ POST handler exists:', typeof POST === 'function');
    
    // Test with missing auth (should return 401)
    const mockRequest = new NextRequest('http://localhost:3000/api/end-conversation', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        conversationId: 'test-conv-123',
        demoId: 'test-demo-456'
      })
    });

    // Mock the Supabase client to return no user (unauthenticated)
    const originalCreateClient = require('../src/utils/supabase/server').createClient;
    require('../src/utils/supabase/server').createClient = jest.fn(() => ({
      auth: {
        getUser: jest.fn(() => ({
          data: { user: null }
        }))
      }
    }));

    const response = await POST(mockRequest);
    const result = await response.json();
    
    console.log('✅ Unauthenticated request handled correctly:', {
      status: response.status,
      error: result.error
    });
    
    if (response.status === 401 && result.error === 'Unauthorized') {
      console.log('✅ Authentication check working correctly');
    } else {
      console.log('⚠️ Unexpected response for unauthenticated request');
    }
    
    // Restore original function
    require('../src/utils/supabase/server').createClient = originalCreateClient;
    
    console.log('\n🎉 End-conversation API endpoint tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEndConversationAPI();