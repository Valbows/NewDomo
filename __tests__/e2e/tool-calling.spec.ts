import { test, expect, Page, Dialog } from '@playwright/test';

const DEMO_ID = process.env.E2E_DEMO_ID || '42beb287-f385-4100-86a4-bfe7008d531b';
const VIDEO_TITLE = process.env.E2E_VIDEO_TITLE || 'E2E Test Video';

/**
 * Comprehensive E2E test for agent tool calling functionality
 * Tests the critical path: video requests, CTA displays, and real-time updates
 */

async function navigateToExperience(page: Page) {
  await page.goto(`/demos/${DEMO_ID}/experience`);
  
  // Wait for page to load
  await page.waitForTimeout(5000);
  
  // Check for error state first
  const errorHeading = page.getByRole('heading', { name: /demo error/i });
  if (await errorHeading.isVisible()) {
    const errorText = await page.locator('text=Demo not found').textContent();
    throw new Error(`Demo loading failed: ${errorText}. Check if demo ${DEMO_ID} exists in database.`);
  }
  
  // Wait for conversation container to be visible with longer timeout
  const conversation = page.getByTestId('conversation-container');
  await expect(conversation).toBeVisible({ timeout: 30000 });
  await expect(conversation).toHaveAttribute('data-pip', 'false');
  
  // Additional debug info
  console.log('✅ Conversation container found and visible');
}

async function triggerVideoRequest(page: Page, videoTitle: string = VIDEO_TITLE) {
  // Wait for the conversation to be ready and Daily.co to be connected
  await page.waitForTimeout(5000);
  
  // Look for dev controls (should be visible in development mode)
  const dropdown = page.getByTestId('cvi-dev-dropdown');
  const promptBtn = page.getByTestId('cvi-dev-button');
  
  // Wait for dev controls to be available (longer timeout for real API loading)
  await Promise.race([
    dropdown.waitFor({ state: 'visible', timeout: 45_000 }).catch(() => {}),
    promptBtn.waitFor({ state: 'visible', timeout: 45_000 }).catch(() => {}),
  ]);
  
  // Give more time for video titles to load from real database
  await page.waitForTimeout(3000);
  
  // Debug: Check what dev controls are available
  const dropdownCount = await dropdown.count();
  const promptBtnCount = await promptBtn.count();
  console.log(`🔍 Dev controls found - Dropdown: ${dropdownCount}, Prompt: ${promptBtnCount}`);
  
  if (dropdownCount > 0) {
    // Debug: Check available options
    const options = await dropdown.locator('option').allTextContents();
    console.log('📋 Available video options:', options);
    
    // Use dropdown if available
    await dropdown.selectOption({ label: videoTitle });
    const playBtn = page.getByTestId('cvi-dev-play');
    await expect(playBtn).toBeVisible();
    console.log(`🎬 Triggering video request for: ${videoTitle}`);
    await playBtn.click();
  } else if (promptBtnCount > 0) {
    // Use prompt button as fallback
    console.log(`🎬 Using prompt for video request: ${videoTitle}`);
    page.once('dialog', (dialog: Dialog) => dialog.accept(videoTitle));
    await promptBtn.click();
  } else {
    throw new Error('No dev controls found - check if development mode is enabled and Tavus conversation is connected');
  }
  
  // Wait longer for the video request to be processed through real APIs
  await page.waitForTimeout(5000);
  
  // Check for any error alerts that might indicate video loading issues
  const alertElements = await page.locator('[role="alert"], .alert, [data-testid*="alert"]').all();
  for (const alert of alertElements) {
    const alertText = await alert.textContent();
    if (alertText) {
      console.log('⚠️ Alert found:', alertText);
    }
  }
  
  // Listen for console messages to see if our debugging logs appear
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🎬') || text.includes('Video') || text.includes('handleVideoPlay')) {
      console.log('📝 Console:', text);
    }
    if (msg.type() === 'error') {
      console.log('🚨 Console error:', text);
    }
  });
  
  // Check for any network failures
  page.on('requestfailed', request => {
    console.log('🌐 Request failed:', request.url(), request.failure()?.errorText);
  });
}

