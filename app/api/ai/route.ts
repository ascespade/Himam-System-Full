import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

const geminiApiKey = process.env.GEMINI_API_KEY
const openaiApiKey = process.env.OPENAI_API_KEY

export async function POST(req: NextRequest) {
  try {
    const { message, model = 'gemini' } = await req.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    let response = ''

    if (model === 'gemini' && geminiApiKey) {
      const genAI = new GoogleGenerativeAI(geminiApiKey)
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' })
      
      const prompt = `You are a medical assistant for مركز الهمم (Alhimam Center) in Jeddah, Saudi Arabia. 
      Respond in Arabic and English as needed. Be professional, helpful, and empathetic.
      User message: ${message}`
      
      const result = await geminiModel.generateContent(prompt)
      response = result.response.text()
    } else if (model === 'openai' && openaiApiKey) {
      const openai = new OpenAI({ apiKey: openaiApiKey })
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a medical assistant for مركز الهمم (Alhimam Center) in Jeddah, Saudi Arabia. Respond in Arabic and English as needed. Be professional, helpful, and empathetic.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
      })
      
      response = completion.choices[0]?.message?.content || 'Sorry, I could not process your request.'
    } else {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      source: 'AI',
      model: model,
      response: response,
      ok: true
    })
  } catch (error: any) {
    console.error('AI API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process AI request' },
      { status: 500 }
    )
  }
}
