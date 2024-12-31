'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/libs/axios';
import { Editor } from '@tinymce/tinymce-react';
import { toast } from 'react-toastify';
import CategorySelect from '@/components/backend/Selects/CategorySelect';
import UserSelect from '@/components/backend/Selects/UserSelect';
import ImageLoad from '@/components/common/ImageLoad';
import AIPrompt from '@/components/backend/AIPrompt';


const SinglePost = ({ params }: { params: { postId: string } }) => {

    const mandatoryFields = ['title', 'content', 'description', 'slug', 'authorId', 'categoryId'];
    const router = useRouter();
    const [mode, setMode] = useState(params.postId === 'create' ? 'create' : 'edit');
    const [loading, setLoading] = useState(true);

    // Model fields
    const [title, setTitle] = useState('');    
    const [image, setImage] = useState('');
    const [content, setContent] = useState('');
    const [description, setDescription] = useState('');
    const [slug, setSlug] = useState('');
    const [keywords, setKeywords] = useState<string[]>([]);
    const [authorId, setAuthorId] = useState<string>('');
    const [categoryId, setCategoryId] = useState<string>("");
    const [status, setStatus] = useState('DRAFT');
    const [createdAt, setCreatedAt] = useState(new Date());
    const [updatedAt, setUpdatedAt] = useState(new Date());
    const [views, setViews] = useState(0);

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
            postId: params.postId ? params.postId : null,
            title,
            content,
            description,
            slug,
            keywords: keywords,
            authorId: authorId,
            categoryId: categoryId,
            status,
            createdAt,
            updatedAt,
            views,
        };

        if (mode === 'create') {
            await axiosInstance.post('/api/posts', body).then(() => {
                toast.success('Post created successfully');
                router.push('/backend/posts');
            }).catch((error) => {
                toast.error(error.response.data.message);
            });
        } else {
            await axiosInstance.put('/api/posts/', body).then(() => {
                toast.success('Post updated successfully');
                router.push('/backend/posts');
            }).catch((error) => {
                toast.error(error.response.data.message);
            });
        }
    };

    useEffect(() => {   
        if (params.postId) {
            axiosInstance.get(`/api/posts`).then((res) => {

                const { posts } = res.data;
                const post = posts.find((post: any) => post.postId === params.postId);

                if (!post) {
                    toast.error('Post not found');
                    setLoading(false);
                    return;
                }

                setTitle(post.title);
                setImage(post.image);
                setContent(post.content);
                setDescription(post.description);
                setSlug(post.slug);
                setKeywords(post.keywords);
                setAuthorId(post.authorId);
                setCategoryId(post.categoryId);
                setStatus(post.status);
                setCreatedAt(post.createdAt ? new Date(post.createdAt) : new Date());
                setLoading(false);
                setUpdatedAt(post.updatedAt ? new Date(post.updatedAt) : new Date());
                setViews(post.views);
            }).catch((error) => {
                console.error(error);
            });

            setLoading(false);
        }

    }, [params.postId]);


    
    return (
        <>
            <div className="container mx-auto">
                <div className="flex justify-between items-center flex-row">
                    <h1 className="text-3xl font-bold h-16 items-center">Create Post</h1>
                    <div className="flex gap-2 h-16">
                        <AIPrompt 
                            setTitle={setTitle}
                            setContent={setContent}
                            setDescription={setDescription}
                            setKeywords={setKeywords}
                            setSlug={setSlug}
                            setCreatedAt={setCreatedAt}
                            toast={toast}
                        />
                        <Link className="btn btn-primary btn-sm h-12" href="/backend/posts">
                            Back to Posts
                        </Link>
                    </div>
                </div>

                <div className="bg-base-200 p-6 rounded-lg shadow-md" onSubmit={handleSubmit}>
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
                            <span className="label-text">Category</span>
                        </label>
                        <CategorySelect
                        setSelectedCategoryId={setCategoryId}
                        selectedCategoryId={categoryId as string}
                           
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Created At</span>
                        </label>
                        <input
                            type="date"
                            placeholder="Created At"
                            className="input input-bordered"
                            value={createdAt.toISOString().split('T')[0]}
                            onChange={(e) => setCreatedAt(new Date(e.target.value))}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Updated At</span>
                        </label>
                        <input
                            type="date"
                            placeholder="Updated At"
                            className="input input-bordered"
                            value={updatedAt.toISOString().split('T')[0]}
                            onChange={(e) => setUpdatedAt(new Date(e.target.value))}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Views</span>
                        </label>
                        <input
                            type="number"
                            placeholder="Views"
                            className="input input-bordered"
                            value={views}
                            onChange={(e) => setViews(parseInt(e.target.value))}
                        />
                    </div>  

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Content</span>
                        </label>
                        <Editor
                            init={{
                                height: 500,
                                menubar: false,
                                plugins: [
                                    'advlist autolink lists link image charmap print preview anchor',
                                    'searchreplace visualblocks code fullscreen',
                                    'insertdatetime media table paste code help wordcount'
                                ],
                                toolbar:
                                    'undo redo | formatselect | bold italic backcolor | \
                                alignleft aligncenter alignright alignjustify | \
                                bullist numlist outdent indent | removeformat | help'
                            }}
                            apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                            value={content}
                            onEditorChange={(content) => setContent(content)}
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
                            <span className="label-text">Keywords</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Keywords"
                            className="input input-bordered"
                            value={keywords.join(',')}
                            onChange={(e) => setKeywords(e.target.value.split(','))}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Author</span>
                        </label>
                        <UserSelect
                            setSelectedUserId={setAuthorId}
                            selectedUserId={authorId as string}
                        />                        
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
                    <button type="submit" className="btn btn-primary block w-full mt-4" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Loading...' : mode === 'create' ? 'Create Post' : 'Update Post'}
                    </button>
                </div>
            </div>
        </>
    );
}

export default SinglePost;