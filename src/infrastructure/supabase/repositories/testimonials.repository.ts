import { contentItemsRepository, ContentItem } from './content-items.repository'

/**
 * Testimonials Repository - Uses centralized content_items table
 */
export interface Testimonial {
  id: string
  name: string
  role: string | null
  content_ar: string
  content_en: string | null
  rating: number
  is_featured: boolean
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export class TestimonialsRepository {
  async getFeatured(limit: number = 3): Promise<Testimonial[]> {
    const items = await contentItemsRepository.getFeaturedTestimonials(limit)
    return items.map(this.mapToTestimonial)
  }

  async getAll(limit?: number): Promise<Testimonial[]> {
    const items = await contentItemsRepository.getByType('testimonial', { limit })
    return items.map(this.mapToTestimonial)
  }

  private mapToTestimonial(item: ContentItem): Testimonial {
    return {
      id: item.id,
      name: item.name || '',
      role: item.role,
      content_ar: item.description_ar || item.title_ar, // Use description_ar if available, fallback to title_ar
      content_en: item.description_en || item.title_en,
      rating: item.rating || 5,
      is_featured: item.is_featured,
      is_active: item.is_active,
      order_index: item.order_index,
      created_at: item.created_at,
      updated_at: item.updated_at
    }
  }
}

export const testimonialsRepository = new TestimonialsRepository()

