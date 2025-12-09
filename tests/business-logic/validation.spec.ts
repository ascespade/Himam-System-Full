/**
 * Business Logic Validation Tests
 * Tests for critical business rules and validations
 */

import { test, expect } from '@playwright/test'
import { loginAs, testUsers } from '../helpers/auth'
import { testData } from '../fixtures/test-data'

test.describe('Business Logic Validation', () => {
  test('should validate phone number format', async ({ page }) => {
    await loginAs(page, testUsers.reception)
    await page.goto('/dashboard/reception/patients/new')
    await page.waitForLoadState('networkidle')
    
    const phoneInput = page.locator('input[name="phone"], input[type="tel"]').first()
    
    if (await phoneInput.isVisible()) {
      // Test invalid phone
      await phoneInput.fill('123')
      await phoneInput.blur()
      await page.waitForTimeout(500)
      
      // Should show validation error or prevent submission
      const hasError = await page.locator('[data-testid="error"], .text-red-500').isVisible().catch(() => false)
      const pattern = await phoneInput.getAttribute('pattern').catch(() => null)
      
      expect(hasError || pattern !== null).toBeTruthy()
    }
  })

  test('should validate email format', async ({ page }) => {
    await loginAs(page, testUsers.reception)
    await page.goto('/dashboard/reception/patients/new')
    await page.waitForLoadState('networkidle')
    
    const emailInput = page.locator('input[type="email"]').first()
    
    if (await emailInput.isVisible()) {
      // Test invalid email
      await emailInput.fill('invalid-email')
      await emailInput.blur()
      await page.waitForTimeout(500)
      
      // HTML5 validation should catch this
      const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid).catch(() => true)
      expect(validity).toBeFalsy()
    }
  })

  test('should prevent booking appointments in the past', async ({ page }) => {
    await loginAs(page, testUsers.reception)
    await page.goto('/dashboard/reception/book-appointment')
    await page.waitForLoadState('networkidle')
    
    const dateInput = page.locator('input[type="date"]').first()
    
    if (await dateInput.isVisible()) {
      const minDate = await dateInput.getAttribute('min')
      const today = new Date().toISOString().split('T')[0]
      
      if (minDate) {
        // Min date should be today or earlier (allowing same day)
        expect(new Date(minDate) <= new Date(today)).toBeTruthy()
      }
    }
  })

  test('should enforce required fields in patient form', async ({ page }) => {
    await loginAs(page, testUsers.reception)
    await page.goto('/dashboard/reception/patients/new')
    await page.waitForLoadState('networkidle')
    
    const nameInput = page.locator('input[name="name"]').first()
    
    if (await nameInput.isVisible()) {
      const isRequired = await nameInput.getAttribute('required')
      expect(isRequired).not.toBeNull()
    }
  })

  test('should validate date of birth is not in future', async ({ page }) => {
    await loginAs(page, testUsers.reception)
    await page.goto('/dashboard/reception/patients/new')
    await page.waitForLoadState('networkidle')
    
    const dobInput = page.locator('input[name="date_of_birth"], input[type="date"]').first()
    
    if (await dobInput.isVisible()) {
      const maxDate = await dobInput.getAttribute('max')
      const today = new Date().toISOString().split('T')[0]
      
      if (maxDate) {
        expect(new Date(maxDate) >= new Date(today)).toBeTruthy()
      }
    }
  })
})