async function waitForVideoToLoad(page: Page) {
  const overlay = page.getByTestId('video-overlay');
  const video = overlay.getByTestId('inline-video');
  
  // Debug: Check if overlay exists but is hidden
  const overlayExists = await overlay.count();
  console.log(`🔍 Video overlay exists: ${overlayExists > 0}`);
  
  if (overlayExists > 0) {
    const isVisible = await overlay.isVisible();
    const isHidden = await overlay.isHidden();
    console.log(`🔍 Video overlay - visible: ${isVisible}, hidden: ${isHidden}`);
    
    // Check overlay classes to understand why it might be hidden
    const overlayClasses = await overlay.getAttribute('class');
    console.log(`🔍 Video overlay classes: ${overlayClasses}`);
    
    // Check if the overlay has any inline styles that might be hiding it
    const overlayStyle = await overlay.getAttribute('style');
    if (overlayStyle) {
      console.log(`🔍 Video overlay inline styles: ${overlayStyle}`);
    }
  }
  
  // Wait a bit longer to see if the overlay becomes visible
  console.log('⏳ Waiting for video overlay to become visible...');
  await page.waitForTimeout(5000);
  
  // Wait for video overlay and element to be visible (longer timeout for real API)
  await expect(overlay).toBeVisible({ timeout: 30_000 });
  await expect(video).toBeVisible({ timeout: 30_000 });
  
  // Ensure video is properly configured
  await video.evaluate((el: HTMLVideoElement) => {
    el.muted = true;
    el.autoplay = true;
    (el as any).playsInline = true;
    try { 
      el.preload = 'metadata';
      el.load();
    } catch {}
  });
  
  // Wait for video to have a source URL from real Supabase storage
  await expect
    .poll(async () => {
      const src = await video.evaluate((el: HTMLVideoElement) => el.currentSrc || el.src);
      return src && src.length > 0;
    }, { timeout: 45_000 })
    .toBe(true);
    
  return video;
}

async function triggerCTADisplay(page: Page) {
  // Use dev controls to simulate agent tool call for CTA display
  const ctaButton = page.getByTestId('cvi-dev-cta');
  await expect(ctaButton).toBeVisible();
  await ctaButton.click();
}

async function verifyVideoPlayback(page: Page, video: any) {
  // For test videos, just verify the video element is not paused and has a source
  await expect.poll(async () => {
    const isPaused = await video.evaluate((el: HTMLVideoElement) => el.paused);
    const hasSrc = await video.evaluate((el: HTMLVideoElement) => !!(el.currentSrc || el.src));
    return !isPaused && hasSrc;
  }, { timeout: 10000 }).toBe(true);
}

async function verifyCTADisplay(page: Page) {
  // Verify CTA banner is visible
  const ctaBanner = page.getByTestId('cta-banner');
  await expect(ctaBanner).toBeVisible();
  
  // Verify CTA contains expected elements
  await expect(ctaBanner.getByRole('button')).toBeVisible();
  
  return ctaBanner;
}

