import { test, expect } from '@playwright/test';

// Basic smoke tests for the public homepage
// These do not require auth or external APIs

test('homepage renders headline and primary CTA', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Create AI-Powered Product Demos in Minutes/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Create a Demo Now/i })).toBeVisible();
});

test('secondary CTA section appears', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Ready to revolutionize your demos\?/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Get started/i })).toBeVisible();
});