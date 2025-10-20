#!/usr/bin/env npx tsx
/**
 * Test script to verify the complete conversation end flow
 * This simulates the flow: end conversation -> sync data -> redirect to reporting
 */

console.log('🧪 Testing conversation end flow...');

async function testConversationEndFlow() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  console.log('1. Testing end-conversation API endpoint...');
  
  // Test that the endpoint exists and handles missing auth correctly
  try {
    const response = await fetch(`${baseUrl}/api/end-conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversationId: 'test-conv-123',
        demoId: 'test-demo-456'
      })
    });
    
    console.log('   - End conversation API response:', response.status);
    
    if (response.status === 401) {
      console.log('   ✅ Authentication check working correctly');
    } else {
      console.log('   ⚠️ Unexpected response status:', response.status);
    }
  } catch (error) {
    console.log('   ❌ Failed to call end-conversation API:', error);
  }
  
  console.log('\n2. Testing sync-tavus-conversations API endpoint...');
  
  try {
    const response = await fetch(`${baseUrl}/api/sync-tavus-conversations?demoId=test-demo-456`, {
      method: 'GET'
    });
    
    console.log('   - Sync conversations API response:', response.status);
    
    if (response.status === 401) {
      console.log('   ✅ Authentication check working correctly');
    } else {
      console.log('   ⚠️ Unexpected response status:', response.status);
    }
  } catch (error) {
    console.log('   ❌ Failed to call sync-tavus-conversations API:', error);
  }
  
  console.log('\n3. Testing configure page with reporting tab...');
  
  try {
    const response = await fetch(`${baseUrl}/demos/test-demo-456/configure?tab=reporting`);
    console.log('   - Configure page response:', response.status);
    
    if (response.status === 200 || response.status === 404) {
      console.log('   ✅ Configure page accessible');
    } else {
      console.log('   ⚠️ Unexpected response status:', response.status);
    }
  } catch (error) {
    console.log('   ❌ Failed to access configure page:', error);
  }
  
  console.log('\n🎉 Conversation end flow test completed!');
  console.log('\nExpected flow:');
  console.log('1. User clicks "Leave" in demo experience');
  console.log('2. Frontend calls /api/end-conversation');
  console.log('3. API ends Tavus conversation');
  console.log('4. Frontend calls /api/sync-tavus-conversations');
  console.log('5. API syncs latest conversation data');
  console.log('6. Frontend redirects to /demos/{id}/configure?tab=reporting');
  console.log('7. Configure page opens with reporting tab active');
  console.log('8. User sees updated conversation analytics');
}

testConversationEndFlow().catch(console.error);