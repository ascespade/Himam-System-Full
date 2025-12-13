import { test, expect } from '@playwright/test'

test.describe('Appointments API', () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  test('GET /api/appointments should return paginated results', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/appointments?page=1&limit=10`)
    
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
  })

  test('GET /api/appointments should respect date filters', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0]
    const response = await request.get(`${baseUrl}/api/appointments?date=${today}&page=1&limit=10`)
    
    expect(response.status()).toBe(200)
    const data = await response.json()
    
    expect(data).toHaveProperty('success', true)
  })

  test('GET /api/appointments should enforce max limit', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/appointments?page=1&limit=500`)
    
    expect(response.status()).toBe(200)
    const data = await response.json()
    
    expect(data.pagination.limit).toBeLessThanOrEqual(100)
  })
})
