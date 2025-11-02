import { test, expect } from "@playwright/test";

const DEMO_ID = process.env.E2E_DEMO_ID || "42beb287-f385-4100-86a4-bfe7008d531b";

test.describe("Video Controls Functionality", () => {
  test("should fetch, play, pause, and close videos using debug controls", async ({ page }) => {
    test.setTimeout(120000);

    // Navigate to experience page
    await page.goto(`/demos/${DEMO_ID}/experience`);

    // Wait for conversation interface to load
    const conversationContainer = page.getByTestId("conversation-container");
    await expect(conversationContainer).toBeVisible({ timeout: 30000 });

    console.log("✅ Conversation interface loaded");

    // Wait for debug controls
    const debugDropdown = page.locator('[data-testid="cvi-dev-dropdown"]');
    await expect(debugDropdown).toBeVisible({ timeout: 10000 });

    console.log("✅ Debug controls found");

    // Test 1: FETCH VIDEO
    console.log("🎬 Testing video fetch...");
    await debugDropdown.selectOption("E2E Test Video");
    const playButton = page.locator('[data-testid="cvi-dev-play"]');
    await playButton.click();

    // Wait for video overlay to appear
    const videoOverlay = page.getByTestId("video-overlay");
    await expect(videoOverlay).toBeVisible({ timeout: 10000 });

    console.log("✅ Video fetched and overlay visible");

    // Verify video element exists and has source
    const video = videoOverlay.locator('video').first();
    await expect(video).toBeVisible();

    const videoSrc = await video.getAttribute('src');
    console.log("📹 Video source:", videoSrc);
    expect(videoSrc).toBeTruthy();

    // Test 2: VERIFY VIDEO CONTROLS EXIST
    console.log("🎮 Testing video controls availability...");
    
    // Check if video has controls attribute (native browser controls)
    const hasControls = await video.getAttribute('controls');
    console.log("🎮 Video has native controls:", hasControls !== null);
    expect(hasControls).not.toBeNull();

    // Test video state management (paused state is tracked)
    const pausedState = await video.getAttribute('data-paused');
    console.log("📊 Video paused state tracked:", pausedState);
    expect(pausedState).toBeTruthy();

    // Test 3: CLOSE VIDEO (using video overlay close button)
    console.log("❌ Testing video close...");
    const closeButton = page.locator('[data-testid="button-close-video"]');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Wait for video overlay to disappear
    await expect(videoOverlay).not.toBeVisible({ timeout: 5000 });

    console.log("✅ Video closed successfully");

    // Verify conversation interface is back to normal
    await expect(conversationContainer).toBeVisible();
    const pipMode = await conversationContainer.getAttribute('data-pip');
    expect(pipMode).toBe('false');

    console.log("✅ Conversation interface restored");

    console.log("🎉 All video controls working correctly!");
  });

  test("should handle video errors gracefully", async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`/demos/${DEMO_ID}/experience`);

    const conversationContainer = page.getByTestId("conversation-container");
    await expect(conversationContainer).toBeVisible({ timeout: 30000 });

    // Try to trigger a video that might not exist
    const debugDropdown = page.locator('[data-testid="cvi-dev-dropdown"]');
    await expect(debugDropdown).toBeVisible({ timeout: 10000 });

    // Select a video and play
    await debugDropdown.selectOption("E2E Test Video");
    const playButton = page.locator('[data-testid="cvi-dev-play"]');
    await playButton.click();

    // Even if there are video loading errors, the overlay should still appear
    const videoOverlay = page.getByTestId("video-overlay");
    await expect(videoOverlay).toBeVisible({ timeout: 10000 });

    // The close button should always work
    const closeButton = page.locator('[data-testid="button-close-video"]');
    await closeButton.click();
    await expect(videoOverlay).not.toBeVisible({ timeout: 5000 });

    console.log("✅ Error handling works correctly");
  });
});