'use client';

import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
  onClose: () => void;
}

export function VideoPlayer({ videoUrl, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleCanPlay = async () => {
      // Autoplay the video
      await videoElement.play().catch(error => console.error("Video autoplay failed:", error));

      // Attempt to enter Picture-in-Picture mode if supported
      if (document.pictureInPictureEnabled && !videoElement.disablePictureInPicture) {
        try {
          await videoElement.requestPictureInPicture();
        } catch (error) {
          console.error("Failed to enter Picture-in-Picture mode:", error);
        }
      }
    };

    const handleLeavePip = () => {
      onClose();
    };

    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('leavepictureinpicture', handleLeavePip);

    // Clean up event listeners
    return () => {
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('leavepictureinpicture', handleLeavePip);
    };
  }, [videoUrl, onClose]);

  // This component renders the video element off-screen.
  // The browser's Picture-in-Picture API controls the visible player.
  return (
    <video
      ref={videoRef}
      src={videoUrl}
      controls
      autoPlay
      muted // Muting is often required for autoplay to work reliably
      style={{ display: 'none' }} // Hide the element from the layout
    />
  );
}
