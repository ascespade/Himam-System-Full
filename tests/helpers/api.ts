/**
 * API Test Helpers
 * Utilities for API testing and data setup
 */

import { APIRequestContext, expect } from '@playwright/test'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

/**
 * Make authenticated API request
 */
export async function apiRequest(
  request: APIRequestContext,
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    body?: unknown
    token?: string
  } = {}
): Promise<ApiResponse> {
  const { method = 'GET', body, token } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await request.fetch(endpoint, {
    method,
    headers,
    data: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()
  return data as ApiResponse
}

/**
 * Create test patient
 */
export async function createTestPatient(
  request: APIRequestContext,
  patientData: {
    name: string
    phone: string
    email?: string
    date_of_birth?: string
    gender?: 'male' | 'female'
  }
): Promise<string> {
  const response = await apiRequest(request, '/api/patients', {
    method: 'POST',
    body: patientData,
  })

  expect(response.success).toBe(true)
  expect(response.data).toBeDefined()
  
  return (response.data as { id: string }).id
}

/**
 * Create test appointment
 */
export async function createTestAppointment(
  request: APIRequestContext,
  appointmentData: {
    patient_id: string
    doctor_id?: string
    date: string
    time: string
    appointment_type?: string
  }
): Promise<string> {
  const response = await apiRequest(request, '/api/appointments', {
    method: 'POST',
    body: appointmentData,
  })

  expect(response.success).toBe(true)
  expect(response.data).toBeDefined()
  
  return (response.data as { id: string }).id
}

/**
 * Clean up test data
 */
export async function cleanupTestData(
  request: APIRequestContext,
  resourceType: 'patient' | 'appointment',
  id: string
): Promise<void> {
  const endpoint = `/api/${resourceType}s/${id}`
  await apiRequest(request, endpoint, { method: 'DELETE' })
}
