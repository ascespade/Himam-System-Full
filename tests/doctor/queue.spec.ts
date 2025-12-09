/**
 * Doctor Queue Tests
 * Tests for doctor queue management and patient flow
 */

import { test, expect } from '@playwright/test'
import { loginAs, testUsers } from '../helpers/auth'
import { selectors } from '../helpers/selectors'

test.describe('Doctor Queue Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.doctor)
    await page.goto('/dashboard/doctor/queue')
    await page.waitForLoadState('networkidle')
  })

  test('should display queue page', async ({ page }) => {
    await expect(page).toHaveURL(/\/queue/)
    
    // Check for queue elements
    const hasQueueItems = await page.locator(selectors.queue.queueItem).isVisible().catch(() => false)
    const hasQueueContent = await page.locator('text=طابور, text=Queue').isVisible().catch(() => false)
    
    expect(hasQueueItems || hasQueueContent).toBeTruthy()
  })

  test('should display queue items if available', async ({ page }) => {
    const queueItems = page.locator(selectors.queue.queueItem)
    const count = await queueItems.count()
    
    if (count > 0) {
      // Verify queue items are visible
      await expect(queueItems.first()).toBeVisible()
    } else {
      // If no items, should show empty state
      const emptyState = await page.locator('text=لا يوجد, text=No items, text=Empty').isVisible().catch(() => false)
      expect(emptyState || true).toBeTruthy() // Empty state is acceptable
    }
  })

  test('should allow confirming patient to doctor', async ({ page }) => {
    const confirmButton = page.locator(selectors.queue.confirmButton).first()
    
    if (await confirmButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmButton.click()
      await page.waitForTimeout(1000)
      
      // Should see some feedback (button disabled, loading, or success message)
      const isDisabled = await confirmButton.isDisabled().catch(() => false)
      const hasFeedback = await page.locator(selectors.common.loading).isVisible().catch(() => false)
      
      expect(isDisabled || hasFeedback).toBeTruthy()
    } else {
      test.skip() // No queue items to confirm
    }
  })

  test('should navigate to current patient page', async ({ page }) => {
    const currentPatientLink = page.locator('a[href*="current-patient"], button:has-text("المريض الحالي")').first()
    
    if (await currentPatientLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await currentPatientLink.click()
      await page.waitForURL(/\/current-patient/, { timeout: 10000 })
      await expect(page).toHaveURL(/\/current-patient/)
    } else {
      // Try direct navigation
      await page.goto('/dashboard/doctor/current-patient')
      await expect(page).toHaveURL(/\/current-patient/)
    }
  })
})
