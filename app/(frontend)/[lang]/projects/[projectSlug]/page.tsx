import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Newsletter from '@/components/frontend/Features/Newsletter'
import ProjectService from '@/services/ProjectService'
import SingleProject from '@/components/frontend/Features/SingleProject'
import ProjectHeader from '@/components/frontend/Features/Projects/ProjectHeader'
import MetadataHelper from '@/helpers/MetadataHelper'
import Breadcrumb from '@/components/common/Layout/Breadcrumb'

const NEXT_PUBLIC_APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST

type Props = {
  params: Promise<{ projectSlug: string }>
}

async function getProject(projectSlug: string) {
  const response = await ProjectService.getAllProjects({
    projectSlug,
    page: 0,
    pageSize: 1,
    onlyPublished: true,
  })
  return response.projects[0] || null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectSlug } = await params
  const project = await getProject(projectSlug)

  if (!project) return {}

  const url = `${NEXT_PUBLIC_APPLICATION_HOST}/projects/${project.slug}`
  const description = project.description || project.content.substring(0, 160)
  const image = project.image || `${NEXT_PUBLIC_APPLICATION_HOST}/assets/img/og.png`

  return {
    title: `${project.title} | Kuray Karaaslan`,
    description,
    keywords: project.technologies,
    robots: { index: true, follow: true },
    authors: [{ name: 'Kuray Karaaslan', url: NEXT_PUBLIC_APPLICATION_HOST || 'https://kuray.dev' }],
    openGraph: {
      title: `${project.title} | Kuray Karaaslan`,
      description,
      type: 'website',
      url,
      images: [{ url: image, width: 1200, height: 630, alt: project.title }],
      locale: 'en_US',
      siteName: 'Kuray Karaaslan',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@kuraykaraaslan',
      creator: '@kuraykaraaslan',
      title: `${project.title} | Kuray Karaaslan`,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function ProjectPage({ params }: Props) {
  try {
    const { projectSlug } = await params

    if (!projectSlug) notFound()

    const project = await getProject(projectSlug)

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
            <SingleProject {...project} />
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
