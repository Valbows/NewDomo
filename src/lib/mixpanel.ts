import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = '3a185c402520defd864bd67568f6397f';

// Initialize Mixpanel
let initialized = false;

export function initMixpanel() {
  if (initialized || typeof window === 'undefined') return;

  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: true,
    persistence: 'localStorage',
    autocapture: true,
  });

  initialized = true;
}

// Track an event
export function track(event: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  initMixpanel();
  mixpanel.track(event, {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

// Identify a user
export function identify(userId: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  initMixpanel();
  mixpanel.identify(userId);

  if (properties) {
    mixpanel.people.set(properties);
  }
}

// Reset user (on logout)
export function reset() {
  if (typeof window === 'undefined') return;

  initMixpanel();
  mixpanel.reset();
}

// ============================================
// Demo-specific tracking events
// ============================================

export const analytics = {
  // Demo lifecycle
  demoStarted: (props: {
    demoId: string;
    demoName: string;
    source: 'embed' | 'experience';
    embedToken?: string;
  }) => {
    track('Demo Started', props);
  },

  demoEnded: (props: {
    demoId: string;
    demoName: string;
    source: 'embed' | 'experience';
    durationSeconds?: number;
    conversationId?: string;
  }) => {
    track('Demo Ended', props);
  },

  // Video events
  videoPlayed: (props: {
    demoId: string;
    videoUrl: string;
    videoTitle?: string;
  }) => {
    track('Video Played', props);
  },

  videoEnded: (props: {
    demoId: string;
    videoUrl: string;
    videoTitle?: string;
  }) => {
    track('Video Ended', props);
  },

  videoClosed: (props: {
    demoId: string;
    videoUrl: string;
    videoTitle?: string;
  }) => {
    track('Video Closed', props);
  },

  videoPaused: (props: {
    demoId: string;
    videoUrl: string;
    videoTitle?: string;
    pausedAt: number;
    formattedTime: string;
  }) => {
    track('Video Paused', props);
  },

  videoSeeked: (props: {
    demoId: string;
    videoUrl: string;
    videoTitle?: string;
    seekedTo: number;
    formattedTime: string;
  }) => {
    track('Video Seeked', props);
  },

  videoContextSent: (props: {
    demoId: string;
    context: string;
    conversationId?: string;
  }) => {
    track('Video Context Sent', props);
  },

  // CTA events
  ctaShown: (props: {
    demoId: string;
    ctaTitle?: string;
    ctaButtonText?: string;
  }) => {
    track('CTA Shown', props);
  },

  ctaClicked: (props: {
    demoId: string;
    ctaTitle?: string;
    ctaButtonUrl?: string;
  }) => {
    track('CTA Clicked', props);
  },

  ctaClosed: (props: {
    demoId: string;
  }) => {
    track('CTA Closed', props);
  },

  // Embed events
  embedLoaded: (props: {
    embedToken: string;
    demoId?: string;
    referrer?: string;
  }) => {
    track('Embed Loaded', props);
  },

  embedPopupOpened: (props: {
    embedToken: string;
    demoId?: string;
  }) => {
    track('Embed Popup Opened', props);
  },

  embedPopupClosed: (props: {
    embedToken: string;
    demoId?: string;
  }) => {
    track('Embed Popup Closed', props);
  },

  // Conversation events
  conversationRestarted: (props: {
    demoId: string;
    source: 'embed' | 'experience';
  }) => {
    track('Conversation Restarted', props);
  },

  // Error events
  demoError: (props: {
    demoId?: string;
    error: string;
    source: 'embed' | 'experience';
  }) => {
    track('Demo Error', props);
  },
};

export default mixpanel;
