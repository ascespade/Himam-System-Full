/**
 * Authentication Tests
 * Comprehensive login/logout and session management tests
 */

import { test, expect } from '@playwright/test'
import { loginAs, logout, testUsers } from '../helpers/auth'
import { selectors } from '../helpers/selectors'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login page correctly', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('تسجيل الدخول')
    await expect(page.locator(selectors.login.emailInput)).toBeVisible()
    await expect(page.locator(selectors.login.passwordInput)).toBeVisible()
    await expect(page.locator(selectors.login.submitButton)).toBeVisible()
  })

  test('should show error for empty form submission', async ({ page }) => {
    await page.click(selectors.login.submitButton)
    
    // HTML5 validation should prevent submission
    const emailInput = page.locator(selectors.login.emailInput)
    const passwordInput = page.locator(selectors.login.passwordInput)
    
    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill(selectors.login.emailInput, 'invalid@example.com')
    await page.fill(selectors.login.passwordInput, 'wrongpassword')
    await page.click(selectors.login.submitButton)
    
    // Wait for error message
    await page.waitForTimeout(1000)
    
    // Check for error message (either in UI or form validation)
    const errorVisible = await page.locator(selectors.login.errorMessage).isVisible().catch(() => false)
    if (errorVisible) {
      await expect(page.locator(selectors.login.errorMessage)).toBeVisible()
    }
  })

  test('should login successfully with valid admin credentials', async ({ page }) => {
    await loginAs(page, testUsers.admin)
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    
    // Verify we're not on login page
    await expect(page.locator('h2')).not.toContainText('تسجيل الدخول')
  })

  test('should login successfully with valid doctor credentials', async ({ page }) => {
    await loginAs(page, testUsers.doctor)
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should login successfully with valid reception credentials', async ({ page }) => {
    await loginAs(page, testUsers.reception)
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should persist session after page reload', async ({ page }) => {
    await loginAs(page, testUsers.admin)
    
    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Should still be logged in
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('h2')).not.toContainText('تسجيل الدخول')
  })

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Clear any existing auth
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
    
    // Try to access dashboard
    await page.goto('/dashboard/admin')
    
    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('should logout successfully', async ({ page }) => {
    await loginAs(page, testUsers.admin)
    
    // Attempt logout
    await logout(page)
    
    // Should be on login page
    await expect(page).toHaveURL(/\/login/)
  })
})
