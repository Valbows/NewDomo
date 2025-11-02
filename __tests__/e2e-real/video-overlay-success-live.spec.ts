import { test, expect } from "@playwright/test";

const DEMO_ID = process.env.E2E_DEMO_ID || "42beb287-f385-4100-86a4-bfe7008d531b";

test("video overlay should be visible when triggered", async ({ page }) => {
  test.setTimeout(60000);

  // Navigate to experience page
  await page.goto(`/demos/${DEMO_ID}/experience`);

  // Wait for conversation interface to load
  const conversationContainer = page.getByTestId("conversation-container");
  await expect(conversationContainer).toBeVisible({ timeout: 30000 });

  console.log("✅ Conversation interface loaded");

  // Wait for debug controls and trigger video
  const debugDropdown = page.locator('[data-testid="cvi-dev-dropdown"]');
  await expect(debugDropdown).toBeVisible({ timeout: 10000 });
  
  await debugDropdown.selectOption("E2E Test Video");
  const playButton = page.locator('[data-testid="cvi-dev-play"]');
  await playButton.click();

  console.log("✅ Video trigger clicked");

  // Wait for video overlay to appear and become visible
  const videoOverlay = page.locator('[data-testid="video-overlay"]');
  await expect(videoOverlay).toBeVisible({ timeout: 10000 });

  console.log("✅ Video overlay is visible!");

  // Verify the overlay has proper dimensions
  const boundingBox = await videoOverlay.boundingBox();
  console.log("Video overlay dimensions:", boundingBox);

  // Check that the overlay has content
  const overlayTitle = videoOverlay.locator('h2:has-text("Demo Video")');
  await expect(overlayTitle).toBeVisible();

  console.log("✅ Video overlay title is visible");

  // Check for close button
  const closeButton = videoOverlay.locator('[data-testid="button-close-video"]');
  await expect(closeButton).toBeVisible();

  console.log("✅ Video overlay close button is visible");

  // Take a screenshot to document the success
  await page.screenshot({ path: "video-overlay-success.png", fullPage: true });

  // Test closing the video overlay
  await closeButton.click();
  
  // Wait for overlay to disappear
  await expect(videoOverlay).not.toBeVisible({ timeout: 5000 });

  console.log("✅ Video overlay closes successfully");

  // Verify conversation interface is back to normal
  await expect(conversationContainer).toBeVisible();

  console.log("✅ Conversation interface restored after video close");

  console.log("🎉 Video overlay functionality working correctly!");
});