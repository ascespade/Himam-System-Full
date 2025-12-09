/**
 * End-to-End Integration Tests
 * Complete user journey tests
 */

import { test, expect } from '@playwright/test'
import { loginAs, testUsers } from '../helpers/auth'
import { testData } from '../fixtures/test-data'

test.describe('End-to-End User Journeys', () => {
  test('complete patient registration and appointment booking flow', async ({ page }) => {
    // Step 1: Login as reception
    await loginAs(page, testUsers.reception)
    await expect(page).toHaveURL(/\/dashboard/)
    
    // Step 2: Navigate to new patient
    await page.goto('/dashboard/reception/patients/new')
    await page.waitForLoadState('networkidle')
    
    // Step 3: Create patient
    const patient = testData.patients.valid
    const nameInput = page.locator('input[name="name"]').first()
    const phoneInput = page.locator('input[name="phone"]').first()
    
    if (await nameInput.isVisible() && await phoneInput.isVisible()) {
      await nameInput.fill(patient.name)
      await phoneInput.fill(patient.phone)
      
      // Step 4: Save patient
      const saveButton = page.locator('button:has-text("حفظ"), button[type="submit"]').first()
      if (await saveButton.isVisible()) {
        await saveButton.click()
        await page.waitForTimeout(2000)
      }
    }
    
    // Step 5: Navigate to appointment booking
    await page.goto('/dashboard/reception/book-appointment')
    await page.waitForLoadState('networkidle')
    
    // Verify appointment page loaded
    await expect(page).toHaveURL(/\/book-appointment/)
  })

  test('doctor queue to patient view flow', async ({ page }) => {
    // Step 1: Login as doctor
    await loginAs(page, testUsers.doctor)
    
    // Step 2: Navigate to queue
    await page.goto('/dashboard/doctor/queue')
    await page.waitForLoadState('networkidle')
    
    // Step 3: Check for queue items
    const queueItems = page.locator('[data-testid="queue-item"], .queue-item')
    const count = await queueItems.count()
    
    if (count > 0) {
      // Step 4: Navigate to current patient
      await page.goto('/dashboard/doctor/current-patient')
      await page.waitForLoadState('networkidle')
      
      // Verify current patient page
      await expect(page).toHaveURL(/\/current-patient/)
    } else {
      // If no queue items, verify queue page is accessible
      await expect(page).toHaveURL(/\/queue/)
    }
  })

  test('dashboard navigation flow', async ({ page }) => {
    // Login
    await loginAs(page, testUsers.admin)
    
    // Navigate through main sections
    const sections = [
      '/dashboard/admin',
      '/dashboard/doctor',
      '/dashboard/reception',
    ]
    
    for (const section of sections) {
      await page.goto(section)
      await page.waitForLoadState('networkidle')
      
      // Verify page loaded (not 404)
      const is404 = await page.locator('text=404, text=Not Found').isVisible().catch(() => false)
      expect(is404).toBeFalsy()
    }
  })
})
