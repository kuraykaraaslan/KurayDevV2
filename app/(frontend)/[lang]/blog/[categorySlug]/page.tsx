import Newsletter from '@/components/frontend/Features/Newsletter'
import Feed from '@/components/frontend/Features/Blog/Feed'
import CategoryService from '@/services/CategoryService'
import PostService from '@/services/PostService'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import MetadataHelper from '@/helpers/MetadataHelper'
import { buildAlternates, getOgLocale } from '@/helpers/HreflangHelper'

const APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST

type Props = {
  params: Promise<{ lang: string; categorySlug: string }>
}

async function getCategory(categorySlug: string, lang: string) {
  return await CategoryService.getCategoryBySlug(categorySlug, lang)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug, lang } = await params
  const category = await getCategory(categorySlug, lang)

  if (!category) {
    return {}
  }

  const path = `/blog/${categorySlug}`
  const description = category.description || `Discover posts in the ${category.title} category.`
  const image = category.image || `${APPLICATION_HOST}/assets/img/og.png`

  const availableLangs = ['en', ...(category.translations?.map((t) => t.lang) ?? [])]
  const { canonical, languages } = buildAlternates(lang, path, availableLangs)

  return {
    title: `${category.title} | Kuray Karaaslan`,
    description,
    robots: { index: true, follow: true },
    authors: [{ name: 'Kuray Karaaslan', url: APPLICATION_HOST || 'https://kuray.dev' }],
    openGraph: {
      title: `${category.title} | Kuray Karaaslan`,
      description,
      type: 'website',
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: category.title }],
      locale: getOgLocale(lang),
      siteName: 'Kuray Karaaslan',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@kuraykaraaslan',
      creator: '@kuraykaraaslan',
      title: `${category.title} | Kuray Karaaslan`,
      description,
      images: [image],
    },
    alternates: { canonical, languages },
  }
}

export default async function CategoryPage({ params }: Props) {
  try {
    const { categorySlug, lang } = await params

    if (!categorySlug) {
      notFound()
    }

    const category = await getCategory(categorySlug, lang)

    if (!category) {
      notFound()
    }

    const url = `${APPLICATION_HOST}/blog/${category.slug}`

    // Metadata for JSON-LD
    const metadata: Metadata = {
      title: `${category.title} | Kuray Karaaslan`,
      description: category.description || `Discover posts in the ${category.title} category.`,
      openGraph: {
        title: `${category.title} | Kuray Karaaslan`,
        description:
          category.description || `Explore all articles in the ${category.title} category.`,
        type: 'website',
        url,
        images: [category.image || `${APPLICATION_HOST}/assets/img/og.png`],
      },
    }

    // Breadcrumbs for SEO
    const breadcrumbs = [
      { name: 'Home', url: `${APPLICATION_HOST}/` },
      { name: 'Blog', url: `${APPLICATION_HOST}/blog` },
      { name: category.title, url },
    ]

    // Fetch first page of posts for CollectionPage schema
    let collectionPosts: { title: string; url: string; datePublished?: string }[] = []
    try {
      const response = await PostService.getAllPosts({
        page: 0,
        pageSize: 6,
        categoryId: category.categoryId,
        status: 'PUBLISHED',
        lang,
      })
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
        {MetadataHelper.generateJsonLdScripts(metadata, {
          breadcrumbs,
          collectionPage:
            collectionPosts.length > 0
              ? {
                  url,
                  name: `${category.title} | Kuray Karaaslan`,
                  description:
                    category.description || `Discover posts in the ${category.title} category.`,
                  posts: collectionPosts,
                }
              : undefined,
        })}
        <Feed category={category} />
        <Newsletter />
      </>
    )
  } catch (error) {
    console.error('Error fetching category:', error)
    notFound()
  }
}
