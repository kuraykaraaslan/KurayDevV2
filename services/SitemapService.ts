// services/SitemapService.ts
import axios from 'axios'
import { SitemapType, Sitemaps } from '@/types/common/SitemapTypes'

class SitemapService {
  // Google ping URL
  private static googlePingUrl = 'https://www.google.com/ping'

  static async pingGoogleSitemap(type: SitemapType): Promise<boolean> {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/sitemaps/${Sitemaps[type]}`

    try {
      const pingUrl = `${this.googlePingUrl}?sitemap=${encodeURIComponent(url)}`

      const res = await axios.get(pingUrl, {
        // Any request is okay — Google does not require content type.
        validateStatus: () => true,
      })

      if (res.status >= 200 && res.status < 300) {
        return true
      }

      return false
    } catch (err) {
      console.error('[SitemapService] Google ping failed:', err)
      return false
    }
  }
}

export default SitemapService
