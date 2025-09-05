import { test, expect, Page, Dialog } from '@playwright/test';

// Configurable via env; falls back to simple defaults that work with E2E mode stubs
const DEMO_ID = process.env.E2E_DEMO_ID || 'e2e';
const VIDEO_TITLE = process.env.E2E_VIDEO_TITLE || 'E2E Test Video';

// Helper to optionally use dropdown path or prompt path for manual tool call
async function triggerVideoPlayback(page: Page) {
  const dropdown = page.getByTestId('cvi-dev-dropdown');
  const promptBtn = page.getByTestId('cvi-dev-button');
  // Wait deterministically for dev controls to mount
  await Promise.race([
    dropdown.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {}),
    promptBtn.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {}),
  ]);
  if (await dropdown.count()) {
    await dropdown.selectOption({ label: VIDEO_TITLE });
    const playBtn = page.getByTestId('cvi-dev-play');
    await expect(playBtn).toBeVisible();
    await playBtn.click();
  } else {
    // Fallback: prompt button
    page.once('dialog', (dialog: Dialog) => dialog.accept(VIDEO_TITLE));
    await promptBtn.click();
  }
}

// End-to-end validation of Picture-in-Picture (PiP) flow
// - Conversation starts full screen
// - Trigger video playback via dev controls (E2E mode)
// - Conversation goes PiP, video overlay appears
// - Close video, conversation returns full screen, CTA shows

test('PiP flow: conversation -> video -> close -> CTA', async ({ page }) => {
  // Allow extra time for media/network before final assertions
  test.setTimeout(60_000);
  await page.goto(`/demos/${DEMO_ID}/experience`, { waitUntil: 'domcontentloaded' });

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
  const cta = page.getByTestId('cta-banner');
  await expect(cta).toBeVisible();

  // Assert CTA anchor uses the ADMIN-configured URL (admin fields take precedence over metadata)
  const ctaAnchor = cta.locator('a');
  await expect(ctaAnchor).toHaveAttribute('href', 'https://example.com/admin-start');
});
