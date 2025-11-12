/**
 * Test Database Utilities
 * Helper functions for managing test data in development Supabase database
 */

import { supabase } from '@/lib/supabase';

export const TEST_DEMO_ID = '550e8400-e29b-41d4-a716-446655440000';
export const TEST_CONVERSATION_ID = 'test-conversation-id';

/**
 * Clean up test data before/after tests
 */
export async function cleanupTestData() {
  try {
    // Delete in reverse order of dependencies
    await supabase.from('cta_tracking').delete().eq('demo_id', TEST_DEMO_ID);
    await supabase.from('video_showcase_data').delete().in('conversation_id', ['conv-1', 'conv-2']);
    await supabase.from('product_interest_data').delete().in('conversation_id', ['conv-1', 'conv-2']);
    await supabase.from('qualification_data').delete().in('conversation_id', ['conv-1', 'conv-2']);
    await supabase.from('conversation_details').delete().eq('demo_id', TEST_DEMO_ID);
    await supabase.from('demos').delete().eq('id', TEST_DEMO_ID);
    
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.warn('⚠️ Error cleaning up test data:', error);
  }
}

/**
 * Set up fresh test data
 */
export async function setupTestData() {
  try {
    // Insert test demo
    const { error: demoError } = await supabase
      .from('demos')
      .upsert({
        id: TEST_DEMO_ID,
        name: 'Test Demo',
        tavus_conversation_id: TEST_CONVERSATION_ID,
      });

    if (demoError) throw demoError;

    // Insert test conversations
    const { error: conversationError } = await supabase
      .from('conversation_details')
      .upsert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          demo_id: TEST_DEMO_ID,
          tavus_conversation_id: 'conv-1',
          conversation_name: 'Test Conversation 1',
          transcript: [
            { speaker: 'user', text: 'Hello', timestamp: 1000 },
            { speaker: 'replica', text: 'Hi there!', timestamp: 2000 },
          ],
          perception_analysis: 'User appears engaged and attentive',
          started_at: '2024-01-01T10:00:00Z',
          completed_at: '2024-01-01T10:05:00Z',
          duration_seconds: 300,
          status: 'completed',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          demo_id: TEST_DEMO_ID,
          tavus_conversation_id: 'conv-2',
          conversation_name: 'Test Conversation 2',
          transcript: null,
          perception_analysis: null,
          started_at: '2024-01-01T11:00:00Z',
          completed_at: null,
          duration_seconds: null,
          status: 'active',
        },
      ]);

    if (conversationError) throw conversationError;

    // Insert related test data
    await Promise.all([
      supabase.from('qualification_data').upsert({
        conversation_id: 'conv-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        position: 'Developer',
      }),
      
      supabase.from('product_interest_data').upsert({
        conversation_id: 'conv-1',
        primary_interest: 'Workforce Planning',
        pain_points: ['Manual processes', 'Data silos'],
      }),
      
      supabase.from('video_showcase_data').upsert({
        conversation_id: 'conv-1',
        videos_shown: ['Video 1', 'Video 2'],
        objective_name: 'video_showcase',
      }),
      
      supabase.from('cta_tracking').upsert({
        conversation_id: 'conv-1',
        demo_id: TEST_DEMO_ID,
        cta_shown_at: '2024-01-01T10:04:00Z',
        cta_clicked_at: '2024-01-01T10:04:30Z',
        cta_url: 'https://example.com',
      }),
    ]);

    console.log('✅ Test data set up successfully');
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  }
}

/**
 * Verify test data exists
 */
export async function verifyTestData() {
  try {
    const { data: demo, error } = await supabase
      .from('demos')
      .select('*')
      .eq('id', TEST_DEMO_ID)
      .single();

    if (error || !demo) {
      throw new Error('Test demo not found');
    }

    console.log('✅ Test data verified');
    return true;
  } catch (error) {
    console.error('❌ Test data verification failed:', error);
    return false;
  }
}

/**
 * Wait for database operations to complete
 */
export async function waitForDb(ms: number = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}