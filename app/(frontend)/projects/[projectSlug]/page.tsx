import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Newsletter from '@/components/frontend/Features/Newsletter';
import ProjectService from '@/services/ProjectService';
import Image from 'next/image';
import SingleProject from '@/components/frontend/Features/SingleProject';
import SingleLink from '@/components/frontend/Features/Hero/Projects/Partials/SingleLink';
import SingleTag from '@/components/frontend/Features/Hero/Projects/Partials/SingleTag';
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

        if (!projectSlug) notFound();

        const project = await getProject(projectSlug);

        if (!project) notFound();

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

        const formattedDate = project.createdAt
            ? new Date(project.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
            })
            : null;

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

                {/* App-store style header */}
                <div className="bg-base-200 pt-32 pb-10 border-b border-base-300">
                    <div className="max-w-5xl mx-auto px-4 lg:px-8">

                        {/* Breadcrumb */}
                        <nav className="text-xs text-base-content/50 mb-6 flex items-center gap-1">
                            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                            <span>/</span>
                            <Link href="/projects" className="hover:text-primary transition-colors">Projects</Link>
                            <span>/</span>
                            <span className="text-base-content/80 truncate max-w-[200px]">{project.title}</span>
                        </nav>

                        {/* Project header row */}
                        <div className="flex flex-col sm:flex-row gap-6 md:gap-8">

                            {/* Thumbnail */}
                            <div className="flex-none">
                                <Image
                                    src={project.image || '/assets/img/og.png'}
                                    alt={project.title}
                                    width={192}
                                    height={192}
                                    className="w-28 h-28 md:w-48 md:h-48 rounded-2xl object-cover shadow-xl border-2 border-base-300"
                                    unoptimized
                                    priority
                                />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
                                    {project.title}
                                </h1>

                                {project.description && (
                                    <p className="mt-2 text-base-content/65 text-sm md:text-base leading-relaxed max-w-2xl">
                                        {project.description}
                                    </p>
                                )}

                                {/* Tech tags */}
                                {project.technologies.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-4">
                                        {project.technologies.map((tech, i) => (
                                            <SingleTag key={i} technology={tech} />
                                        ))}
                                    </div>
                                )}

                                {/* Platforms + date */}
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    {project.platforms.map((platform, i) => (
                                        <span key={i} className="badge badge-ghost badge-sm capitalize">
                                            {platform}
                                        </span>
                                    ))}
                                    {formattedDate && (
                                        <span className="text-xs text-base-content/40 ml-auto hidden sm:block">
                                            {formattedDate}
                                        </span>
                                    )}
                                </div>

                                {/* Links */}
                                {project.projectLinks.length > 0 && (
                                    <div className="flex flex-wrap gap-3 mt-5">
                                        {project.projectLinks.map((link, i) => (
                                            <span key={i} className="btn btn-outline btn-sm">
                                                <SingleLink url={link} />
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <section className="bg-base-100 py-12 pb-20" id="project">
                    <div className="max-w-5xl mx-auto px-4 lg:px-8 flex gap-8 items-start">
                        <div className="flex-1 min-w-0">
                            <SingleProject {...project} />
                        </div>
                        <div className="hidden lg:flex flex-col gap-2 flex-none w-36">
                            <Link href="/projects" className="btn btn-ghost btn-sm w-full">
                                ← All Projects
                            </Link>
                        </div>
                    </div>
                    <div className="lg:hidden max-w-5xl mx-auto px-4 lg:px-8 mt-4">
                        <Link href="/projects" className="btn btn-ghost btn-sm">
                            ← All Projects
                        </Link>
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
