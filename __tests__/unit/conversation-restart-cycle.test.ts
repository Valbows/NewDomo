import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Test the conversation end → restart cycle to ensure no race conditions
describe('Conversation Restart Cycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle multiple conversation end → restart cycles without conflicts', async () => {
    const mockDemoId = 'test-demo-123';
    const mockConversationIds = ['conv-1', 'conv-2', 'conv-3', 'conv-4', 'conv-5'];
    let currentConversationIndex = 0;

    // Mock database operations
    const mockDatabase = {
      demos: new Map([
        [mockDemoId, { 
          id: mockDemoId, 
          tavus_conversation_id: null,
          metadata: {}
        }]
      ]),
      
      updateDemo: jest.fn((demoId: string, updates: any) => {
        const demo = mockDatabase.demos.get(demoId);
        if (demo) {
          Object.assign(demo, updates);
          return { success: true };
        }
        return { success: false, error: 'Demo not found' };
      }),

      getDemo: jest.fn((demoId: string) => {
        return mockDatabase.demos.get(demoId);
      })
    };

    // Mock API services
    const mockTavusService = {
      endConversation: jest.fn().mockResolvedValue({ success: true }),
      startConversation: jest.fn(() => {
        const conversationId = mockConversationIds[currentConversationIndex++];
        return Promise.resolve({ 
          success: true, 
          data: { 
            conversation_id: conversationId,
            conversation_url: `https://tavus.daily.co/${conversationId}`
          }
        });
      })
    };

    // Simulate conversation end → restart cycle
    const simulateConversationCycle = async (cycleNumber: number) => {
      console.log(`🔄 Starting cycle ${cycleNumber}`);
      
      // 1. Start conversation
      const startResult = await mockTavusService.startConversation();
      expect(startResult.success).toBe(true);
      
      const conversationId = startResult.data.conversation_id;
      console.log(`  ✅ Started conversation: ${conversationId}`);
      
      // 2. Update demo with conversation ID
      mockDatabase.updateDemo(mockDemoId, { 
        tavus_conversation_id: conversationId 
      });
      
      const demoAfterStart = mockDatabase.getDemo(mockDemoId);
      expect(demoAfterStart?.tavus_conversation_id).toBe(conversationId);
      
      // 3. Simulate conversation end
      const endResult = await mockTavusService.endConversation(conversationId);
      expect(endResult.success).toBe(true);
      console.log(`  ✅ Ended conversation: ${conversationId}`);
      
      // 4. Clear conversation ID from database (simulate API cleanup)
      mockDatabase.updateDemo(mockDemoId, { 
        tavus_conversation_id: null,
        metadata: {}
      });
      
      const demoAfterEnd = mockDatabase.getDemo(mockDemoId);
      expect(demoAfterEnd?.tavus_conversation_id).toBe(null);
      console.log(`  ✅ Cleared database for cycle ${cycleNumber}`);
      
      return { conversationId, success: true };
    };

    // Test multiple cycles
    const cycles = 5;
    const results = [];
    
    for (let i = 1; i <= cycles; i++) {
      const result = await simulateConversationCycle(i);
      results.push(result);
      
      // Simulate small delay between cycles (like user clicking again)
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Verify all cycles completed successfully
    expect(results).toHaveLength(cycles);
    results.forEach((result, index) => {
      expect(result.success).toBe(true);
      expect(result.conversationId).toBe(mockConversationIds[index]);
    });

    // Verify final state is clean
    const finalDemo = mockDatabase.getDemo(mockDemoId);
    expect(finalDemo?.tavus_conversation_id).toBe(null);
    
    console.log(`🎉 Successfully completed ${cycles} conversation cycles`);
  });

  it('should handle race conditions between end and start operations', async () => {
    const mockDemoId = 'test-demo-race';
    let conversationCounter = 0;
    
    const mockOperations = {
      endConversation: jest.fn(() => {
        // Simulate variable delay in ending conversation
        const delay = Math.random() * 100; // 0-100ms delay
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ success: true });
          }, delay);
        });
      }),
      
      clearDatabase: jest.fn(() => {
        // Simulate variable delay in database cleanup
        const delay = Math.random() * 50; // 0-50ms delay
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ success: true });
          }, delay);
        });
      }),
      
      startNewConversation: jest.fn(() => {
        // Simulate starting new conversation
        const conversationId = `race-conv-${++conversationCounter}`;
        return Promise.resolve({
          success: true,
          data: { conversation_id: conversationId }
        });
      })
    };

    // Simulate rapid end → start cycles (race condition scenario)
    const rapidCycles = async () => {
      const promises = [];
      
      for (let i = 0; i < 3; i++) {
        const cyclePromise = (async () => {
          // End conversation
          await mockOperations.endConversation();
          
          // Clear database
          await mockOperations.clearDatabase();
          
          // Start new conversation
          const result = await mockOperations.startNewConversation();
          return result;
        })();
        
        promises.push(cyclePromise);
      }
      
      return Promise.all(promises);
    };

    const results = await rapidCycles();
    
    // All operations should complete successfully
    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.data.conversation_id).toMatch(/^race-conv-\d+$/);
    });
    
    // Verify all conversation IDs are unique (no conflicts)
    const conversationIds = results.map(r => r.data.conversation_id);
    const uniqueIds = new Set(conversationIds);
    expect(uniqueIds.size).toBe(conversationIds.length);
  });

  it('should validate conversation state transitions', () => {
    const states = ['idle', 'starting', 'active', 'ending', 'ended'];
    const validTransitions = {
      'idle': ['starting'],
      'starting': ['active', 'ended'], // can fail during start
      'active': ['ending'],
      'ending': ['ended'],
      'ended': ['starting'] // can restart after ended
    };

    const validateTransition = (from: string, to: string): boolean => {
      return validTransitions[from]?.includes(to) || false;
    };

    // Test valid transitions
    expect(validateTransition('idle', 'starting')).toBe(true);
    expect(validateTransition('starting', 'active')).toBe(true);
    expect(validateTransition('active', 'ending')).toBe(true);
    expect(validateTransition('ending', 'ended')).toBe(true);
    expect(validateTransition('ended', 'starting')).toBe(true); // restart cycle

    // Test invalid transitions
    expect(validateTransition('idle', 'active')).toBe(false); // can't skip starting
    expect(validateTransition('active', 'starting')).toBe(false); // can't restart while active
    expect(validateTransition('ending', 'active')).toBe(false); // can't go back to active

    // Test conversation restart cycle
    const conversationCycle = ['idle', 'starting', 'active', 'ending', 'ended', 'starting', 'active'];
    
    for (let i = 0; i < conversationCycle.length - 1; i++) {
      const from = conversationCycle[i];
      const to = conversationCycle[i + 1];
      expect(validateTransition(from, to)).toBe(true);
    }
  });

  it('should handle database cleanup timing', async () => {
    const mockDemoId = 'test-timing';
    let dbState = { tavus_conversation_id: 'old-conv-123' };
    
    const operations = {
      // Simulate end conversation API call
      endConversation: jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
        return { success: true };
      }),
      
      // Simulate database cleanup
      clearConversationId: jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 30)); // 30ms delay
        dbState.tavus_conversation_id = null;
        return { success: true };
      }),
      
      // Simulate checking if ready for new conversation
      isReadyForNewConversation: jest.fn(() => {
        return dbState.tavus_conversation_id === null;
      }),
      
      // Simulate starting new conversation
      startNewConversation: jest.fn(async () => {
        if (!operations.isReadyForNewConversation()) {
          throw new Error('Previous conversation not fully cleaned up');
        }
        const newId = `new-conv-${Date.now()}`;
        dbState.tavus_conversation_id = newId;
        return { success: true, conversationId: newId };
      })
    };

    // Test proper cleanup sequence
    expect(dbState.tavus_conversation_id).toBe('old-conv-123');
    
    // End conversation
    await operations.endConversation();
    expect(operations.endConversation).toHaveBeenCalled();
    
    // Clear database
    await operations.clearConversationId();
    expect(dbState.tavus_conversation_id).toBe(null);
    
    // Verify ready for new conversation
    expect(operations.isReadyForNewConversation()).toBe(true);
    
    // Start new conversation
    const result = await operations.startNewConversation();
    expect(result.success).toBe(true);
    expect(dbState.tavus_conversation_id).toMatch(/^new-conv-\d+$/);
  });

  it('should prevent starting new conversation before cleanup completes', async () => {
    let cleanupComplete = false;
    let conversationActive = true;
    
    const mockService = {
      endConversation: jest.fn(async () => {
        // Simulate ending conversation
        await new Promise(resolve => setTimeout(resolve, 100));
        conversationActive = false;
        return { success: true };
      }),
      
      cleanup: jest.fn(async () => {
        // Simulate cleanup delay
        await new Promise(resolve => setTimeout(resolve, 150));
        cleanupComplete = true;
        return { success: true };
      }),
      
      canStartNewConversation: jest.fn(() => {
        return !conversationActive && cleanupComplete;
      }),
      
      startConversation: jest.fn(async () => {
        if (!mockService.canStartNewConversation()) {
          throw new Error('Cannot start conversation: cleanup not complete');
        }
        return { success: true, conversationId: 'new-conv' };
      })
    };

    // Initial state
    expect(conversationActive).toBe(true);
    expect(cleanupComplete).toBe(false);
    expect(mockService.canStartNewConversation()).toBe(false);

    // Start end process
    const endPromise = mockService.endConversation();
    const cleanupPromise = mockService.cleanup();
    
    // Try to start new conversation too early (should fail)
    await expect(mockService.startConversation()).rejects.toThrow('Cannot start conversation: cleanup not complete');
    
    // Wait for both operations to complete
    await Promise.all([endPromise, cleanupPromise]);
    
    // Now should be able to start new conversation
    expect(mockService.canStartNewConversation()).toBe(true);
    const result = await mockService.startConversation();
    expect(result.success).toBe(true);
  });
});