// UI_STATES.ts
export enum UIState {
  LOADING = 'loading',           // Connecting to Tavus
  AGENT_THINKING = 'thinking',   // Processing user input  
  VIDEO_PLAYING = 'playing',     // Demo content active
  VIDEO_PAUSED = 'paused',       // Q&A interruption
  AGENT_SPEAKING = 'speaking',   // TTS active
  SERVICE_ERROR = 'error',       // Fallback UI
  SERVICE_DEGRADED = 'degraded', // Partial functionality (e.g., TTS fails)
  DEMO_COMPLETE = 'complete',    // Final CTA state
  IDLE = 'idle'                  // Default state
}
