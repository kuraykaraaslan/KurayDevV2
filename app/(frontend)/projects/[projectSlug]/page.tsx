import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Newsletter from '@/components/frontend/Features/Newsletter';
import ProjectService from '@/services/ProjectService';
import Image from 'next/image';
import SingleProject from '@/components/frontend/Features/SingleProject';
import SingleLink from '@/components/frontend/Features/Hero/Projects/Partials/SingleLink';
import MetadataHelper from '@/helpers/MetadataHelper';

const NEXT_PUBLIC_APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST;

type Props = {
    params: Promise<{ projectSlug: string }>;
};

async function getProject(projectSlug: string) {
    const response = await ProjectService.getAllProjects({
        projectSlug,
        page: 0,
        pageSize: 1,
        onlyPublished: true,
    });
    return response.projects[0] || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { projectSlug } = await params;
    const project = await getProject(projectSlug);

    if (!project) return {};

    const url = `${NEXT_PUBLIC_APPLICATION_HOST}/projects/${project.slug}`;
    const description = project.description || project.content.substring(0, 160);
    const image = project.image || `${NEXT_PUBLIC_APPLICATION_HOST}/assets/img/og.png`;

    return {
        title: `${project.title} | Kuray Karaaslan`,
        description,
        keywords: project.technologies,
        robots: { index: true, follow: true },
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
    };
}

export default async function ProjectPage({ params }: Props) {
    try {
        const { projectSlug } = await params;

        if (!projectSlug) {
            notFound();
        }

        const project = await getProject(projectSlug);

        if (!project) {
            notFound();
        }

        const url = `${NEXT_PUBLIC_APPLICATION_HOST}/projects/${project.slug}`;
        const description = project.description || project.content.substring(0, 160);

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
        };

        const breadcrumbs = [
            { name: 'Home', url: `${NEXT_PUBLIC_APPLICATION_HOST}/` },
            { name: 'Projects', url: `${NEXT_PUBLIC_APPLICATION_HOST}/projects` },
            { name: project.title, url },
        ];

        const applicationBody = project.content
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000);

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
                <section className="min-h-screen pt-32 pb-8 bg-base-100" id="project">
                    <div className="mx-auto px-4 lg:px-8 mb-8 flex justify-between md:flex-row flex-col h-full md:gap-2">
                        <div className="flex-none flex md:min-w-80">
                            <div className="md:w-80 h-full rounded-lg bg-base-300 md:shadow-lg md:drop-shadow-lg border border-base-200">
                                <Image
                                    src={project.image || 'https://kuray.dev/images/logo.png'}
                                    alt={project.title}
                                    width={400}
                                    height={400}
                                    layout="responsive"
                                    className="rounded-t-lg object-cover"
                                />
                                <div className="flex flex-col space-y-2 mt-4 p-4">
                                    <h1 className="text-xl font-bold">{project.title}</h1>
                                    <h2 className="text-sm">
                                        <span className="font-bold">Description:</span> {project.description}
                                    </h2>
                                    <h2 className="text-sm">
                                        <span className="font-bold">Technologies:</span> {project.technologies.join(', ')}
                                    </h2>
                                    <h3 className="text-sm">
                                        <span className="font-bold mb-2">Platforms:</span> {project.platforms.join(', ')}
                                    </h3>
                                    <div className="flex space-x-2 mt-4">
                                        {(project.projectLinks || []).map((link: string, index: number) => (
                                            <SingleLink key={index} url={link} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <SingleProject {...project} />
                        </div>
                    </div>
                </section>
                <Newsletter backgroundColor="bg-base-200" />
            </>
        );
    } catch (error) {
        console.error('Error fetching project:', error);
        notFound();
    }
}
