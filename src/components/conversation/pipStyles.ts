/**
 * Custom CSS styles for Picture-in-Picture video layout.
 * Used when video is playing and conversation is minimized.
 * - Hides ALL video views (agent shown in DualPipOverlay on bottom-left)
 * - Shows ONLY floating control buttons (no container)
 */
export const pipStyles = `
  .pip-video-layout {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    justify-content: flex-end;
    background: transparent !important;
  }

  /* Hide ALL video containers - both agent and user */
  .pip-video-layout [class*="mainVideoContainer"],
  .pip-video-layout [class*="videoContainer"],
  .pip-video-layout [class*="selfViewContainer"],
  .pip-video-layout video {
    display: none !important;
  }

  /* Make footer transparent - just floating buttons */
  .pip-video-layout [class*="footer"],
  .pip-video-layout [class*="controlBar"],
  .pip-video-layout [class*="Footer"],
  .pip-video-layout [class*="ControlBar"] {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 8px !important;
  }

  .pip-video-layout [class*="footerControls"],
  .pip-video-layout [class*="controls"] {
    gap: 8px !important;
    justify-content: flex-end !important;
  }
`;
