/**
 * AI API Route
 * Uses centralized AI service with Gemini 2.0 Flash + OpenAI fallback
 */

import { NextRequest, NextResponse } from 'next/server'
import { askAI } from '@/lib/ai'
import { parseRequestBody } from '@/core/api/middleware'
import { successResponse, errorResponse } from '@/shared/utils/api'
import { HTTP_STATUS } from '@/shared/constants'

export async function POST(req: NextRequest) {
  try {
    const body = await parseRequestBody<{ message: string; context?: string }>(req)
    
    const validation = validateRequestBody(body, ['message'])
    if (!validation.isValid) {
      return NextResponse.json(
        errorResponse(validation.errors.join(', ')),
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const response = await askAI(body.message, body.context)

    if (response.error) {
      return NextResponse.json(
        errorResponse(response.error),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    return NextResponse.json(
      successResponse({
        source: 'AI',
        model: response.model,
        response: response.text,
      })
    )
  } catch (error) {
    console.error('AI API Error:', error)
    return NextResponse.json(
      errorResponse(error),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}
