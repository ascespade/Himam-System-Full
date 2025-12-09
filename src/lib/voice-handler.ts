import fs from 'fs'
import path from 'path'
import os from 'os'
import axios from 'axios'
import FormData from 'form-data'
import OpenAI from 'openai'
import { getSettings } from './config'

/**
 * Download WhatsApp Media
 */
async function downloadMedia(mediaId: string): Promise<string> {
  const settings = await getSettings()
  if (!settings.WHATSAPP_TOKEN) throw new Error('No WhatsApp Token')

  // 1. Get URL
  const urlRes = await axios.get(`https://graph.facebook.com/v20.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${settings.WHATSAPP_TOKEN}` }
  })
  const mediaUrl = urlRes.data.url

  // 2. Download Binary
  const writer = fs.createWriteStream(path.join(os.tmpdir(), `${mediaId}.ogg`))
  const response = await axios({
    url: mediaUrl,
    method: 'GET',
    responseType: 'stream',
    headers: { Authorization: `Bearer ${settings.WHATSAPP_TOKEN}` }
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(path.join(os.tmpdir(), `${mediaId}.ogg`)))
    writer.on('error', reject)
  })
}

/**
 * Transcribe Audio using Whisper
 */
export async function transcribeAudio(mediaId: string): Promise<string> {
  const settings = await getSettings()
  if (!settings.OPENAI_KEY) throw new Error('No OpenAI Key for Whisper')

  const openai = new OpenAI({ apiKey: settings.OPENAI_KEY })
  
  try {
    const filePath = await downloadMedia(mediaId)
    
    // Check if file exists and has size
    const stat = fs.statSync(filePath)
    if (stat.size === 0) throw new Error('Empty audio file downloaded')

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
      language: 'ar' // Hint Arabic, but it handles mixed
    })

    // Cleanup
    try { fs.unlinkSync(filePath) } catch (e) {}

    return transcription.text
  } catch (error: any) {
    console.error('Transcription Error:', error)
    return '' // Fallback to empty text
  }
}

/**
 * Text-to-Speech & Upload to WhatsApp
 */
export async function generateAndUploadVoice(text: string): Promise<string | null> {
  const settings = await getSettings()
  if (!settings.OPENAI_KEY || !settings.WHATSAPP_PHONE_NUMBER_ID) return null

  const openai = new OpenAI({ apiKey: settings.OPENAI_KEY })

  try {
    // 1. Generate MP3
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'shimmer', // 'shimmer' is often good for female assistant, 'alloy' for neutral
      input: text
    })
    
    const buffer = Buffer.from(await mp3.arrayBuffer())
    const filePath = path.join(os.tmpdir(), `response_${Date.now()}.mp3`)
    fs.writeFileSync(filePath, buffer)

    // 2. Upload to WhatsApp
    const form = new FormData()
    form.append('file', fs.createReadStream(filePath), { contentType: 'audio/mpeg' })
    form.append('messaging_product', 'whatsapp')

    const uploadRes = await axios.post(
      `https://graph.facebook.com/v20.0/${settings.WHATSAPP_PHONE_NUMBER_ID}/media`, 
      form,
      {
        headers: {
          Authorization: `Bearer ${settings.WHATSAPP_TOKEN}`,
          ...form.getHeaders()
        }
      }
    )

    // Cleanup
    try { fs.unlinkSync(filePath) } catch (e) {}

    return uploadRes.data.id
  } catch (error) {
    console.error('TTS/Upload Error:', error)
    return null
  }
}