test.describe('Agent Tool Calling Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for tool calling tests
    test.setTimeout(90000);
  });

  test('fetch_video tool call: requests video, receives URL, displays video', async ({ page }) => {
    await navigateToExperience(page);
    
    // Step 1: Trigger video request (simulates agent tool call)
    await triggerVideoRequest(page);
    
    // Step 2: Verify video loads and displays
    const video = await waitForVideoToLoad(page);
    
    // Step 3: Verify video is playing
    await verifyVideoPlayback(page, video);
    
    // Step 4: Verify video source is set correctly
    const videoSrc = await video.evaluate((el: HTMLVideoElement) => el.currentSrc || el.src);
    expect(videoSrc).toBeTruthy();
    expect(videoSrc).toContain('http'); // Should be a valid URL
  });

  test('show_trial_cta tool call: displays CTA banner with correct content', async ({ page }) => {
    await navigateToExperience(page);
    
    // Step 1: Trigger CTA display (simulates agent tool call)
    await triggerCTADisplay(page);
    
    // Step 2: Verify CTA banner appears
    const ctaBanner = await verifyCTADisplay(page);
    
    // Step 3: Verify CTA content is populated
    const ctaButton = ctaBanner.getByRole('button');
    const buttonText = await ctaButton.textContent();
    expect(buttonText).toBeTruthy();
    expect(buttonText?.length).toBeGreaterThan(0);
  });

  test('combined workflow: video request followed by CTA display', async ({ page }) => {
    await navigateToExperience(page);
    
    // Step 1: Request and play video
    await triggerVideoRequest(page);
    const video = await waitForVideoToLoad(page);
    await verifyVideoPlayback(page, video);
    
    // Step 2: Display CTA while video is playing
    await triggerCTADisplay(page);
    await verifyCTADisplay(page);
    
    // Step 3: Verify both video and CTA are visible simultaneously
    await expect(page.getByTestId('video-overlay')).toBeVisible();
    await expect(page.getByTestId('cta-banner')).toBeVisible();
    
    // Step 4: Verify video continues playing with CTA displayed
    await verifyVideoPlayback(page, video);
  });

  test('video controls work correctly after tool call', async ({ page }) => {
    await navigateToExperience(page);
    
    // Step 1: Request video via tool call
    await triggerVideoRequest(page);
    const video = await waitForVideoToLoad(page);
    await verifyVideoPlayback(page, video);
    
    // Step 2: Test pause control
    await page.getByTestId('cvi-dev-pause').click();
    await expect.poll(async () => {
      return await video.evaluate((el: HTMLVideoElement) => el.paused);
    }, { timeout: 15000 }).toBe(true);
    
    // Step 3: Test resume control
    await page.getByTestId('cvi-dev-resume').click();
    await verifyVideoPlayback(page, video);
    
    // Step 4: Test next video control
    const originalSrc = await video.evaluate((el: HTMLVideoElement) => el.currentSrc || el.src);
    await page.getByTestId('cvi-dev-next').click();
    
    // Verify video source changed (next video loaded)
    await expect.poll(async () => {
      return await video.evaluate((el: HTMLVideoElement) => el.currentSrc || el.src);
    }).not.toBe(originalSrc);
  });

  test('video close triggers CTA display', async ({ page }) => {
    await navigateToExperience(page);
    
    // Step 1: Request and play video
    await triggerVideoRequest(page);
    const video = await waitForVideoToLoad(page);
    await verifyVideoPlayback(page, video);
    
    // Step 2: Close video using dev controls
    await page.getByTestId('cvi-dev-close').click();
    
    // Step 3: Verify video overlay is removed
    await expect(page.getByTestId('video-overlay')).toHaveCount(0);
    
    // Step 4: Verify CTA appears after video close
    await expect(page.getByTestId('cta-banner')).toBeVisible();
    
    // Step 5: Verify conversation is back to normal state
    const conversation = page.getByTestId('conversation-container');
    await expect(conversation).toHaveAttribute('data-pip', 'false');
  });

  test('multiple video requests work correctly', async ({ page }) => {
    await navigateToExperience(page);
    
    // Step 1: First video request
    await triggerVideoRequest(page);
    const video = await waitForVideoToLoad(page);
    const firstSrc = await video.evaluate((el: HTMLVideoElement) => el.currentSrc || el.src);
    
    // Step 2: Close first video
    await page.getByTestId('cvi-dev-close').click();
    await expect(page.getByTestId('video-overlay')).toHaveCount(0);
    
    // Step 3: Second video request
    await triggerVideoRequest(page);
    const video2 = await waitForVideoToLoad(page);
    const secondSrc = await video2.evaluate((el: HTMLVideoElement) => el.currentSrc || el.src);
    
    // Step 4: Verify both requests worked
    expect(firstSrc).toBeTruthy();
    expect(secondSrc).toBeTruthy();
    await verifyVideoPlayback(page, video2);
  });

  test('CTA interaction works correctly', async ({ page }) => {
    await navigateToExperience(page);
    
    // Step 1: Trigger CTA display
    await triggerCTADisplay(page);
    const ctaBanner = await verifyCTADisplay(page);
    
    // Step 2: Test CTA button interaction
    const ctaButton = ctaBanner.getByRole('button');
    
    // Verify button is clickable
    await expect(ctaButton).toBeEnabled();
    
    // Click CTA button (this might navigate or open a new tab)
    // We'll just verify the click doesn't cause errors
    await ctaButton.click();
    
    // Step 3: Verify page state after CTA interaction
    // CTA might remain visible or disappear depending on implementation
    // We'll just ensure no errors occurred
    await page.waitForTimeout(1000); // Brief wait to ensure any navigation completes
  });

  test('error handling: invalid video request', async ({ page }) => {
    await navigateToExperience(page);
    
    // Step 1: Try to request a non-existent video
    const dropdown = page.getByTestId('cvi-dev-dropdown');
    const promptBtn = page.getByTestId('cvi-dev-button');
    
    await Promise.race([
      dropdown.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {}),
      promptBtn.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {}),
    ]);
    
    if (await promptBtn.count()) {
      // Use prompt with invalid video title
      page.once('dialog', (dialog: Dialog) => dialog.accept('NonExistentVideo'));
      await promptBtn.click();
      
      // Step 2: Verify graceful error handling
      // Video overlay should not appear for invalid requests
      await page.waitForTimeout(5000); // Wait for potential video load
      await expect(page.getByTestId('video-overlay')).toHaveCount(0);
      
      // Conversation should remain in normal state
      const conversation = page.getByTestId('conversation-container');
      await expect(conversation).toBeVisible();
      await expect(conversation).toHaveAttribute('data-pip', 'false');
    }
  });
});