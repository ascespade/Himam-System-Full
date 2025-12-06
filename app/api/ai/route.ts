/**
 * AI API Route
 * Uses centralized AI service with Gemini 2.0 Flash + OpenAI fallback
 */

import { NextRequest, NextResponse } from 'next/server'
import { askAI } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const response = await askAI(message, context)

    return NextResponse.json({
      success: true,
      source: 'AI',
      model: response.model,
      response: response.text,
      error: response.error,
    })
  } catch (error: any) {
    console.error('AI API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process AI request',
      },
      { status: 500 }
    )
  }
}
