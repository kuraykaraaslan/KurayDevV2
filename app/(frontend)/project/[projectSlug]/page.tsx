import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Newsletter from '@/components/frontend/Newsletter';
import ProjectService from '@/services/ProjectService';
import Image from 'next/image';
import SingleProject from '@/components/frontend/SingleProject';
import { faDownload, faExternalLinkAlt, faFile } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faYoutube, faLinkedin, faTwitter, faInstagram, faFacebook, faDiscord, faGitlab } from '@fortawesome/free-brands-svg-icons';
import { useParams } from 'next/navigation';

const SinglePin = ({ bgColor, textColor, text }: { bgColor: string, textColor: string, text: string }) => (
    <div className={`bg-${bgColor} text-${textColor} rounded-lg p-1`}>
        <p className="text-center">{text}</p>
    </div>
);

export default async function ProjectPage() {

    // disabled
    return notFound();

    try {


        const params = useParams();


        const response = await ProjectService.getAllProjects({
            slug: params.projectSlug,
            page: 1,
            pageSize: 1,
            onlyPublished: true
        });

        if (!response.projects || response.projects.length === 0) {
            notFound();
        }

        const project = response.projects[0];
        const meta = generateMetadata(project);
        const readTime = Math.ceil(project.content.split(' ').length / 200);

        return (
            <>
                {generateMetadataElement(meta)}
                <section className="min-h-screen pt-32 pb-8 bg-base-100" id="project">
                    <div className="mx-auto px-4 lg:px-8 mb-8 flex justify-between md:flex-row flex-col h-full gap-2">
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
                                        <span className="font-bold mb-2">Categories:</span> {project.platforms.join(', ')}
                                    </h3>
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
        return (
            <div className="text-center text-red-500 py-10">
                Oops! Something went wrong while loading the project. Please try again later.
            </div>
        );
    }
}

function generateMetadata(project: any): Metadata {
    return {
        title: `${project.title} | Kuray Karaaslan`,
        description: project.description || project.content.substring(0, 160),
        openGraph: {
            title: `${project.title} | Kuray Karaaslan`,
            description: project.description || project.content.substring(0, 160),
            type: 'article',
            url: `https://kuray.dev/project/${project.slug}/`,
            images: [project.image || 'https://kuray.dev/images/logo.png'],
        },
    };
}

function generateMetadataElement(meta: Metadata) {
    return (
        <>
            <title>{String(meta?.title)}</title>
            <meta name="description" content={String(meta?.description)} />
            <meta property="og:title" content={String(meta?.openGraph?.title)} />
            <meta property="og:description" content={String(meta?.openGraph?.description)} />
            <meta property="og:type" content="article" />
            <meta property="og:url" content={String(meta?.openGraph?.url)} />
            <meta property="og:image" content={Array.isArray(meta?.openGraph?.images) ? String(meta?.openGraph?.images?.[0]) : String(meta?.openGraph?.images)} />
            <meta property="og:site_name" content="kuray.dev" />
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:title" content={String(meta?.openGraph?.title)} />
            <meta property="twitter:description" content={String(meta?.openGraph?.description)} />
            <meta property="twitter:image" content={Array.isArray(meta?.openGraph?.images) ? String(meta?.openGraph?.images?.[0]) : String(meta?.openGraph?.images)} />
            <link rel="canonical" href={String(meta?.openGraph?.url)} />
        </>
    );
}

const allowedIconOptions = [
    { value: 'github', label: 'GitHub', icon: faGithub },
    { value: 'demo', label: 'Demo', icon: faExternalLinkAlt },
    { value: 'gitlab', label: 'GitLab', icon: faGitlab },
    { value: 'download', label: 'Download', icon: faDownload },
    { value: 'link', label: 'Link', icon: faExternalLinkAlt },
    { value: 'file', label: 'File', icon: faFile },
    { value: 'external-link', label: 'External Link', icon: faExternalLinkAlt },
    { value: 'youtube', label: 'YouTube', icon: faYoutube },
    { value: 'linkedin', label: 'LinkedIn', icon: faLinkedin },
    { value: 'twitter', label: 'Twitter', icon: faTwitter },
    { value: 'instagram', label: 'Instagram', icon: faInstagram },
    { value: 'facebook', label: 'Facebook', icon: faFacebook },
    { value: 'discord', label: 'Discord', icon: faDiscord },
];
