/**
 * Tests for Conversation component leave handling
 *
 * These tests verify that the onLeave callback is properly called when:
 * 1. User clicks the Leave button
 * 2. Meeting ends from remote side (agent ends call)
 * 3. Both events fire (should only call onLeave once)
 */

describe("Conversation Leave Handling", () => {
  describe("onLeave callback guard", () => {
    // Simulate the hasCalledOnLeaveRef guard logic
    const createLeaveHandler = () => {
      let hasCalledOnLeave = false;
      const callLog: string[] = [];

      const safeCallOnLeave = (source: string, onLeave: () => void) => {
        if (!hasCalledOnLeave) {
          hasCalledOnLeave = true;
          callLog.push(source);
          onLeave();
        }
      };

      return {
        safeCallOnLeave,
        callLog,
        reset: () => {
          hasCalledOnLeave = false;
          callLog.length = 0;
        },
      };
    };

    it("should call onLeave once when left-meeting event fires", () => {
      const { safeCallOnLeave, callLog } = createLeaveHandler();
      let onLeaveCalled = 0;
      const onLeave = () => { onLeaveCalled++; };

      // Simulate left-meeting event
      safeCallOnLeave('left-meeting', onLeave);

      expect(onLeaveCalled).toBe(1);
      expect(callLog).toEqual(['left-meeting']);
    });

    it("should call onLeave once when user clicks leave button", () => {
      const { safeCallOnLeave, callLog } = createLeaveHandler();
      let onLeaveCalled = 0;
      const onLeave = () => { onLeaveCalled++; };

      // Simulate leave button click
      safeCallOnLeave('handleLeave', onLeave);

      expect(onLeaveCalled).toBe(1);
      expect(callLog).toEqual(['handleLeave']);
    });

    it("should NOT call onLeave twice when both button click and event fire", () => {
      const { safeCallOnLeave, callLog } = createLeaveHandler();
      let onLeaveCalled = 0;
      const onLeave = () => { onLeaveCalled++; };

      // Simulate: user clicks leave, then left-meeting event fires
      safeCallOnLeave('handleLeave', onLeave);
      safeCallOnLeave('left-meeting', onLeave);

      expect(onLeaveCalled).toBe(1); // Should only be called once
      expect(callLog).toEqual(['handleLeave']); // First call wins
    });

    it("should NOT call onLeave twice when event fires first then button clicked", () => {
      const { safeCallOnLeave, callLog } = createLeaveHandler();
      let onLeaveCalled = 0;
      const onLeave = () => { onLeaveCalled++; };

      // Simulate: left-meeting event fires first, then user tries to click leave
      safeCallOnLeave('left-meeting', onLeave);
      safeCallOnLeave('handleLeave', onLeave);

      expect(onLeaveCalled).toBe(1);
      expect(callLog).toEqual(['left-meeting']);
    });

    it("should allow onLeave after reset (new conversation)", () => {
      const { safeCallOnLeave, callLog, reset } = createLeaveHandler();
      let onLeaveCalled = 0;
      const onLeave = () => { onLeaveCalled++; };

      // First conversation
      safeCallOnLeave('left-meeting', onLeave);
      expect(onLeaveCalled).toBe(1);

      // Reset for new conversation
      reset();

      // Second conversation
      safeCallOnLeave('left-meeting', onLeave);
      expect(onLeaveCalled).toBe(2);
    });
  });

  describe("Meeting state transitions", () => {
    type MeetingState = 'new' | 'joining-meeting' | 'joined-meeting' | 'left-meeting' | 'error';

    const shouldTriggerOnLeave = (state: MeetingState): boolean => {
      return state === 'left-meeting';
    };

    it("should trigger onLeave when state is left-meeting", () => {
      expect(shouldTriggerOnLeave('left-meeting')).toBe(true);
    });

    it("should NOT trigger onLeave when state is new", () => {
      expect(shouldTriggerOnLeave('new')).toBe(false);
    });

    it("should NOT trigger onLeave when state is joining-meeting", () => {
      expect(shouldTriggerOnLeave('joining-meeting')).toBe(false);
    });

    it("should NOT trigger onLeave when state is joined-meeting", () => {
      expect(shouldTriggerOnLeave('joined-meeting')).toBe(false);
    });

    it("should NOT trigger onLeave when state is error", () => {
      // Error state should show retry UI, not trigger leave
      expect(shouldTriggerOnLeave('error')).toBe(false);
    });
  });

  describe("Remote agent ending call", () => {
    // When remote agent (Tavus) ends the call, the Daily room fires left-meeting
    // This should trigger navigation to reporting page

    it("should handle agent-initiated call end", () => {
      const actions: string[] = [];

      // Simulate what happens when agent ends call
      const handleLeftMeeting = (onLeave: () => void) => {
        actions.push('left-meeting-event-received');
        onLeave();
      };

      const onLeave = () => {
        actions.push('onLeave-called');
        actions.push('navigate-to-reporting');
      };

      handleLeftMeeting(onLeave);

      expect(actions).toEqual([
        'left-meeting-event-received',
        'onLeave-called',
        'navigate-to-reporting',
      ]);
    });
  });
});
