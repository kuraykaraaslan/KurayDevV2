'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/types/content/ProjectTypes';
import axiosInstance from '@/libs/axios';
import SingleProject from '@/components/frontend/Features/Hero/Projects/Partials/SingleProject';

const PAGE_SIZE = 9;

const PLATFORM_FILTERS = [
    'ui/ux',
    'web',
    'mobile',
    'desktop',
    'embedded',
    'other',
    'iot',
    'gaming',
    'machine learning',
];

export default function ProjectsFeed() {
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [filter, setFilter] = useState('');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axiosInstance
            .get('/api/projects?page=0&pageSize=100&sort=desc&onlyPublished=true')
            .then((res) => setAllProjects(res.data.projects))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleFilter = (value: string) => {
        setFilter(value);
        setVisibleCount(PAGE_SIZE);
    };

    const filtered = filter
        ? allProjects.filter((p) => p.platforms.includes(filter))
        : allProjects;

    const visible = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;

    return (
        <section className="min-h-screen bg-base-100 pt-32" id="projects">
            <div className="px-4 mx-auto max-w-screen-xl lg:pb-16 lg:px-6">

                {/* Header */}
                <div className="mx-auto max-w-screen-sm text-center lg:mb-8 -mt-8 lg:mt-0">
                    <h1 className="mb-4 text-3xl lg:text-4xl tracking-tight font-extrabold">
                        My Projects
                    </h1>
                    <p className="font-light sm:text-xl">
                        Explore my portfolio of web, mobile, desktop, and other software projects.
                    </p>
                </div>

                {/* Platform filters */}
                <div className="flex flex-wrap justify-center gap-2 mb-8 mt-6">
                    <button
                        className={`btn btn-primary btn-sm ${filter === '' ? 'btn-active' : ''}`}
                        onClick={() => handleFilter('')}
                    >
                        All
                    </button>
                    {PLATFORM_FILTERS.map((tag) => (
                        <button
                            key={tag}
                            className={`btn btn-primary btn-sm ${filter === tag ? 'btn-active' : ''}`}
                            onClick={() => handleFilter(tag)}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <span className="loading loading-spinner loading-lg" />
                    </div>
                ) : visible.length === 0 ? (
                    <div className="flex justify-center items-center h-48 text-base-content/50">
                        No projects found.
                    </div>
                ) : (
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                        {visible.map((project) => (
                            <SingleProject key={project.projectId} project={project} />
                        ))}
                    </div>
                )}

                {/* Load More */}
                {hasMore && (
                    <div className="flex justify-center mt-10 mb-6">
                        <button
                            className="btn btn-primary"
                            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                        >
                            Load More
                        </button>
                    </div>
                )}

                {!loading && !hasMore && visible.length > 0 && (
                    <div className="flex justify-center mt-10 mb-6 text-base-content/40 text-sm">
                        All {filter ? `${filter} ` : ''}projects loaded
                    </div>
                )}

            </div>
        </section>
    );
}
