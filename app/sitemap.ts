import type { MetadataRoute } from 'next'

const APP_URL = process.env.APP_URL
const I18N_LANGUAGES = process.env.I18N_LANGUAGES || 'en, tr'


export default async function sitemap() : Promise<MetadataRoute.Sitemap> {

  const I18N_LANGUAGES = process.env.I18N_LANGUAGES ? process.env.I18N_LANGUAGES.split(',') : ['en']
  console.log(I18N_LANGUAGES.reduce((acc, lang) => {
    acc[`${lang}`] = `${APP_URL}/${lang}`;
    return acc;
  }, {} as Record<string, string>)
  )

  return [
     {
      url: `${APP_URL}/en`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.7,
      alternates: {
        languages: I18N_LANGUAGES.reduce((acc, lang) => {
          acc[`${lang}`] = `${APP_URL}/${lang}`;
          return acc;
        } , {} as Record<string, string>)
      }
    },
    {
      url: `${APP_URL}/freelance`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.7,
      alternates: {
        languages: I18N_LANGUAGES.reduce((acc, lang) => {
          acc[`${lang}`] = `${APP_URL}/${lang}/freelance`;
          return acc;
        } , {} as Record<string, string>)
      }
    },
    {
      url: `${APP_URL}/en/blog`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.7
    },
    {
      url: `${APP_URL}/en/blog/sitemap.xml`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.7
    }
  ]
}


