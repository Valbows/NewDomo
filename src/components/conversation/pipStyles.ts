/**
 * Custom CSS styles for Picture-in-Picture video layout.
 * Used when video is playing and conversation is minimized.
 *
 * DOM Structure when pip-video-layout is applied:
 * <div class="pip-video-layout">                    -- [1] pip wrapper
 *   <div class="">                                  -- [2] empty wrapper from DemoExperienceView
 *     <div class="w-full h-full">                   -- [3] TavusConversationCVI outer wrapper
 *       <div class="container">                     -- [4] Conversation component (CSS module)
 *         <div class="videoContainer">              -- [5] holds videos (HIDE)
 *         </div>
 *         <div class="footer">                      -- [6] controls bar (SHOW)
 *           <div class="footerControls">            -- [7] buttons container
 *         </div>
 *         <audio />                                 -- DailyAudio
 *       </div>
 *       <!-- dev only: debug panel (absolute positioned) -->
 *     </div>
 *   </div>
 * </div>
 */
export const pipStyles = `
  /* [1] Main PiP wrapper - transparent, auto-sized */
  .pip-video-layout {
    width: auto !important;
    height: auto !important;
    min-width: 0 !important;
    min-height: 0 !important;
    max-width: none !important;
    max-height: none !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    overflow: visible !important;
  }

  /* [2] Empty wrapper from DemoExperienceView */
  .pip-video-layout > div {
    width: auto !important;
    height: auto !important;
    background: transparent !important;
  }

  /* [3] TavusConversationCVI outer wrapper */
  .pip-video-layout > div > div {
    width: auto !important;
    height: auto !important;
    background: transparent !important;
  }

  /* [4] Conversation container - make transparent and shrink */
  .pip-video-layout > div > div > div:first-child {
    width: auto !important;
    height: auto !important;
    background: transparent !important;
    border-radius: 0 !important;
    max-height: none !important;
    aspect-ratio: unset !important;
    animation: none !important;
    overflow: visible !important;
    display: flex !important;
    flex-direction: column !important;
  }

  /* Hide ALL video elements */
  .pip-video-layout video {
    display: none !important;
    visibility: hidden !important;
    width: 0 !important;
    height: 0 !important;
    position: absolute !important;
  }

  /* [5] Hide the videoContainer (first child of Conversation container) */
  .pip-video-layout > div > div > div:first-child > div:first-child {
    display: none !important;
    visibility: hidden !important;
    width: 0 !important;
    height: 0 !important;
    position: absolute !important;
  }

  /* [6] Style the footer (second child of Conversation container) */
  .pip-video-layout > div > div > div:first-child > div:nth-child(2) {
    position: relative !important;
    bottom: unset !important;
    left: unset !important;
    right: unset !important;
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
    background: rgba(0, 0, 0, 0.85) !important;
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5) !important;
    padding: 12px 16px !important;
    border-radius: 28px !important;
    margin: 0 !important;
    width: auto !important;
    gap: 12px !important;
    justify-content: center !important;
    align-items: center !important;
    z-index: 100 !important;
  }

  /* [7] Footer controls container (inside footer) */
  .pip-video-layout > div > div > div:first-child > div:nth-child(2) > div {
    display: flex !important;
    gap: 12px !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* Style all buttons in the controls */
  .pip-video-layout button {
    width: 48px !important;
    height: 48px !important;
    min-width: 48px !important;
    min-height: 48px !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: rgba(255, 255, 255, 0.12) !important;
    border: none !important;
    transition: background 0.2s ease !important;
    visibility: visible !important;
    opacity: 1 !important;
    cursor: pointer !important;
  }

  .pip-video-layout button:hover {
    background: rgba(255, 255, 255, 0.25) !important;
  }

  /* Leave/End button - last button in controls, should be red */
  .pip-video-layout > div > div > div:first-child > div:nth-child(2) button:last-child {
    background: rgba(239, 68, 68, 0.9) !important;
  }

  .pip-video-layout > div > div > div:first-child > div:nth-child(2) button:last-child:hover {
    background: rgba(239, 68, 68, 1) !important;
  }

  /* Ensure SVG icons are visible */
  .pip-video-layout svg {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    width: 24px !important;
    height: 24px !important;
  }

  /* Hide DailyAudio element */
  .pip-video-layout audio {
    display: none !important;
  }

  /* Hide dev debug panel when in PiP mode (sibling to Conversation container) */
  .pip-video-layout > div > div > div:not(:first-child) {
    display: none !important;
  }
`;
