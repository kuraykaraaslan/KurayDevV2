'use client';
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/libs/axios';
import { Editor } from '@tinymce/tinymce-react';
import { Category, User } from '@prisma/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

import { toast } from 'react-toastify';


const UpdateUser =({ params }: { params: { userId: string } }) => {

    const [title, setTitle] = useState('Default Title');
    const [content, setContent] = useState('<p>Default Content</p>');
    const [description, setDescription] = useState('Default Description');
    const [slug, setSlug] = useState('default-slug');
    const [keywords, setKeywords] = useState<string[]>([]);
    const [authorId, setAuthorId] = useState<String | null>(null);
    const [categoryId, setCategoryId] = useState<String | null>(null);

    const [users, setUsers] = useState<Partial<User>[]>([]);
    const [categories, setCategories] = useState<Partial<Category>[]>([]);

    const [aiContent, setAiContent] = useState('');

    const [imageUrl, setImageUrl] = useState<String | null>(null);
    //image upLoad
    const [imageFile, setImageFile] = useState<File | null>(null);
    const router = useRouter();

    const [status, setStatus] = useState('DRAFT');
    const [createdAt, setCreatedAt] = useState(new Date());

    useEffect(() => {
        axiosInstance.get('/api/users?pageSize=100')
            .then((response) => {
                setUsers(response.data.users);

                if (authorId === null && users.length > 0) {
                    setAuthorId(users[0].userId as string || 'Unknown');
                }

            })
            .catch((error) => {
                toast.error(error.message);
            });

        //if authorId is not set, set it to the first user
    }, []);


    useEffect(() => {
        const invalidChars = /[^\w\s-]/g;
        const slugifiedTitle = title.toLowerCase().replace(invalidChars, '').replace(/\s+/g, '-');
        setSlug(slugifiedTitle);
    }, [title]);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const neededFields = [title, content, description, slug, keywords, authorId, categoryId];

        const blogUser = {
            title,
            content,
            description,
            slug,
            keywords: keywords,
            authorId,
            categoryId,
            image: imageUrl,
            status,
            createdAt,
        };

        if (title === '') {
            toast.error('Title is required');
            return;
        }


        if (content === '') {
            toast.error('Content is required');
            return;
        }

        if (description === '') {
            toast.error('Description is required');
            return;
        }

        if (slug === '') {
            toast.error('Slug is required');
            return;
        }

        if (keywords.length === 0) {
            toast.error('Keywords are required');
            return;
        }

        if (authorId === null && users.length > 0) {
            const firstUser = users[0];
            if (firstUser) {
                setAuthorId(firstUser.userId as string);
            }
        } else if (authorId === null) {
            toast.error('Author is required');
            return;
        }

        if (categoryId === null && categories.length > 0) {
            const firstCategory = categories[0];
            if (firstCategory) {
                setCategoryId(firstCategory.categoryId as string);
            }
        } else if (categoryId === null) {
            toast.error('Category is required');
            return;
        }


        await axiosInstance.put('/api/users/' + params.userId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                title,
                content,
                description,
                slug,
                keywords: keywords,
                image: imageUrl,
                authorId: authorId ? authorId : users[0].userId,
                categoryId: categoryId ? categoryId : categories[0].categoryId,
                status,
                createdAt,
            },

        }).then(() => {
            toast.success('User created successfully');
            // router.push('/backend/users');
        }).catch((error) => {
            toast.error(error.response.data.message);
        });

    };

    const showModal = () => {
        if (!document) {
            return;
        }

        const modal = document.getElementById('my_modal_4');

        if (modal) {
            //@ts-ignore
            modal?.showModal();
        }

    }


    const uploadImage = async () => {
        if (!imageFile) {
            return;
        }

        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('folder', 'users');

        await axiosInstance.post('/api/aws', formData).then((res) => {
            setImageUrl(res.data.url);
        }).catch((error) => {
            console.error(error);
        });
    }

    const uploadFromUrl = async (url: string) => {
        await axiosInstance.post('/api/aws/from-url', {
            url,
            folder: 'users',
        }).then((res) => {
            setImageUrl(res.data.url);
            toast.success('Image uploaded successfully');
        }).catch((error) => {
            console.error(error);
        });
    }

    const generateImage = async () => {
        const response = await axiosInstance.post('/api/ai/dall-e', {
            prompt: 'create a user image for title ' + title + ' and description ' + description + ' and keywords ' + keywords.join(',') + ' and content ' + content,
        }).then((res) => {
            toast.success('Image generated successfully,');
            setImageUrl(res.data.url);
            return res;
        }).then((res) => {
            toast.success('Now uploading image to S3');
            uploadFromUrl(res.data.url);
        }).
            catch((error) => {
                console.error(error);
            });
    }

    //multi line string
    const generateUserString = `
    create a user for this prompt: \n

    ${aiContent}

    format: {
        title: xxx,
        description: xxx,
        keywords: xxx, 
        content: xxx //wysiwyg content
    }

    `;

    const generateUser = async () => {
        const response = await axiosInstance.post('/api/ai/gpt-4o', {
            prompt: generateUserString,
        }).then((res) => {
            try {
                const text = res.data.text;
                setTitle(text.title);
                setContent(text.content);
                setDescription(text.description);

                if (text.keywords) {
                    //check if it is a string or an array
                    if (typeof text.keywords === 'string') {
                        setKeywords(text.keywords.split(','));
                    } else {
                        setKeywords(text.keywords);
                    }
                }

      
            } catch (error) {
                console.error(error);
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    useEffect(() => {

        if (params.userId) {
            axiosInstance.get(`/api/users/${params.userId}`).then((res) => {
                const { user } = res.data;
                setTitle(user.title);
                setContent(user.content);
                setDescription(user.description);
                setSlug(user.slug);
                setKeywords(user.keywords);
                setImageUrl(user.image);
                setAuthorId(user.authorId);
                setCategoryId(user.categoryId);
            }).catch((error) => {
                console.error(error);
            });
        }
    }
        , []);

    return (
        <>
            <dialog id="my_modal_4" className="modal">
                <div className="modal-box w-11/12 max-w-5xl">
                    <h3 className="font-bold text-lg">OpenAI GPT-4 User Generator</h3>
                    <div className="modal-body w-full">
                        <textarea className="textarea h-64 w-full mt-4" value={aiContent} onChange={(e) => setAiContent(e.target.value)}></textarea>
                        <button className="btn btn-primary mt-2" onClick={generateUser}>Generate User</button>
                    </div>
                    <div className="modal-action">
                        <form method="dialog">
                            {/* if there is a button, it will close the modal */}
                            <button className="btn">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>
            <div className="container mx-auto">
                <div className="flex justify-between items-center flex-row">
                    <h1 className="text-3xl font-bold h-16 items-center">Create User</h1>
                    <div className="flex gap-2 h-16">
                        <button className="btn btn-warning btn-sm h-12" onClick={showModal}>
                            <FontAwesomeIcon icon={faRobot} className="mr-2 w-6 h-6" /> OpenAI GPT-4
                        </button>
                        <Link className="btn btn-primary btn-sm h-12" href="/backend/users">
                            Back to Users
                        </Link>
                    </div>
                </div>

                <form className="bg-base-200 p-6 rounded-lg shadow-md" onSubmit={handleSubmit}>
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
                        <select
                            className="select select-bordered"
                            value={categoryId as string}
                            onChange={(e) => setCategoryId(e.target.value)}
                        >
                            {categories.map((category, index) => (
                                <option key={category.categoryId} value={category.categoryId} selected={categoryId ? categoryId === category.categoryId : index === 0}>
                                    {category.title}
                                </option>
                            ))}
                        </select>
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
                            <span className="label-text">Author</span>
                        </label>
                        <select
                            className="select select-bordered"
                            value={authorId as string}
                            onChange={(e) => setAuthorId(e.target.value)}
                        >
                            {users.map((user, index) => (
                                <option key={user.userId} value={user.userId} selected={authorId ? authorId === user.userId : index === 0}>
                                    {user.name ? user.name : 'Unknown'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-control mb-4 mt-4">
                        <label className="label">
                            <span className="label-text">Image</span>
                        </label>
                        <img src={imageUrl ? imageUrl as string : '/assets/img/og.png'}
                            alt="Image" className="h-64 w-96 object-cover rounded-lg" />
                        <div className="relative flex justify-between items-center">
                            <input
                                type="file"
                                placeholder="Image URL"
                                className="input input-bordered mt-2 p-4 flex-1 h-16"
                                //only images
                                accept="image/*"

                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setImageFile(file);
                                        //setImageUrl(URL.createObjectURL(file));
                                    }
                                }}
                            />
                            <div className="absolute right-2 top-2 text-black p-2 rounded-lg">
                                <button type="button" className="h-12 text-black p-2 rounded-lg bg-primary mr-2" onClick={uploadImage}>
                                    Upload Image
                                </button>
                                <button type="button" className="h-12 text-black p-2 rounded-lg bg-secondary" onClick={generateImage}>
                                    Generate Image
                                </button>
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary block w-full mt-4">Update User</button>
                </form>
            </div>
        </>
    );
}

export default UpdateUser;