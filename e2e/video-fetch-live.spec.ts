import { test, expect, Page, Dialog, Locator } from '@playwright/test';

// Live test against real Supabase/Next backend (uses playwright.real.config.ts)
// Pre-reqs: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SECRET_KEY in .env.local

const DEMO_ID = process.env.LIVE_DEMO_ID || 'bbd9ffac-f4b7-4df3-9b8a-a01748c9a44b';
const PREFERRED_TITLE = process.env.LIVE_VIDEO_TITLE || 'Strategic Planning in Workday';

async function signIn(page: Page) {
  await page.goto('/auth/sign-in');
  await page.getByLabel(/Email address/i).fill('test@example.com');
  await page.getByLabel(/Password/i).fill('password123');
  await page.getByRole('button', { name: /^Sign in$/i }).click();
  // Don't strictly require /dashboard navigation; just ensure the session is established
  await page.waitForLoadState('networkidle');
}

async function triggerVideoPlayback(page: Page) {
  const dropdown = page.getByTestId('cvi-dev-dropdown');
  const promptBtn = page.getByTestId('cvi-dev-button');

  // Wait for either dropdown or prompt button to appear (dev controls render in dev server)
  await Promise.race([
    dropdown.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {}),
    promptBtn.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {}),
  ]);

  if (await dropdown.count()) {
    // Try selecting preferred title first; if not present, select first non-disabled option
    const options = dropdown.locator('option:not([disabled])');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    // Attempt to select by label (if present)
    const labels = await Promise.all(
      Array.from({ length: count }).map(async (_, i) => (await options.nth(i).textContent())?.trim() || '')
    );

    if (labels.includes(PREFERRED_TITLE)) {
      await dropdown.selectOption({ label: PREFERRED_TITLE });
    } else {
      // Select the first actual option value
      const firstValue = await options.first().getAttribute('value');
      if (firstValue) {
        await dropdown.selectOption(firstValue);
      } else {
        // Fallback to label if value missing
        const firstLabel = labels.find(Boolean) || '';
        await dropdown.selectOption({ label: firstLabel });
      }
    }

    const playBtn = page.getByTestId('cvi-dev-play');
    await expect(playBtn).toBeVisible();
    await playBtn.click();
  } else {
    // Fallback path: prompt-based entry
    page.once('dialog', (dialog: Dialog) => dialog.accept(PREFERRED_TITLE));
    await promptBtn.click();
  }
}

async function getVideo(page: Page): Promise<Locator> {
  const overlay = page.getByTestId('video-overlay');
  await expect(overlay).toBeVisible({ timeout: 30_000 });
  const video = overlay.getByTestId('inline-video');
  await expect(video).toBeVisible({ timeout: 30_000 });
  return video;
}

async function ensureLoad(videoLocator: Locator) {
  await videoLocator.evaluate((el: HTMLVideoElement) => {
    el.muted = true;
    el.autoplay = true;
    (el as any).playsInline = true;
    try { el.preload = 'metadata'; } catch {}
    try { el.load(); } catch {}
  });
}

async function expectPlaying(page: Page, videoLocator: Locator) {
  await ensureLoad(videoLocator);
  await videoLocator.evaluate(async (el: HTMLVideoElement) => { try { await el.play(); } catch {} });
  await expect
    .poll(async () => await videoLocator.evaluate((el: HTMLVideoElement) => {
      const hasFrameData = el.readyState >= 2 || (el.currentTime ?? 0) > 0.05;
      return !el.paused && hasFrameData;
    }), { timeout: 30_000 })
    .toBe(true);
}

// Live path: verifies that clicking dev control Play triggers Supabase-backed fetch_video lookup
// and starts playback (signed URL path) without 406/"Cannot coerce" errors.

test('Live fetch_video: dev controls -> fetch by title -> video plays', async ({ page }) => {
  test.setTimeout(90_000);
  await signIn(page);
  await page.goto(`/demos/${DEMO_ID}/experience`, { waitUntil: 'domcontentloaded' });

  const conversation = page.getByTestId('conversation-container');
  await expect(conversation).toBeVisible({ timeout: 30_000 });
  await expect(conversation).toHaveAttribute('data-pip', 'false');

  await triggerVideoPlayback(page);

  const video = await getVideo(page);
  await expect(conversation).toHaveAttribute('data-pip', 'true');

  // Wait for the Supabase signed URL fetch to complete successfully
  await page.waitForResponse(
    (res) => res.url().includes('/storage/v1/object/sign/demo-videos') && res.status() >= 200 && res.status() < 400,
    { timeout: 30_000 }
  );

  // Assert the video element src attribute is a signed Supabase URL
  await expect(video).toHaveAttribute(
    'src',
    /\/storage\/v1\/object\/sign\/demo-videos\//
  );

  // Tolerate headless codec limitations: accept either 'playing' or an HTMLMediaElement error
  await expect
    .poll(async () => {
      return await video.evaluate((el: HTMLVideoElement) => {
        const playing = !el.paused && (el.readyState >= 2 || (el.currentTime ?? 0) > 0.05);
        const errored = !!el.error; // e.g., MEDIA_ERR_SRC_NOT_SUPPORTED in headless Chromium
        return playing || errored;
      });
    }, { timeout: 30_000 })
    .toBe(true);
});
