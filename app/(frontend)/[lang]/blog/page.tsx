import Newsletter from '@/components/frontend/Features/Newsletter'
import Feed from '@/components/frontend/Features/Blog/Feed'
import CategoryBullets from '@/components/frontend/Features/CategoryBullets'
import type { Metadata } from 'next'
import MetadataHelper from '@/helpers/MetadataHelper'
import PostService from '@/services/PostService'
import { AVAILABLE_LANGUAGES } from '@/types/common/I18nTypes'
import { buildAlternates, getOgLocale } from '@/helpers/HreflangHelper'
import { getPageMetadata } from '@/libs/localize/getDictionary'

const APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST

type Props = {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const { canonical, languages } = buildAlternates(lang, '/blog', [...AVAILABLE_LANGUAGES])
  const { title, description, keywords } = await getPageMetadata(lang, 'blog')

  return {
    title,
    description,
    keywords,
    robots: { index: true, follow: true },
    authors: [{ name: 'Kuray Karaaslan', url: APPLICATION_HOST || 'https://kuray.dev' }],
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      images: [
        {
          url: `${APPLICATION_HOST}/assets/img/og.png`,
          width: 1200,
          height: 630,
          alt: 'Kuray Karaaslan Blog',
        },
      ],
      locale: getOgLocale(lang),
      siteName: 'Kuray Karaaslan',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@kuraykaraaslan',
      creator: '@kuraykaraaslan',
      title,
      description,
      images: [`${APPLICATION_HOST}/assets/img/og.png`],
    },
    alternates: { canonical, languages },
  }
}

const BlogPage = async ({ params }: Props) => {
  const { lang } = await params
  const { title, description } = await getPageMetadata(lang, 'blog')

  // Metadata for JSON-LD only (meta tags handled by export above)
  const jsonLdMetadata: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${APPLICATION_HOST}/blog`,
      images: [`${APPLICATION_HOST}/assets/img/og.png`],
    },
  }

  const breadcrumbs = [
    { name: 'Home', url: `${APPLICATION_HOST}/` },
    { name: 'Blog', url: `${APPLICATION_HOST}/blog` },
  ]

  // Fetch first page of posts for CollectionPage schema
  let collectionPosts: { title: string; url: string; datePublished?: string }[] = []
  try {
    const response = await PostService.getAllPosts({ page: 0, pageSize: 6, status: 'PUBLISHED', lang })
    collectionPosts = response.posts.map((p) => ({
      title: p.title,
      url: `${APPLICATION_HOST}/blog/${p.category.slug}/${p.slug}`,
      datePublished: p.createdAt?.toISOString(),
    }))
  } catch (error) {
    console.error('Error fetching posts for CollectionPage schema:', error)
  }

  return (
    <>
      {MetadataHelper.generateJsonLdScripts(jsonLdMetadata, {
        breadcrumbs,
        collectionPage:
          collectionPosts.length > 0
            ? {
                url: `${APPLICATION_HOST}/blog`,
                name: title,
                description,
                posts: collectionPosts,
              }
            : undefined,
      })}
      <Feed />
      <CategoryBullets />
      <Newsletter />
    </>
  )
}

export default BlogPage
