import React from 'react';
import axiosInstance from '@/libs/axios';
import PostService from '@/services/PostService';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Comments from '@/components/frontend/Comments';
import RelatedArticles from '@/components/frontend/RelatedArticles';
import OtherPosts from '@/components/frontend/OtherPosts';
import PostCard from '@/components/frontend/OtherPosts/Partials/PostCard';
import Newsletter from '@/components/frontend/Newsletter';
import ProjectService from '@/services/ProjectService';
import Image from 'next/image';
import SingleProject from '@/components/frontend/SingleProject';

const SinglePin = ({bgColor, textColor, text} : {bgColor: string, textColor: string, text: string}) => {
    return (
        <div className={`bg-${bgColor} text-${textColor} rounded-lg p-1`}>
            <p className="text-center">{text}</p>
        </div>
    );
}


export default async function ({ params }: { params: { projectSlug: string } }) {

    let project = await ProjectService.getProjectBySlug(params.projectSlug);

    if (!project) {
        notFound();
    }


    const meta: Metadata = {
        title: project.title + " | kuray.dev",
        description: project.description ? project.description : project.content.substring(0, 160),
        openGraph: {
            title: project.title + " | kuray.dev",
            description: project.description ? project.description : project.content.substring(0, 160),
            type: 'article',
            url: 'https://kuray.dev/project/' + project.slug + '/',
            images: [
                project.image ? project.image : 'https://kuray.dev/images/logo.png',
            ],

        },
    };

    const readTime = Math.ceil(project.content.split(' ').length / 200);

    return (
        <>
            <section className="min-h-screen pt-32 pb-8 bg-base-100" id="project">
                    <div className="mx-auto px-4 lg:px-8 mb-8 flex justify-between md:flex-row flex-col h-full gap-2">
                        <div className="flex-none flex md:min-w-80">
                            <div className="md:w-80 h-full rounded-lg bg-base-300 md:shadow-lg md:drop-shadow-lg border border-base-200">
                                <Image src={project.image || ''} alt={project.title} width={400} height={400} 
                                layout='responsive'
                                className='rounded-t-lg object-cover' />
                                <div className="flex flex-col space-y-2 mt-4 p-4">
                                    <h1 className="text-xl font-bold">{project.title}</h1>
                                    <h2 className="text-sm"><span className="font-bold">Description:</span> {project.description}</h2>
                                    <h2 className="text-sm"><span className="font-bold">Technologies:</span> {project.technologies.join(', ')}</h2>
                                    <h3 className="text-sm"><span className="font-bold">Categories:</span> {project.platforms.join(', ')}</h3>
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
}

