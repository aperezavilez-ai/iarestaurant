import { supabase } from '@/lib/supabase'
import { isSupabaseConfigured } from '@/lib/config'

const BUCKET = 'product-images'

export const imageUploadService = {
  async uploadProductImage(file: File, tenantId: string, productId: string): Promise<string> {
    if (!isSupabaseConfigured()) {
      return URL.createObjectURL(file)
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
    const path = `${tenantId}/${productId}.${safeExt}`

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type || `image/${safeExt}`,
    })
    if (error) throw error

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  },
}
