import { test, expect } from "@playwright/test";

const DEMO_ID =
  process.env.E2E_DEMO_ID || "42beb287-f385-4100-86a4-bfe7008d531b";

test("debug experience page loading", async ({ page }) => {
  test.setTimeout(60000);

  // Navigate to experience page
  await page.goto(`/demos/${DEMO_ID}/experience`);

  // Wait a bit for the page to load
  await page.waitForTimeout(5000);

  // Take a screenshot to see what's happening
  await page.screenshot({ path: "debug-experience.png", fullPage: true });

  // Check what elements are present
  const pageContent = await page.content();
  console.log("Page title:", await page.title());
  console.log("URL:", page.url());

  // Look for any error messages
  const errorElements = await page
    .locator('[data-testid*="error"], .error, [class*="error"]')
    .all();
  for (const error of errorElements) {
    const text = await error.textContent();
    console.log("Error found:", text);
  }

  // Look for loading states
  const loadingElements = await page
    .locator('[data-testid*="loading"], .loading, [class*="loading"]')
    .all();
  for (const loading of loadingElements) {
    const text = await loading.textContent();
    console.log("Loading found:", text);
  }

  // Check if conversation container exists but is hidden
  const conversationContainer = page.getByTestId("conversation-container");
  const exists = await conversationContainer.count();
  console.log("Conversation container exists:", exists > 0);

  if (exists > 0) {
    const isVisible = await conversationContainer.isVisible();
    const isHidden = await conversationContainer.isHidden();
    console.log("Conversation container visible:", isVisible);
    console.log("Conversation container hidden:", isHidden);
  }

  // Check for any Daily.co or Tavus related elements
  const dailyElements = await page
    .locator('[class*="daily"], [id*="daily"], [data-testid*="daily"]')
    .all();
  console.log("Daily elements found:", dailyElements.length);

  const tavusElements = await page
    .locator('[class*="tavus"], [id*="tavus"], [data-testid*="tavus"]')
    .all();
  console.log("Tavus elements found:", tavusElements.length);
});
