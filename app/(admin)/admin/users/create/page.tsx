'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import axiosInstance from '@/libs/axios';
import { Editor } from '@tinymce/tinymce-react';
import { toast } from 'react-toastify';
import Image from 'next/image';


const CreateUser = () => {

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('USER');
    const [slug, setSlug] = useState('');
    const [image, _setImage] = useState('');
    const [bio, setBio] = useState('');

    const [imageUrl, setImageUrl] = useState<string | null>(null);
    //image upLoad
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();


        const user = {
            name,
            email,
            password,
            phone,
            role,
            slug,
            image,
            bio,
        };

        if (name === '') {
            toast.error('Name is required');
            return;
        }


        if (email === '') {
            toast.error('Email is required');
            return;
        }

        if (password === '') {
            toast.error('Password is required');
            return;
        }

        if (phone === '') {
            toast.error('Phone is required');
            return;
        }


        if (role === '') {
            toast.error('Role is required');
            return;
        }

        if (slug === '') {
            toast.error('Slug is required');
            return;
        }


        await axiosInstance.post('/api/users', { user }).then(() => {
            toast.success('User created successfully');
            // router.push('/admin/posts');
        }).catch((error) => {
            toast.error(error.response.data.message);
        });

    };


    const uploadImage = async () => {
        if (!imageFile) {
            return;
        }

        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('folder', 'categories');

        await axiosInstance.post('/api/aws', formData).then((res) => {
            setImageUrl(res.data.url);
        }).catch((error) => {
            console.error(error);
        });
    }

    return (
        <>
            <div className="container mx-auto">
                <div className="flex justify-between items-center flex-row">
                    <h1 className="text-3xl font-bold h-16 items-center">Create User</h1>
                    <div className="flex gap-2 h-16">
                        <Link className="btn btn-primary btn-sm h-12" href="/admin/users">
                            Back to Users
                        </Link>
                    </div>
                </div>

                <form className="bg-base-200 p-6 rounded-lg shadow-md" onSubmit={handleSubmit}>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Name</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Name"
                            className="input input-bordered"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Email</span>
                        </label>
                        <input
                            type="email"
                            placeholder="Email"
                            className="input input-bordered"
                            value={email}
                            autoComplete="off"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Password</span>
                        </label>
                        <input
                            type="password"
                            placeholder="Password"
                            className="input input-bordered"
                            value={password}
                            autoComplete="new-password"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Phone</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Phone"
                            className="input input-bordered"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Role</span>
                        </label>
                        <select
                            className="select select-bordered"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                        </select>
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
                            <span className="label-text">Bio</span>
                        </label>
                        <Editor
                            init={{
                                height: 500,
                                menubar: false,
                                plugins: [
                                    'advlist autolink lists link image charmap print preview anchor image',
                                    'searchreplace visualblocks code fullscreen',
                                    'insertdatetime media table paste code help wordcount'
                                ],
                                toolbar:
                                    'undo redo | image | formatselect | bold italic backcolor | \
                                alignleft aligncenter alignright alignjustify | \
                                bullist numlist outdent indent | removeformat | help',
                            }}
                            apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                            value={bio}
                            onEditorChange={(content) => setBio(content)}
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

                    <div className="form-control mb-4 mt-4">
                        <label className="label">
                            <span className="label-text">Image</span>
                        </label>
                        <Image src={imageUrl ? imageUrl as string : '/assets/img/og.png'}

                            width={384} height={256}
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
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary block w-full mt-4">Create Post</button>
                </form>
            </div>
        </>
    );
}

export default CreateUser;