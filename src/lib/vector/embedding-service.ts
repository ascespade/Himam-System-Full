/**
 * Vector Embedding Service
 * Creates and manages vector embeddings for knowledge base
 */

import { supabaseAdmin } from '../supabase'

export interface EmbeddingResult {
  embedding: number[]
  tokens: number
}

/**
 * Create embedding using OpenAI API
 */
export async function createEmbedding(text: string): Promise<EmbeddingResult | null> {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('OpenAI API key not configured')
      return null
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      embedding: data.data[0].embedding,
      tokens: data.usage.total_tokens
    }
  } catch (error) {
    console.error('Error creating embedding:', error)
    return null
  }
}

/**
 * Save embedding to database
 */
export async function saveEmbedding(
  knowledgeBaseId: string,
  contentChunk: string,
  chunkIndex: number,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  try {
    // Create embedding
    const embeddingResult = await createEmbedding(contentChunk)
    if (!embeddingResult) {
      return null
    }

    // Save to database
    const { data, error } = await supabaseAdmin
      .from('knowledge_base_embeddings')
      .insert({
        knowledge_base_id: knowledgeBaseId,
        content_chunk: contentChunk,
        embedding: embeddingResult.embedding,
        chunk_index: chunkIndex,
        metadata: metadata || {}
      })
      .select('id')
      .single()

    if (error) throw error

    return data.id
  } catch (error) {
    console.error('Error saving embedding:', error)
    return null
  }
}

/**
 * Search similar content using vector similarity
 */
export async function searchSimilarContent(
  query: string,
  limit: number = 10,
  similarityThreshold: number = 0.7
): Promise<Array<{
  id: string
  knowledge_base_id: string
  content_chunk: string
  similarity: number
  metadata: Record<string, unknown>
}>> {
  try {
    // Create embedding for query
    const queryEmbedding = await createEmbedding(query)
    if (!queryEmbedding) {
      return []
    }

    // Use Supabase function for similarity search
    const { data, error } = await supabaseAdmin.rpc('search_knowledge_similarity', {
      query_embedding: queryEmbedding.embedding,
      similarity_threshold: similarityThreshold,
      max_results: limit
    })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error searching similar content:', error)
    return []
  }
}
