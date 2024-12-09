'use client';
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/libs/axios';
import { toast } from 'react-toastify';
import Image from 'next/image';


const EditCategory = ({ params }: { params: { categoryId: string } }) => {

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [slug, setSlug] = useState('');
    const [keywords, setKeywords] = useState<string[]>([]);


    const [imageUrl, setImageUrl] = useState<String | null>(null);

    //image upload
    const [imageFile, setImageFile] = useState<File | null>(null);

    const router = useRouter();

    const uploadImage = async () => {
        if (!imageFile) {
            return;
        }

        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('folder', 'categories');

        await axiosInstance.post('/api/aws', formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        ).then((res) => {
            setImageUrl(res.data.url);
        }).catch((error) => {
            console.error(error);
        });
    }

    const uploadFromUrl = async (url: string) => {
        await axiosInstance.post('/api/aws/from-url', {
            url,
            folder: 'categories'
        }
        ).then((res) => {
            setImageUrl(res.data.url);
            toast.success('Image uploaded successfully');
        }).catch((error) => {
            console.error(error);
        });
    }

    const generateImage = async () => {
        const response = await axiosInstance.post('/api/ai/dall-e', {
            prompt: 'create a category image for title ' + title + ' and description ' + description + ' and keywords ' + keywords.join(','),
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

    useEffect(() => {
        const fetchCategory = async () => {
            await axiosInstance.get(`/api/categories/${params.categoryId}`).then((res) => {
                const { category } = res.data;
                setTitle(category.title);
                setDescription(category.description);
                setSlug(category.slug);
                setKeywords(category.keywords);
                setImageUrl(category.image);
            }).catch((error) => {
                console.error(error);
            });
        }

        fetchCategory();
    }, []);

    useEffect(() => {
        setSlug(title.toLowerCase().replace(/ /g, '-'));
    }, [title]);


    useEffect(() => {

    }
        , [imageUrl]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const neededFields = [title, description, slug, keywords];

        const blogCategory = {
            title,
            description,
            slug,
            keywords: keywords,
            image: imageUrl,
        };

        if (title === '') {
            toast.error('Title is required');
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

        await axiosInstance.put('/api/categories/' + params.categoryId, blogCategory).then(() => {
            toast.success('Category updated successfully');
            router.push('/backend/categories/' + params.categoryId);
        }).catch((error) => {
            console.error(error);
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
            <div className="container mx-auto">
                <div className="flex justify-between items-center flex-row">
                    <h1 className="text-3xl font-bold h-16 items-center">Create Category</h1>
                    <div className="flex gap-2 h-16">
                        <Link className="btn btn-primary btn-sm h-12" href="/backend/categories">
                            Back to Categories
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
                    <div className="form-control mb-4 mt-4">
                        <label className="label">
                            <span className="label-text">Image</span>
                        </label>
                        <Image src={imageUrl ? imageUrl as string : '/assets/img/og.png'}
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
                    <button type="submit" className="btn btn-primary block w-full mt-4">Update Category</button>
                </form>
            </div>
        </>
    );
}

export default EditCategory;