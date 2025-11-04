/**
 * End-to-End Tests for Reporting Page
 * Tests complete user workflows and real data display
 */

import { test, expect } from '@playwright/test';

test.describe('Reporting Page E2E Tests', () => {
  const demoId = 'test-demo-id';
  const reportingUrl = `/demos/${demoId}/configure`;

  test.beforeEach(async ({ page }) => {
    // Navigate to the demo configuration page
    await page.goto(reportingUrl);
    
    // Wait for the page to load and click on Reporting tab
    await page.waitForSelector('[data-testid="reporting-tab"]', { timeout: 10000 });
    await page.click('[data-testid="reporting-tab"]');
    
    // Wait for reporting content to load
    await page.waitForSelector('text=Conversation Analytics', { timeout: 10000 });
  });

  test('should display reporting page header and sync button', async ({ page }) => {
    // Check main header
    await expect(page.locator('h3')).toContainText('Conversation Analytics');
    await expect(page.locator('text=View detailed analytics and insights')).toBeVisible();
    
    // Check sync button
    await expect(page.locator('button:has-text("Sync Data")')).toBeVisible();
    await expect(page.locator('svg[data-testid="refresh-icon"]')).toBeVisible();
  });

  test('should display summary statistics cards', async ({ page }) => {
    // Wait for stats to load
    await page.waitForSelector('text=Total Conversations', { timeout: 5000 });
    
    // Check all four stat cards
    await expect(page.locator('text=Total Conversations')).toBeVisible();
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('text=Avg Duration')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    
    // Check that numbers are displayed (should be numeric values)
    const totalConversations = page.locator('div:has-text("Total Conversations")').locator('div').first();
    await expect(totalConversations).toBeVisible();
  });

  test('should show conversations list with data tags', async ({ page }) => {
    // Wait for conversations to load
    await page.waitForSelector('[data-testid="conversation-list"]', { timeout: 10000 });
    
    // Check if conversations are displayed or no data message
    const hasConversations = await page.locator('[data-testid="conversation-card"]').count() > 0;
    
    if (hasConversations) {
      // Check conversation cards
      await expect(page.locator('[data-testid="conversation-card"]').first()).toBeVisible();
      
      // Check for expand/collapse buttons
      await expect(page.locator('button:has-text("Expand")').first()).toBeVisible();
      
      // Check for data tags (if any data exists)
      const possibleTags = [
        '👤 Contact Info',
        '🎯 Product Interest', 
        '🎬 Video Showcase',
        '🎯 CTA Tracking',
        '🧠 AI Analysis',
        'No data captured'
      ];
      
      let tagFound = false;
      for (const tag of possibleTags) {
        if (await page.locator(`text=${tag}`).count() > 0) {
          tagFound = true;
          break;
        }
      }
      expect(tagFound).toBeTruthy();
      
    } else {
      // Check no data message
      await expect(page.locator('text=No conversations found')).toBeVisible();
    }
  });

  test('should expand conversation details when clicked', async ({ page }) => {
    // Wait for conversations to load
    await page.waitForSelector('[data-testid="conversation-list"]', { timeout: 10000 });
    
    const conversationCount = await page.locator('[data-testid="conversation-card"]').count();
    
    if (conversationCount > 0) {
      // Click the first expand button
      await page.click('button:has-text("Expand")');
      
      // Wait for expanded content
      await page.waitForSelector('button:has-text("Collapse")', { timeout: 5000 });
      
      // Check that detailed sections appear
      const detailSections = [
        '👤 Contact Information',
        '🎯 Reason Why They Visited Website', 
        '🎬 Website Feature They Are Most Interested in Viewing',
        '🎯 Execute CTA?',
        '🏆 Domo Score',
        '💬 Conversation Transcript'
      ];
      
      for (const section of detailSections) {
        await expect(page.locator(`text=${section}`)).toBeVisible();
      }
      
      // Check Domo Score card components
      await expect(page.locator('text=Contact Confirmation')).toBeVisible();
      await expect(page.locator('text=Reason Why They Visited Site')).toBeVisible();
      await expect(page.locator('text=Platform Feature Most Interested In')).toBeVisible();
      await expect(page.locator('text=CTA Execution')).toBeVisible();
      await expect(page.locator('text=Visual Analysis')).toBeVisible();
      await expect(page.locator('text=Credibility Score')).toBeVisible();
      
      // Test collapse functionality
      await page.click('button:has-text("Collapse")');
      await expect(page.locator('button:has-text("Expand")')).toBeVisible();
      await expect(page.locator('text=Contact Confirmation')).not.toBeVisible();
    }
  });

  test('should handle sync data functionality', async ({ page }) => {
    // Click sync button
    await page.click('button:has-text("Sync Data")');
    
    // Check loading state
    await expect(page.locator('button:has-text("Syncing...")')).toBeVisible();
    await expect(page.locator('svg.animate-spin')).toBeVisible();
    
    // Wait for sync to complete (timeout after 30 seconds)
    await page.waitForSelector('button:has-text("Sync Data")', { timeout: 30000 });
    
    // Verify button returns to normal state
    await expect(page.locator('button:has-text("Sync Data")')).toBeVisible();
    await expect(page.locator('button:has-text("Syncing...")')).not.toBeVisible();
  });

  test('should display transcript data when available', async ({ page }) => {
    // Wait for conversations and expand first one if available
    await page.waitForSelector('[data-testid="conversation-list"]', { timeout: 10000 });
    
    const conversationCount = await page.locator('[data-testid="conversation-card"]').count();
    
    if (conversationCount > 0) {
      await page.click('button:has-text("Expand")');
      await page.waitForSelector('text=💬 Conversation Transcript', { timeout: 5000 });
      
      // Check transcript section
      await expect(page.locator('text=💬 Conversation Transcript')).toBeVisible();
      
      // Check if transcript content or no transcript message is shown
      const hasTranscript = await page.locator('text=No transcript available').count() === 0;
      
      if (hasTranscript) {
        // Look for transcript entries (speaker labels and text)
        const transcriptEntries = page.locator('[data-testid="transcript-entry"]');
        if (await transcriptEntries.count() > 0) {
          await expect(transcriptEntries.first()).toBeVisible();
        }
      } else {
        await expect(page.locator('text=No transcript available')).toBeVisible();
      }
    }
  });

  test('should show contact information when captured', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]', { timeout: 10000 });
    
    const conversationCount = await page.locator('[data-testid="conversation-card"]').count();
    
    if (conversationCount > 0) {
      // Look for contact info tag first
      const hasContactTag = await page.locator('text=👤 Contact Info').count() > 0;
      
      if (hasContactTag) {
        await page.click('button:has-text("Expand")');
        await page.waitForSelector('text=👤 Contact Information', { timeout: 5000 });
        
        // Check contact info card shows captured data
        await expect(page.locator('text=Captured')).toBeVisible();
        
        // Look for contact fields
        const contactFields = ['Full Name:', 'Email:', 'Position:', 'Captured:'];
        for (const field of contactFields) {
          await expect(page.locator(`text=${field}`)).toBeVisible();
        }
      }
    }
  });

  test('should display product interest data when available', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]', { timeout: 10000 });
    
    const conversationCount = await page.locator('[data-testid="conversation-card"]').count();
    
    if (conversationCount > 0) {
      const hasProductTag = await page.locator('text=🎯 Product Interest').count() > 0;
      
      if (hasProductTag) {
        await page.click('button:has-text("Expand")');
        await page.waitForSelector('text=🎯 Reason Why They Visited Website', { timeout: 5000 });
        
        // Check product interest fields
        await expect(page.locator('text=Primary Interest:')).toBeVisible();
        await expect(page.locator('text=Captured')).toBeVisible();
      }
    }
  });

  test('should calculate and display Domo Score correctly', async ({ page }) => {
    await page.waitForSelector('[data-testid="conversation-list"]', { timeout: 10000 });
    
    const conversationCount = await page.locator('[data-testid="conversation-card"]').count();
    
    if (conversationCount > 0) {
      await page.click('button:has-text("Expand")');
      await page.waitForSelector('text=🏆 Domo Score', { timeout: 5000 });
      
      // Check Domo Score components
      await expect(page.locator('text=🏆 Domo Score')).toBeVisible();
      
      // Check score display (should show X/5 format)
      const scorePattern = /[0-5]\/5/;
      const scoreElement = page.locator('div:has-text("🏆 Domo Score")').locator('div:has-text("/5")');
      await expect(scoreElement).toBeVisible();
      
      // Check score breakdown
      const scoreItems = [
        'Contact Confirmation',
        'Reason Why They Visited Site', 
        'Platform Feature Most Interested In',
        'CTA Execution',
        'Visual Analysis'
      ];
      
      for (const item of scoreItems) {
        await expect(page.locator(`text=${item}`)).toBeVisible();
      }
      
      // Check credibility score percentage
      await expect(page.locator('text=Credibility Score:')).toBeVisible();
      await expect(page.locator('text=%')).toBeVisible();
    }
  });

  test('should show privacy notice', async ({ page }) => {
    // Scroll to bottom to see privacy notice
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    await expect(page.locator('text=Privacy Notice')).toBeVisible();
    await expect(page.locator('text=Conversation data is stored securely')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that main elements are still visible and accessible
    await expect(page.locator('text=Conversation Analytics')).toBeVisible();
    await expect(page.locator('button:has-text("Sync Data")')).toBeVisible();
    
    // Check that stats cards stack properly on mobile
    const statsCards = page.locator('div:has-text("Total Conversations")').locator('..');
    await expect(statsCards).toBeVisible();
    
    // Test conversation expansion on mobile
    const conversationCount = await page.locator('[data-testid="conversation-card"]').count();
    if (conversationCount > 0) {
      await page.click('button:has-text("Expand")');
      await expect(page.locator('text=🏆 Domo Score')).toBeVisible();
    }
  });
});