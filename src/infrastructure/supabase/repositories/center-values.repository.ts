import { contentItemsRepository, ContentItem } from './content-items.repository'

/**
 * Center Values Repository - Uses centralized content_items table
 */
export interface CenterValue {
  id: string
  title_ar: string
  title_en: string | null
  description_ar: string | null
  description_en: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export class CenterValuesRepository {
  async getAll(): Promise<CenterValue[]> {
    const items = await contentItemsRepository.getValues()
    return items.map(this.mapToValue)
  }

  private mapToValue(item: ContentItem): CenterValue {
    return {
      id: item.id,
      title_ar: item.title_ar,
      title_en: item.title_en,
      description_ar: item.description_ar,
      description_en: item.description_en,
      order_index: item.order_index,
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at
    }
  }
}

export const centerValuesRepository = new CenterValuesRepository()

