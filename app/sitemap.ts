import type { MetadataRoute } from 'next'

const APP_URL = process.env.APP_URL

export default async function sitemap() : Promise<MetadataRoute.Sitemap> {

  return [
     {
      url: `${APP_URL}/`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${APP_URL}/freelance`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.7
    },
    {
      url: `${APP_URL}/blog`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.7
    },
    {
      url: `${APP_URL}/blog/sitemap.xml`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.7
    }
  ]
}


