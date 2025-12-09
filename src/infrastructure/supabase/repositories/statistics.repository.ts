import { contentItemsRepository, ContentItem } from './content-items.repository'

/**
 * Statistics Repository - Uses centralized content_items table
 */
export interface Statistic {
  id: string
  label_ar: string
  label_en: string | null
  value: string
  icon: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export class StatisticsRepository {
  async getAll(): Promise<Statistic[]> {
    const items = await contentItemsRepository.getStatistics()
    return items.map(this.mapToStatistic)
  }

  private mapToStatistic(item: ContentItem): Statistic {
    return {
      id: item.id,
      label_ar: item.title_ar,
      label_en: item.title_en,
      value: item.value || '',
      icon: item.icon,
      order_index: item.order_index,
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at
    }
  }
}

export const statisticsRepository = new StatisticsRepository()

