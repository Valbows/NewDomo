import { test, expect } from '@playwright/test';

/**
 * E2E (live backend): Tavus webhook ingestion -> Supabase -> Realtime -> UI
 *
 * Preconditions:
 * - Run with playwright.real.config.ts (NEXT_PUBLIC_E2E_TEST_MODE=false; dev server)
 * - .env.local set with: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SECRET_KEY
 * - .env.local set with: TAVUS_WEBHOOK_SECRET (any dev value, e.g., "devsecret")
 * - Test user exists (email: test@example.com, password: password123)
 */

test.describe('Tavus webhook live ingestion', () => {
  test('ingests perception and updates dashboard UI', async ({ page }) => {
    // 1) Sign in with provided credentials
    await page.goto('/auth/sign-in');
    await page.getByLabel(/Email address/i).fill('test@example.com');
    await page.getByLabel(/Password/i).fill('password123');
    await page.getByRole('button', { name: /^Sign in$/i }).click();
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible({ timeout: 30_000 });

    // 2) Use the provided demoId directly
    const demoId = '42beb287-f385-4100-86a4-bfe7008d531b';

    // 4) Open dashboard and capture current conversation counts
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();

    const convCount = page.getByTestId('summary-total-conversations');
    const beforeText = ((await convCount.textContent()) || '0').trim();
    const before = Number.parseInt(beforeText, 10) || 0;

    // Capture the specified demo card's current count
    const manageLink = page.locator(`a[href="/demos/${demoId}/configure"]`);
    await expect(manageLink).toBeVisible({ timeout: 15_000 });
    const demoCard = manageLink.locator('xpath=ancestor::div[contains(@class, "bg-white")]').first();
    const demoConvLine = demoCard.getByText(/Conversations tracked:/);
    await expect(demoConvLine).toBeVisible();
    const demoLineText = (await demoConvLine.textContent())?.trim() || 'Conversations tracked: 0';
    const beforeDemo = Number.parseInt(demoLineText.split(':').pop()?.trim() || '0', 10) || 0;

    // 5) Send a real, HMAC-signed Tavus webhook event via dev helper (targets /api/tavus-webhook)
    // Attach (or generate) a Tavus conversation for the chosen demo; add a shareable URL
    const attachResp = await page.request.get(`/api/dev/attach-conversation?demoId=${demoId}&withUrl=true`);
    expect(attachResp.ok()).toBeTruthy();
    const attachJson = await attachResp.json();
    const conversationId = attachJson.demo?.tavus_conversation_id as string;
    expect(conversationId).toBeTruthy();

    // Build a fixed-id event payload for idempotency testing
    const payload = {
      id: 'evt_e2e_dedupe_1',
      event_type: 'application.conversation.completed',
      conversation_id: conversationId,
      data: {
        perception: { sentiment_score: 0.82, emotion: 'positive' },
        summary: { overall: 'Great conversation', score: 0.9 },
      },
    } as const;

    // Send a real, HMAC-signed Tavus webhook event via dev helper (targets /api/tavus-webhook)
    const webhookResp = await page.request.get(
      `/api/dev/send-tavus-event?conversation_id=${encodeURIComponent(conversationId)}&payload=${encodeURIComponent(JSON.stringify(payload))}`
    );
    expect(webhookResp.ok()).toBeTruthy();
    const webhookJson = await webhookResp.json();
    expect(webhookJson.sent).toBeTruthy();
    expect(webhookJson.status).toBe(200);
    // Ensure the downstream webhook acknowledged receipt (stronger signal than status alone)
    expect(webhookJson.webhook_response?.received).toBeTruthy();

    // Ensure UI reflects fresh DB state (avoid realtime subscription race)
    await page.reload();
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();

    // Re-acquire locators after navigation and assert +1 count
    const convCountAfter = page.getByTestId('summary-total-conversations');
    await expect(convCountAfter).toHaveText(String(before + 1), { timeout: 15_000 });
    await expect(page.getByTestId('summary-last-updated')).not.toHaveText('—');

    // Verify the specific demo card shows the incremented count
    const manageLink2 = page.locator(`a[href="/demos/${demoId}/configure"]`);
    await expect(manageLink2).toBeVisible({ timeout: 15_000 });
    const demoCard2 = manageLink2.locator('xpath=ancestor::div[contains(@class, "bg-white")]').first();
    await expect(demoCard2.getByText(`Conversations tracked: ${beforeDemo + 1}`)).toBeVisible({ timeout: 15_000 });

    // 6) Idempotency: send the exact same event again and assert no additional increment
    const afterTotal = before + 1;
    const afterDemo = beforeDemo + 1;

    const webhookResp2 = await page.request.get(
      `/api/dev/send-tavus-event?conversation_id=${encodeURIComponent(conversationId)}&payload=${encodeURIComponent(JSON.stringify(payload))}`
    );
    expect(webhookResp2.ok()).toBeTruthy();
    const webhookJson2 = await webhookResp2.json();
    expect(webhookJson2.sent).toBeTruthy();
    expect(webhookJson2.status).toBe(200);
    expect(webhookJson2.webhook_response?.received).toBeTruthy();

    // Reload and verify counts remain unchanged
    await page.reload();
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
    const convCountAfterDup = page.getByTestId('summary-total-conversations');
    await expect(convCountAfterDup).toHaveText(String(afterTotal), { timeout: 15_000 });

    const manageLink3 = page.locator(`a[href="/demos/${demoId}/configure"]`);
    await expect(manageLink3).toBeVisible({ timeout: 15_000 });
    const demoCard3 = manageLink3.locator('xpath=ancestor::div[contains(@class, "bg-white")]').first();
    await expect(demoCard3.getByText(`Conversations tracked: ${afterDemo}`)).toBeVisible({ timeout: 15_000 });
  });
});
