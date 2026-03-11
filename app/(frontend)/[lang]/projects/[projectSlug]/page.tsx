
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Newsletter from '@/components/frontend/Features/Newsletter'
import ProjectService from '@/services/ProjectService'
import ProjectHeader from '@/components/frontend/Features/Projects/ProjectHeader'
import MetadataHelper from '@/helpers/MetadataHelper'
import Breadcrumb from '@/components/common/Layout/Breadcrumb'
import { buildAlternates, getOgLocale } from '@/helpers/HreflangHelper'
import Article from '@/components/frontend/Features/Blog/Article'
import redisInstance from '@/libs/redis'
import {ProjectTranslation } from '@/types/content/ProjectTypes'


const NEXT_PUBLIC_APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST
const FRONTEND_PROJECT_CACHE_TTL = 60 // Cache for 60 seconds
const FRONTEND_PROJECT_CACHE_KEY_PREFIX = 'frontend:project:'

type Props = {
  params: Promise<{ lang: string; projectSlug: string }>
}

async function getProject(projectSlug: string, lang: string) {
  const cacheKey = `${FRONTEND_PROJECT_CACHE_KEY_PREFIX}${projectSlug}:${lang}`
  try {
    const cached = await redisInstance.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (error) {
    console.error('Error fetching project from Redis cache:', error)
  }
  const response = await ProjectService.getAllProjects({
    projectSlug,
    page: 0,
    pageSize: 1,
    onlyPublished: true,
  })
  const project = response.projects[0] || null
  if (project) {
    await redisInstance.set(cacheKey, JSON.stringify(project), 'EX', FRONTEND_PROJECT_CACHE_TTL)
  }
  return project
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, projectSlug } = await params
  const project = await getProject(projectSlug, lang)

  if (!project) return {}

  const translation = lang !== 'en' ? project.translations?.find((t: ProjectTranslation) => t.lang === lang) : null
  const title = translation?.title ?? project.title
  const description = translation?.description ?? project.description ?? project.content.substring(0, 160)
  const image = project.image || `${NEXT_PUBLIC_APPLICATION_HOST}/assets/img/og.png`

  const path = `/projects/${projectSlug}`
  const availableLangs = ['en', ...(project.translations?.map((t: ProjectTranslation) => t.lang) ?? [])]
  const { canonical, languages } = buildAlternates(lang, path, availableLangs)

  return {
    title: `${title} | Kuray Karaaslan`,
    description,
    keywords: project.technologies,
    robots: { index: true, follow: true },
    authors: [{ name: 'Kuray Karaaslan', url: NEXT_PUBLIC_APPLICATION_HOST || 'http://localhost:3000' }],
    openGraph: {
      title: `${title} | Kuray Karaaslan`,
      description,
      type: 'website',
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      locale: getOgLocale(lang),
      siteName: 'Kuray Karaaslan',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@kuraykaraaslan',
      creator: '@kuraykaraaslan',
      title: `${title} | Kuray Karaaslan`,
      description,
      images: [image],
    },
    alternates: { canonical, languages },
  }
}

export default async function ProjectPage({ params }: Props) {
  try {
    const { projectSlug, lang } = await params

    if (!projectSlug) notFound()

    const project = await getProject(projectSlug, lang)

    if (!project) notFound()

    const url = `${NEXT_PUBLIC_APPLICATION_HOST}/projects/${project.slug}`
    const description = project.description || project.content.substring(0, 160)

    const metadata: Metadata = {
      title: `${project.title} | Kuray Karaaslan`,
      description,
      openGraph: {
        title: `${project.title} | Kuray Karaaslan`,
        description,
        type: 'website',
        url,
        images: [project.image || `${NEXT_PUBLIC_APPLICATION_HOST}/assets/img/og.png`],
      },
    }

    const breadcrumbs = [
      { name: 'Home', url: `${NEXT_PUBLIC_APPLICATION_HOST}/` },
      { name: 'Projects', url: `${NEXT_PUBLIC_APPLICATION_HOST}/projects` },
      { name: project.title, url },
    ]

    const applicationBody = project.content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000)

    return (
      <>
        {MetadataHelper.generateJsonLdScripts(metadata, {
          softwareApp: {
            name: project.title,
            description,
            url,
            image: project.image || undefined,
            datePublished: project.createdAt?.toISOString(),
            dateModified: project.updatedAt?.toISOString() || project.createdAt?.toISOString(),
            technologies: project.technologies,
            platforms: project.platforms,
            applicationBody,
          },
          breadcrumbs,
        })}
        <section className="min-h-screen bg-base-100 pt-32" id="blog">
          <div className="container mx-auto px-4 lg:px-8 mb-8 flex-grow flex-col max-w-7xl">
            <Breadcrumb items={breadcrumbs} />
            <ProjectHeader {...project} />
            <Article title={project.title} content={project.content} image={project.image ?? ''} />
          </div>
        </section>
        <Newsletter backgroundColor="bg-base-200" />
      </>
    )
  } catch (error) {
    console.error('Error fetching project:', error)
    notFound()
  }
}
