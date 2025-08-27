import { test, expect, Page, Dialog } from '@playwright/test';

// Configurable via env; falls back to simple defaults that work with E2E mode stubs
const DEMO_ID = process.env.E2E_DEMO_ID || 'e2e';
const VIDEO_TITLE = process.env.E2E_VIDEO_TITLE || 'E2E Test Video';

// Helper to optionally use dropdown path or prompt path for manual tool call
async function triggerVideoPlayback(page: Page) {
  const dropdown = page.getByTestId('cvi-dev-dropdown');
  if (await dropdown.count()) {
    await dropdown.selectOption({ label: VIDEO_TITLE });
    await page.getByTestId('cvi-dev-play').click();
  } else {
    // Fallback: prompt button
    page.once('dialog', (dialog: Dialog) => dialog.accept(VIDEO_TITLE));
    await page.getByTestId('cvi-dev-button').click();
  }
}

// Drive the overlay video to end naturally; if metadata is slow, simulate an 'ended' event as a deterministic fallback
async function endVideoNaturally(page: Page) {
  // Select the video element inside the overlay only
  const overlay = page.getByTestId('video-overlay');
  const videoLocator = overlay.locator('video');
  await expect(videoLocator).toBeVisible();

  // Evaluate within the page context and wait for the 'ended' event
  await videoLocator.evaluate((el: HTMLVideoElement) => new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => { if (!settled) { settled = true; resolve(); } };

    // Resolve when the video ends
    el.addEventListener('ended', finish, { once: true });

    // Try to drive the video to a near-end position
    const tryNearEnd = () => {
      try {
        el.muted = true; // satisfy autoplay
        el.playbackRate = 16;
        if (Number.isFinite(el.duration) && el.duration > 0) {
          el.currentTime = Math.max(0, el.duration - 0.1);
        }
        void el.play();
      } catch {}
    };

    if (el.readyState >= 1) {
      tryNearEnd();
    } else {
      el.addEventListener('loadedmetadata', () => tryNearEnd(), { once: true });
    }

    // Safety fallback: if metadata never arrives in CI, simulate a natural end
    const fallbackMs = 6000;
    setTimeout(() => {
      if (!settled) {
        try { el.dispatchEvent(new Event('ended')); } catch {}
      }
    }, fallbackMs);
  }));
}

// End-to-end validation that CTA appears after natural video end (no manual close)
// Flow:
// - Conversation starts full screen
// - Trigger video playback via dev controls (E2E mode)
// - Seek to near end to trigger 'ended'
// - Verify CTA appears after overlay disappears

test('PiP flow: conversation -> video -> natural end -> CTA', async ({ page }) => {
  test.setTimeout(45000);
  await page.goto(`/demos/${DEMO_ID}/experience`);

  const conversation = page.getByTestId('conversation-container');
  await expect(conversation).toBeVisible();
  await expect(conversation).toHaveAttribute('data-pip', 'false');

  // Start playback
  await triggerVideoPlayback(page);

  // Video overlay visible, conversation PiP
  const videoOverlay = page.getByTestId('video-overlay');
  await expect(videoOverlay).toBeVisible();
  await expect(conversation).toHaveAttribute('data-pip', 'true');

  // CTA hidden while playing
  await expect(page.locator('[data-testid="cta-banner"]')).toHaveCount(0);

  // Let the video end naturally (fast-forward)
  await endVideoNaturally(page);

  // Overlay is removed; conversation back to full
  await expect(page.getByTestId('video-overlay')).toHaveCount(0);
  await expect(conversation).toHaveAttribute('data-pip', 'false');

  // CTA banner should now be visible
  const ctaBanner = page.getByTestId('cta-banner');
  await expect(ctaBanner).toBeVisible();

  // Optional: Assert CTA URL is the admin-configured URL from the E2E stub
  const ctaAnchor = ctaBanner.locator('a');
  await expect(ctaAnchor).toHaveAttribute('href', 'https://example.com/admin-start');
});
