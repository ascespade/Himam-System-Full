/**
 * Test Setup and Teardown
 * Global setup/teardown for test environment
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  // Setup test environment
  console.log('Setting up test environment...')
  
  // Check if server is running
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000', { timeout: 30000 })
    console.log('✅ Test server is running')
  } catch (error) {
    console.warn('⚠️ Test server may not be running. Make sure to start it with: npm run dev')
  }
  
  await browser.close()
}

async function globalTeardown(config: FullConfig) {
  // Cleanup test environment
  console.log('Cleaning up test environment...')
}

export default globalSetup
