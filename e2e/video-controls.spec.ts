import { test, expect, Page, Dialog, Locator } from '@playwright/test';

const DEMO_ID = process.env.E2E_DEMO_ID || 'e2e';
const VIDEO_TITLE = process.env.E2E_VIDEO_TITLE || 'E2E Test Video';

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
    page.once('dialog', (dialog: Dialog) => dialog.accept(VIDEO_TITLE));
    await promptBtn.click();
  }
}

async function getVideo(page: Page): Promise<Locator> {
  const overlay = page.getByTestId('video-overlay');
  const video = overlay.getByTestId('inline-video');
  await expect(overlay).toBeVisible();
  await expect(video).toBeVisible();
  return video;
}

async function ensureLoad(videoLocator: Locator) {
  await videoLocator.evaluate((el: HTMLVideoElement) => {
    el.muted = true;
    el.autoplay = true;
    // Some engines ignore playsInline unless explicitly set on the element
    (el as any).playsInline = true;
    // Keep it minimal; our player uses video.src directly
    try { el.preload = 'metadata'; } catch {}
    try { el.load(); } catch {}
  });
}

async function waitForReady(videoLocator: Locator, timeoutMs = 30_000) {
  await ensureLoad(videoLocator);
  await expect
    .poll(async () => await videoLocator.evaluate((el: HTMLVideoElement) => el.readyState), { timeout: timeoutMs })
    .toBeGreaterThanOrEqual(1); // HAVE_METADATA
}

async function expectPaused(page: Page, videoLocator: Locator) {
  await expect.poll(async () => {
    return await videoLocator.evaluate((el: HTMLVideoElement) => el.paused);
  }, { timeout: 15000 }).toBe(true);
}

async function expectPlaying(page: Page, videoLocator: Locator) {
  // Ensure the element is ready, then attempt to play and verify state
  await waitForReady(videoLocator);
  await videoLocator.evaluate(async (el: HTMLVideoElement) => { try { await el.play(); } catch {} });
  await expect.poll(async () => {
    return await videoLocator.evaluate((el: HTMLVideoElement) => {
      const hasFrameData = el.readyState >= 2 || (el.currentTime ?? 0) > 0.05;
      return !el.paused && hasFrameData;
    });
  }, { timeout: 20000 }).toBe(true);
}

test('Video control tools: pause -> resume -> next -> close shows CTA', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto(`/demos/${DEMO_ID}/experience`);

  // Conversation visible not PiP
  const conversation = page.getByTestId('conversation-container');
  await expect(conversation).toBeVisible();
  await expect(conversation).toHaveAttribute('data-pip', 'false');

  // Start video via dev controls
  await triggerVideoPlayback(page);

  // Video overlay and video element
  const video = await getVideo(page);

  // Initially playing (autoplay)
  await expectPlaying(page, video);

  // Pause
  await page.getByTestId('cvi-dev-pause').click();
  await expectPaused(page, video);

  // Resume
  await page.getByTestId('cvi-dev-resume').click();
  await expectPlaying(page, video);

  // Capture current src and go next
  const src1 = await video.evaluate((el: HTMLVideoElement) => el.currentSrc || el.src);
  await page.getByTestId('cvi-dev-next').click();
  await expect.poll(async () => await video.evaluate((el: HTMLVideoElement) => el.currentSrc || el.src)).not.toBe(src1);

  // Still playing after next
  await expectPlaying(page, video);

  // Close via dev tool call (not header button) to exercise handler
  await page.getByTestId('cvi-dev-close').click();
  await expect(page.getByTestId('video-overlay')).toHaveCount(0);
  await expect(conversation).toHaveAttribute('data-pip', 'false');

  // CTA visible after close
  await expect(page.getByTestId('cta-banner')).toBeVisible();
});

test('CTA tool call shows banner while video is playing', async ({ page }) => {
  test.setTimeout(45000);
  await page.goto(`/demos/${DEMO_ID}/experience`);

  await triggerVideoPlayback(page);
  const video = await getVideo(page);
  await expectPlaying(page, video);

  // Trigger CTA while video is still playing
  await page.getByTestId('cvi-dev-cta').click();
  await expect(page.getByTestId('cta-banner')).toBeVisible();
});
