'use client';
import React, { useState, useEffect, use, createRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/libs/axios';
import { Editor } from '@tinymce/tinymce-react';
import { Category, Project, User } from '@prisma/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

import { toast } from 'react-toastify';
import { response } from 'express';
import ImageLoad from '@/components/common/ImageLoad';
import TinyMCEEditor from '@/components/backend/Editor';

import ProjectLinkTable from '@/components/backend/Tables/ProjectLinkTable';


const SingleProject = ({ params }: { params: { projectId: string } }) => {

    const mandatoryFields = ['title', 'content', 'description', 'slug', 'platforms'];
    const router = useRouter();
    const [mode, setMode] = useState(params.projectId === 'create' ? 'create' : 'edit');
    const [loading, setLoading] = useState(true);


    // Model fields
    const [title, setTitle] = useState('');
    const [image, setImage] = useState('');
    const [content, setContent] = useState('');
    const [description, setDescription] = useState('');
    const [slug, setSlug] = useState('');
    const [platforms, setPlatforms] = useState<string[]>([]);
    const [technologies, setTechnologies] = useState<string[]>([]);
    const [status, setStatus] = useState('PUBLISHED');
    const [projectLinks, setProjectLinks] = useState<string[]>([]);

    // Platform fields
    const allowedPlatforms = [
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

    // Technologies fields
    const allowedTechnologies = [
        'react',
        'react native',
        'express',
        'next',
        'java',
        'python',
        'c',
        'c++',
        'c#',
        'aws',
        'azure',
        'gcp',
        'chrome extension',
        'other'
    ];


    useEffect(() => {
        //if we are in edit mode and never update slug again
        if (mode === 'edit' || loading) {
            return;
        }

        if (title) {
            // Remove all non-english characters
            const invalidChars = /[^\w\s-]/g;
            // Remove all non-english characters
            let slugifiedTitle = title.replace(invalidChars, '');
            // Replace all spaces with hyphens
            slugifiedTitle = slugifiedTitle.replace(/\s+/g, '-');
            // Remove all double hyphens
            slugifiedTitle = slugifiedTitle.replace(/--+/g, '-');
            // Convert to lowercase
            slugifiedTitle = slugifiedTitle.toLowerCase();

            setSlug(slugifiedTitle);
        }
    }, [title]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        var errors: string[] = [];

        mandatoryFields.forEach((fieldName) => {
            // integer or string
            const fieldValue = eval(fieldName);
            const fieldType = typeof fieldValue;

            switch (fieldType) {
                case 'string':
                    if (!fieldValue || fieldValue === '') {
                        toast.error(`${fieldName} is required`);
                        return;
                    }
                    break;
                case 'object':
                    if (!fieldValue.length || fieldValue.length === 0) {
                        toast.error(`${fieldName} is required`);
                        return;
                    }
                    break;
                default:
                    break;
            }
        });


        if (errors.length > 0) {
            errors.forEach((error) => {
                toast.error(error);
            });
            return;
        }


        const body = {
            title,
            content,
            description,
            slug,
            platforms,
            technologies,
            status,
            image,
            projectLinks
        };

        return;

        if (mode === 'create') {
            await axiosInstance.post('/api/projects', body).then((response) => {
                const { project } = response.data;
                toast.success('Project created successfully');
                router.push('/backend/projects/' + project.projectId);
            }).catch((error) => {
                toast.error(error.response.data.message);
            });
        } else {
            await axiosInstance.put('/api/projects/' + params.projectId, body).then(() => {
                toast.success('Project updated successfully');
                router.push('/backend/projects');
            }).catch((error) => {
                toast.error(error.response.data.message);
            });
        }


    };

    useEffect(() => {
        if (params.projectId === 'create') {
            setMode('create');
        } else {
            setMode('edit');

            axiosInstance.get(`/api/projects/${params.projectId}`).then((res) => {
                const { project } = res.data;
                setTitle(project.title);
                setContent(project.content);
                setDescription(project.description);
                setSlug(project.slug);
                setPlatforms(project.platforms);
                setTechnologies(project.technologies);
                setStatus(project.status);
                setImage(project.image);
                setProjectLinks(project.projectLinks);
            }).catch((error) => {
                console.error(error);
            });

            setLoading(false);
        }

    }, [params.projectId]);

    return (
        <>
            <div className="container mx-auto">
                <div className="flex justify-between items-center flex-row">
                    <h1 className="text-3xl font-bold h-16 items-center">{mode === 'create' ? 'Create Project' : title}</h1>
                    <div className="flex gap-2 h-16">
                        <Link className="btn btn-primary btn-sm h-12" href="/backend/projects">
                            Back to Projects
                        </Link>
                    </div>
                </div>

                <div className="bg-base-200 p-6 rounded-lg shadow-md mb-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Title</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Title"
                            className="input input-bordered"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Status</span>
                        </label>
                        <select
                            className="select select-bordered"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Content</span>
                        </label>
                        <TinyMCEEditor
                            value={content}
                            onChange={setContent}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Description</span>
                        </label>
                        <textarea
                            placeholder="Description"
                            className="textarea textarea-bordered"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Slug</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Slug"
                            className="input input-bordered"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Platforms</span>
                        </label>
                        <div className="flex flex-wrap gap-2">

                            {allowedPlatforms.map((platform) => (
                                <div key={platform} className="bg-base-100 p-2 rounded-lg">
                                    <input
                                        type='checkbox'
                                        className='mr-2'
                                        value={platform}
                                        checked={platforms.includes(platform)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setPlatforms([...platforms, platform]);
                                            } else {
                                                setPlatforms(platforms.filter(p => p !== platform));
                                            }
                                        }}
                                    />
                                    <span className='mt-2'>{platform}</span>
                                </div>
                            ))}

                        </div>
                    </div>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Technologies</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {allowedTechnologies.map((technology) => (
                                <div key={technology} className="bg-base-100 p-2 rounded-lg">
                                    <input
                                        type='checkbox'
                                        className='mr-2'
                                        value={technology}
                                        checked={technologies.includes(technology)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setTechnologies([...technologies, technology]);
                                            } else {
                                                setTechnologies(technologies.filter(t => t !== technology));
                                            }
                                        }}
                                    />
                                    <span className='mt-2'>{technology}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-control mb-4 mt-4">
                        <label className="label">
                            <span className="label-text">Links</span>
                            <button className="btn btn-sm btn-primary" onClick={() => setProjectLinks([...projectLinks, ''])}>
                                Add Link
                            </button>
                        </label>
                        <ProjectLinkTable projectLinks={projectLinks} setProjectLinks={setProjectLinks} />
                    </div>

                    <div className="form-control mb-4 mt-4">
                        <label className="label">
                            <span className="label-text">Image</span>
                        </label>
                        <ImageLoad
                            image={image}
                            setImage={setImage}
                            uploadFolder='projects'
                            toast={toast}
                        />
                    </div>
                </div>
                <button type="submit" className="btn btn-primary block w-full mt-4" onClick={handleSubmit} disabled={loading}>
                    { loading ? 'Loading...' : mode === 'create' ? 'Create Project' : 'Update Project'}
                </button>
            </div>
        </>
    );
}

export default SingleProject;