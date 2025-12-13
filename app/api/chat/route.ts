import { NextResponse } from 'next/server'
import { generateWhatsAppResponse } from '@/lib/ai'
import { v4 as uuidv4 } from 'uuid'
import { withRateLimit } from '@/core/api/middleware/withRateLimit'
import type { NextRequest } from 'next/server'

export const POST = withRateLimit(async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json()
    const session = sessionId || `web_${uuidv4()}`
    
    // We treat web users as a special "phone number" for context storage
    // or just pass a generic ID.
    const response = await generateWhatsAppResponse(
       session, 
       message, 
       [], // No history initially for simplicity, or we can fetch it
       'Web Guest' // Name
    )

    return NextResponse.json({ 
       success: true, 
       response: response.text, 
       sessionId: session
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ'

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}, 'api')
