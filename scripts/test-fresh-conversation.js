#!/usr/bin/env node

/**
 * Test fresh conversation creation and room availability
 */

console.log('🧪 Testing fresh conversation creation...');

const CONVERSATION_URL = 'https://tavus.daily.co/c16fc2bcdb312459';

// Test if Daily room is accessible
async function testDailyRoom(url) {
  try {
    console.log('🔍 Testing Daily room:', url);
    
    // Extract room info
    const roomId = url.split('/').pop();
    const checkUrl = `https://gs.daily.co/rooms/check/tavus/${roomId}`;
    
    console.log('📡 Checking room availability:', checkUrl);
    
    const response = await fetch(checkUrl);
    console.log('📊 Room check status:', response.status);
    
    if (response.ok) {
      console.log('✅ Daily room is available');
      return true;
    } else {
      console.log('❌ Daily room not available yet');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking room:', error.message);
    return false;
  }
}

// Test with delays
async function testWithDelays() {
  const delays = [0, 2000, 5000, 10000]; // 0s, 2s, 5s, 10s
  
  for (const delay of delays) {
    if (delay > 0) {
      console.log(`⏳ Waiting ${delay/1000}s before testing...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    const available = await testDailyRoom(CONVERSATION_URL);
    if (available) {
      console.log(`🎉 Room became available after ${delay/1000}s`);
      break;
    }
  }
}

testWithDelays();