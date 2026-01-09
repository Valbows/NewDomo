/**
 * Integration tests for Mixpanel Analytics
 *
 * Tests the analytics tracking functions including:
 * - Event tracking
 * - User identification
 * - Demo-specific analytics events
 */

// Mock the mixpanel-browser module
jest.mock('mixpanel-browser', () => ({
  init: jest.fn(),
  track: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
  people: {
    set: jest.fn(),
  },
}));

import mixpanel from 'mixpanel-browser';
import { track, identify, reset, initMixpanel, analytics } from '@/lib/mixpanel';

describe('Mixpanel Analytics', () => {
  // Store original window
  const originalWindow = global.window;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window for browser environment
    global.window = {} as Window & typeof globalThis;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  describe('initMixpanel', () => {
    it('should initialize mixpanel with correct config', () => {
      initMixpanel();

      expect(mixpanel.init).toHaveBeenCalledWith(
        '3a185c402520defd864bd67568f6397f',
        expect.objectContaining({
          track_pageview: true,
          persistence: 'localStorage',
          autocapture: true,
        })
      );
    });

    it('should not initialize twice', () => {
      // Reset by importing fresh (workaround for module state)
      jest.resetModules();
      jest.mock('mixpanel-browser', () => ({
        init: jest.fn(),
        track: jest.fn(),
        identify: jest.fn(),
        reset: jest.fn(),
        people: { set: jest.fn() },
      }));

      const { initMixpanel: freshInit } = require('@/lib/mixpanel');
      freshInit();
      freshInit();

      const freshMixpanel = require('mixpanel-browser');
      expect(freshMixpanel.init).toHaveBeenCalledTimes(1);
    });

    it('should not initialize when window is undefined', () => {
      global.window = undefined as unknown as Window & typeof globalThis;

      jest.resetModules();
      jest.mock('mixpanel-browser', () => ({
        init: jest.fn(),
        track: jest.fn(),
        identify: jest.fn(),
        reset: jest.fn(),
        people: { set: jest.fn() },
      }));

      const { initMixpanel: freshInit } = require('@/lib/mixpanel');
      freshInit();

      const freshMixpanel = require('mixpanel-browser');
      expect(freshMixpanel.init).not.toHaveBeenCalled();
    });
  });

  describe('track', () => {
    it('should track an event with properties', () => {
      track('Test Event', { foo: 'bar', count: 42 });

      expect(mixpanel.track).toHaveBeenCalledWith(
        'Test Event',
        expect.objectContaining({
          foo: 'bar',
          count: 42,
          timestamp: expect.any(String),
        })
      );
    });

    it('should add timestamp to all events', () => {
      track('Simple Event');

      expect(mixpanel.track).toHaveBeenCalledWith(
        'Simple Event',
        expect.objectContaining({
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        })
      );
    });

    it('should not track when window is undefined', () => {
      global.window = undefined as unknown as Window & typeof globalThis;
      jest.clearAllMocks();

      track('Should Not Track');

      expect(mixpanel.track).not.toHaveBeenCalled();
    });
  });

  describe('identify', () => {
    it('should identify a user', () => {
      identify('user-123');

      expect(mixpanel.identify).toHaveBeenCalledWith('user-123');
    });

    it('should set user properties when provided', () => {
      identify('user-456', { name: 'John', plan: 'pro' });

      expect(mixpanel.identify).toHaveBeenCalledWith('user-456');
      expect(mixpanel.people.set).toHaveBeenCalledWith({ name: 'John', plan: 'pro' });
    });

    it('should not set properties when not provided', () => {
      jest.clearAllMocks();
      identify('user-789');

      expect(mixpanel.people.set).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset mixpanel', () => {
      reset();

      expect(mixpanel.reset).toHaveBeenCalled();
    });
  });

  describe('analytics object', () => {
    describe('demoStarted', () => {
      it('should track demo start with correct properties', () => {
        analytics.demoStarted({
          demoId: 'demo-123',
          demoName: 'Test Demo',
          source: 'embed',
          embedToken: 'token-456',
        });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'Demo Started',
          expect.objectContaining({
            demoId: 'demo-123',
            demoName: 'Test Demo',
            source: 'embed',
            embedToken: 'token-456',
          })
        );
      });
    });

    describe('demoEnded', () => {
      it('should track demo end with duration', () => {
        analytics.demoEnded({
          demoId: 'demo-123',
          demoName: 'Test Demo',
          source: 'experience',
          durationSeconds: 120,
          conversationId: 'conv-789',
        });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'Demo Ended',
          expect.objectContaining({
            demoId: 'demo-123',
            durationSeconds: 120,
            conversationId: 'conv-789',
          })
        );
      });
    });

    describe('videoPlayed', () => {
      it('should track video play event', () => {
        analytics.videoPlayed({
          demoId: 'demo-123',
          videoUrl: 'https://example.com/video.mp4',
          videoTitle: 'Product Overview',
        });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'Video Played',
          expect.objectContaining({
            demoId: 'demo-123',
            videoUrl: 'https://example.com/video.mp4',
            videoTitle: 'Product Overview',
          })
        );
      });
    });

    describe('videoEnded', () => {
      it('should track video end event', () => {
        analytics.videoEnded({
          demoId: 'demo-123',
          videoUrl: 'https://example.com/video.mp4',
        });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'Video Ended',
          expect.objectContaining({
            demoId: 'demo-123',
            videoUrl: 'https://example.com/video.mp4',
          })
        );
      });
    });

    describe('videoClosed', () => {
      it('should track video close event', () => {
        analytics.videoClosed({
          demoId: 'demo-123',
          videoUrl: 'https://example.com/video.mp4',
        });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'Video Closed',
          expect.objectContaining({
            demoId: 'demo-123',
          })
        );
      });
    });

    describe('videoPaused', () => {
      it('should track video pause with timestamp', () => {
        analytics.videoPaused({
          demoId: 'demo-123',
          videoUrl: 'https://example.com/video.mp4',
          pausedAt: 45.5,
          formattedTime: '0:45',
        });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'Video Paused',
          expect.objectContaining({
            pausedAt: 45.5,
            formattedTime: '0:45',
          })
        );
      });
    });

    describe('videoSeeked', () => {
      it('should track video seek with timestamp', () => {
        analytics.videoSeeked({
          demoId: 'demo-123',
          videoUrl: 'https://example.com/video.mp4',
          seekedTo: 120,
          formattedTime: '2:00',
        });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'Video Seeked',
          expect.objectContaining({
            seekedTo: 120,
            formattedTime: '2:00',
          })
        );
      });
    });

    describe('videoContextSent', () => {
      it('should track video context sent event', () => {
        analytics.videoContextSent({
          demoId: 'demo-123',
          context: 'User is watching settings section',
          conversationId: 'conv-456',
        });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'Video Context Sent',
          expect.objectContaining({
            context: 'User is watching settings section',
            conversationId: 'conv-456',
          })
        );
      });
    });

    describe('ctaShown', () => {
      it('should track CTA shown event', () => {
        analytics.ctaShown({
          demoId: 'demo-123',
          ctaTitle: 'Ready to get started?',
          ctaButtonText: 'Start Free Trial',
        });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'CTA Shown',
          expect.objectContaining({
            ctaTitle: 'Ready to get started?',
            ctaButtonText: 'Start Free Trial',
          })
        );
      });
    });

    describe('ctaClicked', () => {
      it('should track CTA clicked event', () => {
        analytics.ctaClicked({
          demoId: 'demo-123',
          ctaTitle: 'Sign Up',
          ctaButtonUrl: 'https://example.com/signup',
        });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'CTA Clicked',
          expect.objectContaining({
            ctaButtonUrl: 'https://example.com/signup',
          })
        );
      });
    });

    describe('ctaClosed', () => {
      it('should track CTA closed event', () => {
        analytics.ctaClosed({ demoId: 'demo-123' });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'CTA Closed',
          expect.objectContaining({
            demoId: 'demo-123',
          })
        );
      });
    });

    describe('embedLoaded', () => {
      it('should track embed loaded event', () => {
        analytics.embedLoaded({
          embedToken: 'token-123',
          demoId: 'demo-456',
          referrer: 'https://partner.com',
        });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'Embed Loaded',
          expect.objectContaining({
            embedToken: 'token-123',
            referrer: 'https://partner.com',
          })
        );
      });
    });

    describe('embedPopupOpened', () => {
      it('should track embed popup opened event', () => {
        analytics.embedPopupOpened({
          embedToken: 'token-123',
          demoId: 'demo-456',
        });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'Embed Popup Opened',
          expect.objectContaining({
            embedToken: 'token-123',
          })
        );
      });
    });

    describe('embedPopupClosed', () => {
      it('should track embed popup closed event', () => {
        analytics.embedPopupClosed({
          embedToken: 'token-123',
        });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'Embed Popup Closed',
          expect.objectContaining({
            embedToken: 'token-123',
          })
        );
      });
    });

    describe('conversationRestarted', () => {
      it('should track conversation restart event', () => {
        analytics.conversationRestarted({
          demoId: 'demo-123',
          source: 'experience',
        });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'Conversation Restarted',
          expect.objectContaining({
            source: 'experience',
          })
        );
      });
    });

    describe('demoError', () => {
      it('should track demo error event', () => {
        analytics.demoError({
          demoId: 'demo-123',
          error: 'Connection timeout',
          source: 'embed',
        });

        expect(mixpanel.track).toHaveBeenCalledWith(
          'Demo Error',
          expect.objectContaining({
            error: 'Connection timeout',
            source: 'embed',
          })
        );
      });
    });
  });
});
