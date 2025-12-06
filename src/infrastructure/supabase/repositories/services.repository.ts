import { contentItemsRepository, ContentItem } from './content-items.repository'

/**
 * Services Repository - Uses centralized content_items table
 * This is a wrapper around contentItemsRepository for type safety
 */
export interface Service {
  id: string
  title_ar: string
  title_en: string
  description_ar: string
  description_en: string
  icon: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export class ServicesRepository {
  async getAll(): Promise<Service[]> {
    const items = await contentItemsRepository.getServices()
    return items.map(this.mapToService)
  }

  async getById(id: string): Promise<Service | null> {
    const item = await contentItemsRepository.getById(id)
    if (!item || item.type !== 'service') return null
    return this.mapToService(item)
  }

  private mapToService(item: ContentItem): Service {
    return {
      id: item.id,
      title_ar: item.title_ar,
      title_en: item.title_en || '',
      description_ar: item.description_ar || '',
      description_en: item.description_en || '',
      icon: item.icon,
      order_index: item.order_index,
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at
    }
  }
}

export const servicesRepository = new ServicesRepository()

