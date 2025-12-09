/**
 * Knowledge Manager
 * Manages knowledge base with vector embeddings
 */

import { supabaseAdmin } from '../supabase'
import { saveEmbedding, searchSimilarContent } from './embedding-service'

/**
 * Add knowledge to knowledge base with embeddings
 */
export async function addKnowledge(
  title: string,
  content: string,
  category: 'faq' | 'article' | 'training' | 'policy',
  tags?: string[]
): Promise<string | null> {
  try {
    // Create knowledge base entry
    const { data: kbEntry, error: kbError } = await supabaseAdmin
      .from('knowledge_base')
      .insert({
        title,
        content,
        category,
        tags: tags || []
      })
      .select('id')
      .single()

    if (kbError) throw kbError

    // Split content into chunks and create embeddings
    const chunks = splitIntoChunks(content, 500) // 500 chars per chunk

    for (let i = 0; i < chunks.length; i++) {
      await saveEmbedding(
        kbEntry.id,
        chunks[i],
        i,
        { title, category, tags }
      )
    }

    return kbEntry.id
  } catch (error) {
    console.error('Error adding knowledge:', error)
    return null
  }
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(
  query: string,
  limit: number = 10
): Promise<Array<{
  id: string
  title: string
  content: string
  category: string
  similarity: number
}>> {
  try {
    const results = await searchSimilarContent(query, limit)

    // Get full knowledge base entries
    const knowledgeIds = [...new Set(results.map(r => r.knowledge_base_id))]

    const { data: knowledgeEntries } = await supabaseAdmin
      .from('knowledge_base')
      .select('id, title, content, category')
      .in('id', knowledgeIds)

    // Combine results
    return results.map(result => {
      const entry = knowledgeEntries?.find(e => e.id === result.knowledge_base_id)
      return {
        id: result.knowledge_base_id,
        title: entry?.title || '',
        content: result.content_chunk,
        category: entry?.category || '',
        similarity: result.similarity
      }
    }).sort((a, b) => b.similarity - a.similarity)
  } catch (error) {
    console.error('Error searching knowledge:', error)
    return []
  }
}

/**
 * Split text into chunks
 */
function splitIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = []
  let currentChunk = ''

  const sentences = text.split(/[.!?]\s+/)

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}
