import { test, expect } from '@playwright/test';

/**
 * E2E: Dashboard realtime analytics update (stubbed in E2E mode)
 *
 * Preconditions:
 * - NEXT_PUBLIC_E2E_TEST_MODE=true (set by playwright.config.ts webServer command)
 * - useDemosRealtime seeds 2 stub demos and exposes a window custom event
 *   'e2e:analytics_updated' to simulate Supabase broadcast events.
 */

test.describe('Dashboard realtime analytics', () => {
  test('summary and list update when analytics_updated event fires', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for dashboard heading
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();

    // Summary should reflect seeded demos: total=2, active=1, conversations=0, lastUpdated='—'
    await expect(page.getByTestId('summary-total-demos')).toHaveText('2');
    await expect(page.getByTestId('summary-active-demos')).toHaveText('1');
    await expect(page.getByTestId('summary-total-conversations')).toHaveText('0');
    await expect(page.getByTestId('summary-last-updated')).toHaveText('—');

    // List item for Demo A starts with 0 conversations
    const demoACard = page.locator('div', { hasText: 'E2E Demo A' }).first();
    await expect(demoACard).toContainText('Conversations tracked: 0');

    // Simulate a realtime analytics update for demo e2e-1
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('e2e:analytics_updated', { detail: { demoId: 'e2e-1' } }));
    });

    // Summary should update: conversations +1, lastUpdated becomes a timestamp
    await expect(page.getByTestId('summary-total-conversations')).toHaveText('1');
    await expect(page.getByTestId('summary-last-updated')).not.toHaveText('—');

    // List item should reflect updated count
    await expect(demoACard).toContainText('Conversations tracked: 1');

    // Fire another update; counts should increment
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('e2e:analytics_updated', { detail: { demoId: 'e2e-1' } }));
    });

    await expect(page.getByTestId('summary-total-conversations')).toHaveText('2');
    await expect(demoACard).toContainText('Conversations tracked: 2');
  });
});
