/**
 * Custom CSS styles for Picture-in-Picture video layout.
 * Used when video is playing and conversation is minimized.
 * - Hides ALL video previews and containers
 * - Shows ONLY floating control buttons (end, mic, video)
 * - Domo agent + User shown in DualPipOverlay (circular thumbnails on bottom-left)
 */
export const pipStyles = `
  .pip-video-layout {
    position: fixed !important;
    bottom: 16px !important;
    right: 16px !important;
    width: auto !important;
    height: auto !important;
    min-width: 0 !important;
    min-height: 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    z-index: 50 !important;
  }

  /* Hide the entire main container/wrapper */
  .pip-video-layout > div:first-child {
    display: none !important;
  }

  /* Hide ALL video elements and their containers */
  .pip-video-layout [class*="mainVideoContainer"],
  .pip-video-layout [class*="videoContainer"],
  .pip-video-layout [class*="selfViewContainer"],
  .pip-video-layout [class*="Video"],
  .pip-video-layout [class*="video"],
  .pip-video-layout video,
  .pip-video-layout [class*="tile"],
  .pip-video-layout [class*="Tile"],
  .pip-video-layout [class*="participant"],
  .pip-video-layout [class*="Participant"] {
    display: none !important;
  }

  /* Style the control bar as floating buttons only */
  .pip-video-layout [class*="footer"],
  .pip-video-layout [class*="controlBar"],
  .pip-video-layout [class*="Footer"],
  .pip-video-layout [class*="ControlBar"],
  .pip-video-layout [class*="tray"],
  .pip-video-layout [class*="Tray"] {
    position: relative !important;
    background: rgba(0, 0, 0, 0.6) !important;
    backdrop-filter: blur(8px) !important;
    border: none !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
    padding: 8px 12px !important;
    border-radius: 24px !important;
    margin: 0 !important;
    width: auto !important;
    min-width: 0 !important;
  }

  /* Button container - horizontal layout */
  .pip-video-layout [class*="footerControls"],
  .pip-video-layout [class*="controls"],
  .pip-video-layout [class*="Controls"] {
    display: flex !important;
    flex-direction: row !important;
    gap: 8px !important;
    justify-content: center !important;
    align-items: center !important;
  }

  /* Style the buttons */
  .pip-video-layout button {
    width: 44px !important;
    height: 44px !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* Hide any labels/text on buttons */
  .pip-video-layout [class*="label"],
  .pip-video-layout [class*="Label"],
  .pip-video-layout [class*="text"],
  .pip-video-layout [class*="name"],
  .pip-video-layout [class*="Name"] {
    display: none !important;
  }
`;
