import { contentItemsRepository, ContentItem } from './content-items.repository'

/**
 * Center Features Repository - Uses centralized content_items table
 */
export interface CenterFeature {
  id: string
  title_ar: string
  title_en: string | null
  description_ar: string | null
  description_en: string | null
  icon: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export class CenterFeaturesRepository {
  async getAll(): Promise<CenterFeature[]> {
    const items = await contentItemsRepository.getFeatures()
    return items.map(this.mapToFeature)
  }

  private mapToFeature(item: ContentItem): CenterFeature {
    return {
      id: item.id,
      title_ar: item.title_ar,
      title_en: item.title_en,
      description_ar: item.description_ar,
      description_en: item.description_en,
      icon: item.icon,
      order_index: item.order_index,
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at
    }
  }
}

export const centerFeaturesRepository = new CenterFeaturesRepository()

