import { test, expect } from '@playwright/test'

test.describe('Patients API', () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  test('GET /api/patients should return paginated results', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/patients?page=1&limit=10`)
    
    expect(response.status()).toBe(200)
    const data = await response.json()
    
    expect(data).toHaveProperty('success', true)
    expect(data).toHaveProperty('data')
    expect(Array.isArray(data.data)).toBe(true)
    expect(data).toHaveProperty('pagination')
    expect(data.pagination).toHaveProperty('page')
    expect(data.pagination).toHaveProperty('limit')
    expect(data.pagination).toHaveProperty('total')
    expect(data.pagination).toHaveProperty('totalPages')
    expect(data.pagination).toHaveProperty('hasNext')
    expect(data.pagination).toHaveProperty('hasPrev')
  })

  test('GET /api/patients should respect pagination parameters', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/patients?page=2&limit=5`)
    
    expect(response.status()).toBe(200)
    const data = await response.json()
    
    expect(data.pagination.page).toBe(2)
    expect(data.pagination.limit).toBe(5)
    expect(data.data.length).toBeLessThanOrEqual(5)
  })

  test('GET /api/patients should handle search parameter', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/patients?search=test&page=1&limit=10`)
    
    expect(response.status()).toBe(200)
    const data = await response.json()
    
    expect(data).toHaveProperty('success', true)
    expect(data).toHaveProperty('data')
  })

  test('GET /api/patients should enforce max limit', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/patients?page=1&limit=1000`)
    
    expect(response.status()).toBe(200)
    const data = await response.json()
    
    expect(data.pagination.limit).toBeLessThanOrEqual(100)
  })
})
