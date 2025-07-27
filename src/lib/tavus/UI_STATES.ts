// UI_STATES.ts
export enum UIState {
  IDLE = 'idle',
  LOADING = 'loading',           // Connecting to Tavus
  CONVERSATION = 'conversation', // Active Tavus conversation
  AGENT_THINKING = 'thinking',   // Processing user input  
  VIDEO_PLAYING = 'playing',     // Demo content active
  VIDEO_PAUSED = 'paused',       // Q&A interruption
  AGENT_SPEAKING = 'speaking',   // TTS active
  SERVICE_ERROR = 'error',       // Fallback UI
  SERVICE_DEGRADED = 'degraded', // Partial functionality (e.g., TTS fails)
  DEMO_COMPLETE = 'complete'     // Final CTA state
}
