import { contentItemsRepository, ContentItem } from './content-items.repository'

/**
 * Social Media Repository - Uses centralized content_items table
 */
export interface SocialMedia {
  id: string
  platform: string
  url: string
  icon: string | null
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export class SocialMediaRepository {
  async getAll(): Promise<SocialMedia[]> {
    const items = await contentItemsRepository.getSocialMedia()
    return items.map(this.mapToSocialMedia)
  }

  private mapToSocialMedia(item: ContentItem): SocialMedia {
    return {
      id: item.id,
      platform: item.platform || '',
      url: item.url || '',
      icon: item.icon,
      is_active: item.is_active,
      order_index: item.order_index,
      created_at: item.created_at,
      updated_at: item.updated_at
    }
  }
}

export const socialMediaRepository = new SocialMediaRepository()

