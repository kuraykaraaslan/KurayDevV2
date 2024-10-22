'use client';
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/libs/axios';
import { Editor } from '@tinymce/tinymce-react';
import { User } from '@prisma/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

import { toast } from 'react-toastify';


const CreatePost = () => {

    const [title, setTitle] = useState('Default Title');
    const [content, setContent] = useState('<p>Default Content</p>');
    const [description, setDescription] = useState('Default Description');
    const [slug, setSlug] = useState('default-slug');
    const [keywordsString, setKeywordsString] = useState('default,keywords');
    const [imageUrl, setImageUrl] = useState<String | null>(null);
    const [authorId, setAuthorId] = useState<String | null>(null);

    const [users, setUsers] = useState<Partial<User>[]>([]);

    const [aiContent, setAiContent] = useState('');


    const router = useRouter();


    useEffect(() => {
        axiosInstance.get('/api/users')
            .then((response) => {
                setUsers(response.data.users);

                if (authorId === '' && users.length > 0) {
                    setAuthorId(users[0].id as string || 'Unknown');
                }

            })
            .catch((error) => {
                toast.error(error.message);
            });

        //if authorId is not set, set it to the first user
    }, []);

    useEffect(() => {
        setSlug(title.toLowerCase().replace(/ /g, '-'));
    }, [title]);


    useEffect(() => {

    }
        , [imageUrl]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const neededFields = [title, content, description, slug, keywordsString, authorId];

        const blogPost = {
            title,
            content,
            description,
            slug,
            keywords: keywordsString.split(','),
            authorId,
        };

        console.log(blogPost);

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

        if (keywordsString === '') {
            toast.error('Keywords are required');
            return;
        }

        if (authorId === '' && users.length > 0) {
            const firstUser = users[0];
            if (firstUser) {
                setAuthorId(firstUser.id as string);
            }
        } else if (authorId === '') {
            toast.error('Author is required');
            return;
        }

        
        await axiosInstance.post('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                title,
                content,
                description,
                slug,
                keywords: keywordsString.split(','),
                imageUrl,
                authorId : authorId ? authorId : users[0].id,
            },
        }).then(() => {
            toast.success('Post created successfully');
           // router.push('/backend/posts');
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

    return (
        <>
            <dialog id="my_modal_4" className="modal">
                <div className="modal-box w-11/12 max-w-5xl">
                    <h3 className="font-bold text-lg">OpenAI GPT-4 Post Generator</h3>
                    <div className="modal-body w-full">
                        <textarea className="textarea h-64 w-full" value={aiContent} onChange={(e) => setAiContent(e.target.value)}></textarea>
                        <button className="btn btn-primary mt-2">Generate Post</button>
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
                    <h1 className="text-3xl font-bold h-16 items-center">Create Post</h1>
                    <div className="flex gap-2 h-16">
                        <button className="btn btn-warning btn-sm h-12" onClick={showModal}>
                            <FontAwesomeIcon icon={faRobot} className="mr-2" /> OpenAI GPT-4
                        </button>
                        <Link className="btn btn-primary btn-sm h-12" href="/backend/posts">
                            Back to Posts
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
                            value={keywordsString}
                            onChange={(e) => setKeywordsString(e.target.value)}
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
                                <option key={user.id} value={user.id} selected={authorId ? authorId === user.id : index === 0}>
                                    {user.name}
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
                        <input
                            type="text"
                            placeholder="Image URL"
                            className="input input-bordered mt-2"
                            value={imageUrl as string}
                            onChange={(e) => setImageUrl(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary block w-full mt-4">Create Post</button>
                </form>
            </div>
        </>
    );
}

export default CreatePost;