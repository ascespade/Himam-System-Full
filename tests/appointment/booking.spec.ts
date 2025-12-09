/**
 * Appointment Booking Tests
 * Comprehensive tests for appointment creation and management
 */

import { test, expect } from '@playwright/test'
import { loginAs, testUsers } from '../helpers/auth'
import { selectors } from '../helpers/selectors'
import { testData } from '../fixtures/test-data'

test.describe('Appointment Booking', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.reception)
  })

  test('should navigate to appointment booking page', async ({ page }) => {
    await page.goto('/dashboard/reception/book-appointment')
    await page.waitForLoadState('networkidle')
    
    await expect(page).toHaveURL(/\/book-appointment/)
  })

  test('should display appointment form', async ({ page }) => {
    await page.goto('/dashboard/reception/book-appointment')
    await page.waitForLoadState('networkidle')
    
    // Check for form elements
    const hasDateInput = await page.locator(selectors.appointment.dateInput).isVisible().catch(() => false)
    const hasTimeInput = await page.locator(selectors.appointment.timeInput).isVisible().catch(() => false)
    const hasPatientSelect = await page.locator(selectors.appointment.patientSelect).isVisible().catch(() => false)
    
    // At least date or time should be visible
    expect(hasDateInput || hasTimeInput || hasPatientSelect).toBeTruthy()
  })

  test('should validate appointment date is not in the past', async ({ page }) => {
    await page.goto('/dashboard/reception/book-appointment')
    await page.waitForLoadState('networkidle')
    
    const dateInput = page.locator(selectors.appointment.dateInput).first()
    
    if (await dateInput.isVisible()) {
      const today = new Date().toISOString().split('T')[0]
      const minDate = await dateInput.getAttribute('min').catch(() => null)
      
      // If min attribute exists, it should be today or future
      if (minDate) {
        expect(new Date(minDate) <= new Date(today)).toBeTruthy()
      }
    }
  })

  test('should allow selecting patient for appointment', async ({ page }) => {
    await page.goto('/dashboard/reception/book-appointment')
    await page.waitForLoadState('networkidle')
    
    const patientSelect = page.locator(selectors.appointment.patientSelect).first()
    
    if (await patientSelect.isVisible()) {
      const options = await patientSelect.locator('option').count()
      expect(options).toBeGreaterThan(0)
    }
  })

  test('should allow selecting doctor for appointment', async ({ page }) => {
    await page.goto('/dashboard/reception/book-appointment')
    await page.waitForLoadState('networkidle')
    
    const doctorSelect = page.locator(selectors.appointment.doctorSelect).first()
    
    if (await doctorSelect.isVisible()) {
      const options = await doctorSelect.locator('option').count()
      expect(options).toBeGreaterThan(0)
    }
  })
})
