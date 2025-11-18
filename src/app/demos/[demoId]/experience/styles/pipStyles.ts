// Custom styles for PiP video layout
export const pipStyles = `
  .pip-video-layout {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .pip-video-layout [class*="mainVideoContainer"] {
    flex: 1;
    min-height: 0;
    position: relative;
  }

  .pip-video-layout [class*="selfViewContainer"] {
    position: relative !important;
    bottom: auto !important;
    right: auto !important;
    left: auto !important;
    z-index: 1;
    margin-top: 8px;
    align-self: center;
  }

  .pip-video-layout [class*="previewVideoContainer"] {
    width: 80px !important;
    height: 60px !important;
    max-height: 60px !important;
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.2);
  }

  .pip-video-layout [class*="previewVideo"] {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }
`;
