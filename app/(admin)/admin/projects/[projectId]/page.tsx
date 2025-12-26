'use client';
import { useState, useEffect, FormEvent, } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/libs/axios';
import { toast } from 'react-toastify';
import ImageLoad from '@/components/common/UI/Images/ImageLoad';
import TinyMCEEditor from '@/components/admin/UI/Forms/Editor';
import { TableBody, TableFooter, TableHeader, TableProvider } from '@/components/admin/UI/Forms/DynamicTable';

const SingleProject = () => {

    const localStorageKey = 'projectCaches';

    const params = useParams();

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

    // Auto Save to Local Storage
    useEffect(() => {
        if (loading) return;

        const draft = {
            title,
            content,
            description,
            slug,
            platforms,
            technologies,
            status,
            image,
            projectLinks,
        };

        const caches = localStorage.getItem(localStorageKey);
        let parsedCaches: Record<string, typeof draft> = {};

        try {
            parsedCaches = caches ? (JSON.parse(caches) as Record<string, typeof draft>) : {};
        } catch (err) {
            console.error("Cache parse error", err);
        }

        parsedCaches[params.projectId as string] = draft;

        localStorage.setItem(localStorageKey, JSON.stringify(parsedCaches));
    }, [
        title,
        content,
        description,
        slug,
        platforms,
        technologies,
        status,
        image,
        projectLinks,
        loading
    ]);


    // Load Draft from Local Storage
    useEffect(() => {
        const caches = localStorage.getItem(localStorageKey);
        if (!caches) return;

        try {
            const parsed = JSON.parse(caches);
            const draft = parsed[params.projectId as string];
            if (!draft) return;

            setTitle(draft.title || "");
            setContent(draft.content || "");
            setDescription(draft.description || "");
            setSlug(draft.slug || "");
            setPlatforms(draft.platforms || []);
            setTechnologies(draft.technologies || []);
            setStatus(draft.status || "DRAFT");
            setImage(draft.image || "");
            setProjectLinks(draft.projectLinks || []);

            toast.info("Draft loaded from browser");
        } catch (err) {
            console.error("Failed to load draft", err);
        }
    }, []);

    // Auto Slugify
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const errors: string[] = [];

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
            projectId: params.projectId === 'create' ? undefined : params.projectId,
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

        if (mode === 'create') {
            await axiosInstance.post('/api/projects', body).then((response) => {
                const { project } = response.data;
                toast.success('Project created successfully');
                router.push('/admin/projects/' + project.projectId);
            }).catch((error) => {
                toast.error(error.response.data.message);
            });
        } else {
            await axiosInstance.put('/api/projects/', body).then(() => {
                toast.success('Project updated successfully');
                router.push('/admin/projects');
            }).catch((error) => {
                toast.error(error.response.data.message);
            });
        }


    };

    // Load Project Data if in Edit Mode
    useEffect(() => {
        if (params.projectId === 'create') {
            setMode('create');
            setLoading(false);
        } else {
            setMode('edit');

            axiosInstance.get(`/api/projects`, {
                params: { projectId: params.projectId }
            }).then((res) => {
                const { projects } = res.data;
                const project = projects[0];

                setTitle(project.title);
                setContent(project.content);
                setDescription(project.description);
                setSlug(project.slug);
                setPlatforms(project.platforms);
                setTechnologies(project.technologies);
                setStatus(project.status);
                setImage(project.image);
                setProjectLinks(project.projectLinks);

                setLoading(false); // ✔️ API bittikten sonra
            }).catch((error) => {
                console.error(error);
                setLoading(false);
            });
        }
    }, [params.projectId]);


    return (
        <>
            <div className="container mx-auto">
                <div className="flex justify-between items-center flex-row">
                    <h1 className="text-3xl font-bold h-16 items-center">{mode === 'create' ? 'Create Project' : title}</h1>
                    <div className="flex gap-2 h-16">
                        <Link className="btn btn-primary btn-sm h-12" href="/admin/projects">
                            Back to Projects
                        </Link>
                    </div>
                </div>

                <div className="bg-base-200 p-6 rounded-lg shadow-md mt-4 gap-4 flex flex-col">
                    <div className="form-control flex flex-col">
                        <label className="label">
                            <span className="label-text">Title</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Title"
                            className="input input-bordered w-full"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="form-control flex flex-col">
                        <label className="label">
                            <span className="label-text">Status</span>
                        </label>
                        <select
                            className="select select-bordered w-full"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </div>

                    <div className="form-control flex flex-col">
                        <label className="label">
                            <span className="label-text">Content</span>
                        </label>
                        <TinyMCEEditor
                            value={content}
                            onChange={setContent}
                        />
                    </div>

                    <div className="form-control flex flex-col">
                        <label className="label">
                            <span className="label-text">Description</span>
                        </label>
                        <textarea
                            placeholder="Description"
                            className="textarea textarea-bordered w-full"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="form-control flex flex-col">
                        <label className="label">
                            <span className="label-text">Slug</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Slug"
                            className="input input-bordered w-full"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                        />
                    </div>

                    <div className="form-control flex flex-col">
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
                    <div className="form-control flex flex-col">
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

                    <TableProvider<{ id: number; link: string }>
                        localData={projectLinks.map((link, i) => ({ id: i, link }))}
                        idKey="id"
                        columns={[
                            {
                                key: 'link',
                                header: 'Link',
                                accessor: (item) => (
                                    <input
                                        type="text"
                                        placeholder="Project Link"
                                        className="input input-bordered w-full"
                                        value={item.link}
                                        onChange={(e) => {
                                            const newLinks = [...projectLinks];
                                            newLinks[item.id] = e.target.value;
                                            setProjectLinks(newLinks);
                                        }}
                                    />
                                ),
                            },
                        ]}
                        actions={[
                            {
                                label: 'Delete',
                                onClick: (item) => {
                                    const newLinks = projectLinks.filter((_, i) => i !== item.id);
                                    setProjectLinks(newLinks);
                                },
                                className: 'btn-error',
                                hideOnMobile: true,
                            },
                        ]}
                    >
                        <TableHeader
                            className='p-2 -mb-8 rounded-t-lg'
                            title="Project Links"
                            actionButtonText='Add Link'
                            actionButtonEvent={() => setProjectLinks([...projectLinks, ''])}
                            titleTextClassName="text-sm font-normal"
                            searchClassName="hidden"
                        />
                        <TableBody
                            emptyText="No links added yet."
                        />
                    </TableProvider>

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
                    {loading ? 'Loading...' : mode === 'create' ? 'Create Project' : 'Update Project'}
                </button>
            </div>
        </>
    );
}

export default SingleProject;