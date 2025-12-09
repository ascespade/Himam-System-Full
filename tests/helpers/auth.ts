/**
 * Authentication Test Helpers
 * Utilities for login/logout and session management in tests
 */

import { Page, expect } from '@playwright/test'

export interface TestUser {
  email: string
  password: string
  role: 'admin' | 'doctor' | 'reception' | 'supervisor' | 'guardian' | 'patient'
}

export const testUsers: Record<string, TestUser> = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@himam.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
    role: 'admin',
  },
  doctor: {
    email: process.env.TEST_DOCTOR_EMAIL || 'doctor@himam.com',
    password: process.env.TEST_DOCTOR_PASSWORD || 'doctor123',
    role: 'doctor',
  },
  reception: {
    email: process.env.TEST_RECEPTION_EMAIL || 'reception@himam.com',
    password: process.env.TEST_RECEPTION_PASSWORD || 'reception123',
    role: 'reception',
  },
}

/**
 * Login as a specific user
 */
export async function loginAs(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login')
  await expect(page.locator('h2')).toContainText('تسجيل الدخول')
  
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)
  await page.click('button[type="submit"]')
  
  // Wait for navigation after login
  await page.waitForURL(/\/dashboard/, { timeout: 10000 })
  
  // Verify we're logged in
  await expect(page).toHaveURL(/\/dashboard/)
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
  // Look for logout button/link (adjust selector based on actual UI)
  const logoutButton = page.locator('text=تسجيل الخروج, text=Logout, [data-testid="logout"]').first()
  
  if (await logoutButton.isVisible()) {
    await logoutButton.click()
    await page.waitForURL(/\/login/, { timeout: 5000 })
  } else {
    // Fallback: clear cookies and localStorage
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
    await page.goto('/login')
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const currentUrl = page.url()
  return currentUrl.includes('/dashboard') && !currentUrl.includes('/login')
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuth(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  // Wait for any auth-related redirects
  await page.waitForTimeout(1000)
}
