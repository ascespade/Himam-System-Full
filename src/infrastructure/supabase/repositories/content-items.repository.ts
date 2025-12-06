import { supabase } from '@/src/lib/supabase'

export type ContentItemType = 'service' | 'testimonial' | 'statistic' | 'value' | 'feature' | 'social_media'

export interface ContentItem {
  id: string
  type: ContentItemType
  title_ar: string
  title_en: string | null
  description_ar: string | null
  description_en: string | null
  icon: string | null
  value: string | null
  rating: number | null
  name: string | null
  role: string | null
  url: string | null
  platform: string | null
  is_featured: boolean
  is_active: boolean
  order_index: number
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export class ContentItemsRepository {
  /**
   * Get all content items of a specific type
   */
  async getByType(type: ContentItemType, options?: {
    featured?: boolean
    limit?: number
  }): Promise<ContentItem[]> {
    let query = supabase
      .from('content_items')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (options?.featured !== undefined) {
      query = query.eq('is_featured', options.featured)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching ${type} items:`, error)
      return []
    }

    return (data || []) as ContentItem[]
  }

  /**
   * Get single content item by ID
   */
  async getById(id: string): Promise<ContentItem | null> {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching content item:', error)
      return null
    }

    return data as ContentItem
  }

  /**
   * Get services
   */
  async getServices(): Promise<ContentItem[]> {
    return this.getByType('service')
  }

  /**
   * Get featured testimonials
   */
  async getFeaturedTestimonials(limit: number = 3): Promise<ContentItem[]> {
    return this.getByType('testimonial', { featured: true, limit })
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<ContentItem[]> {
    return this.getByType('statistic')
  }

  /**
   * Get values
   */
  async getValues(): Promise<ContentItem[]> {
    return this.getByType('value')
  }

  /**
   * Get features
   */
  async getFeatures(): Promise<ContentItem[]> {
    return this.getByType('feature')
  }

  /**
   * Get social media links
   */
  async getSocialMedia(): Promise<ContentItem[]> {
    return this.getByType('social_media')
  }
}

export const contentItemsRepository = new ContentItemsRepository()

