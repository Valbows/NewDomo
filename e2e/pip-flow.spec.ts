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

// End-to-end validation of Picture-in-Picture (PiP) flow
// - Conversation starts full screen
// - Trigger video playback via dev controls (E2E mode)
// - Conversation goes PiP, video overlay appears
// - Close video, conversation returns full screen, CTA shows

test('PiP flow: conversation -> video -> close -> CTA', async ({ page }) => {
  await page.goto(`/demos/${DEMO_ID}/experience`);

  const conversation = page.getByTestId('conversation-container');
  await expect(conversation).toBeVisible();
  await expect(conversation).toHaveAttribute('data-pip', 'false');

  // Ensure dev controls are available in E2E mode
  // (they are rendered when NEXT_PUBLIC_E2E_TEST_MODE=true)
  await triggerVideoPlayback(page);

  // Video overlay should appear and conversation should be PiP
  const videoOverlay = page.getByTestId('video-overlay');
  await expect(videoOverlay).toBeVisible();
  await expect(conversation).toHaveAttribute('data-pip', 'true');

  // CTA should be hidden while video is playing
  await expect(page.locator('[data-testid="cta-banner"]')).toHaveCount(0);

  // Close video via header close button
  await page.getByTestId('button-close-video').click();

  // Video overlay should be removed; conversation back to full
  await expect(page.getByTestId('video-overlay')).toHaveCount(0);
  await expect(conversation).toHaveAttribute('data-pip', 'false');

  // CTA banner should now be visible
  await expect(page.getByTestId('cta-banner')).toBeVisible();

  // Assert CTA anchor uses the ADMIN-configured URL (admin fields take precedence over metadata)
  const ctaAnchor = page.locator('[data-testid="cta-banner"] a');
  await expect(ctaAnchor).toHaveAttribute('href', 'https://example.com/admin-start');
});
