import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/config'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET() {
  const settings = await getSettings()
  const debugInfo: any = {
    hasGemini: !!settings.GEMINI_KEY,
    geminiKeyLength: settings.GEMINI_KEY?.length,
    geminiKeyStart: settings.GEMINI_KEY?.substring(0, 5) + '...',
    hasOpenAI: !!settings.OPENAI_KEY,
  }

  // 1. Test with Configured Key
  try {
    if (settings.GEMINI_KEY) {
      const genAI = new GoogleGenerativeAI(settings.GEMINI_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
      const result = await model.generateContent('Hello')
      debugInfo.configuredTest = 'Success: ' + result.response.text()
    } else {
      debugInfo.configuredTest = 'Skipped (No Key)'
    }
  } catch (error: any) {
    debugInfo.configuredTest = 'Failed: ' + error.message
  }

  // 2. Test with USER PROVIDED Key
  const manualKey = 'AIzaSyCc_WMALGhROTeUyq8gW8FbCjL6LZ_ubic'
  try {
    const genAI = new GoogleGenerativeAI(manualKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' }) // Using standard model to be safe
    const result = await model.generateContent('Hello')
    debugInfo.manualTest = 'Success: ' + result.response.text()
  } catch (error: any) {
    debugInfo.manualTest = 'Failed: ' + error.message
  }

  return NextResponse.json(debugInfo)
}
