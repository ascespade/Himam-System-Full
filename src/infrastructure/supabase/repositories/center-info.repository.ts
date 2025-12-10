import { supabase } from '@/lib'

export interface CenterInfo {
  id: string
  name_ar: string
  name_en: string
  description_ar: string
  description_en: string
  mission_ar: string
  mission_en: string
  vision_ar: string
  vision_en: string
  address_ar: string
  address_en: string
  city_ar: string
  city_en: string
  country_ar: string
  country_en: string
  phone: string
  mobile: string | null
  email: string
  website: string | null
  whatsapp: string | null
  logo_url: string | null
  banner_url: string | null
  created_at: string
  updated_at: string
}

export class CenterInfoRepository {
  async getCenterInfo(): Promise<CenterInfo | null> {
    const { data, error } = await supabase
      .from('center_info')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching center info:', error)
      return null
    }

    return data as CenterInfo | null
  }

  async updateCenterInfo(id: string, updates: Partial<CenterInfo>): Promise<CenterInfo | null> {
    const { data, error } = await supabase
      .from('center_info')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating center info:', error)
      return null
    }

    return data as CenterInfo
  }
}

export const centerInfoRepository = new CenterInfoRepository()

