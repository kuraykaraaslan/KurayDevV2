'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/libs/axios';
import { toast } from 'react-toastify';


const UpdateUser = () => {

    const params = useParams();


    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('USER');

    const [imageUrl, setImageUrl] = useState<String | null>(null);

    const router = useRouter();

    const uploadImage = async () => {
        const input = document.getElementById('file') as HTMLInputElement;
        const files = input.files;

        if (!files) {
            return;
        }

        const imageFile = files[0];

        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('folder', 'users');

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (name === '') {
            toast.error('Name is required');
            return;
        }

        if (email === '') {
            toast.error('Email is required');
            return;
        }


        if (role === '') {
            toast.error('Role is required');
            return;
        }

        await axiosInstance.put('/api/users/' + params.userId, {
            name,
            email,
            role,
            image: imageUrl,
        }).then(() => {
            toast.success('User updated successfully');
            router.push('/admin/users');
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


    useEffect(() => {

        if (params.userId) {
            axiosInstance.get(`/api/users/${params.userId}`).then((res) => {
                const { user } = res.data;
                setName(user.name);
                setEmail(user.email);
                setRole(user.role);
                setImageUrl(user.image);
            }).catch((error) => {
                console.error(error);
            });
        }
    }, []);

    return (
        <>
            <div className="container mx-auto">
                <div className="flex justify-between items-center flex-row">
                    <h1 className="text-3xl font-bold h-16 items-center">Update User</h1>
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
                            onChange={(e) => setEmail(e.target.value)}
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

                    <div className="form-control mb-4 mt-4">
                        <label className="label">
                            <span className="label-text">Image</span>
                        </label>
                        <img src={imageUrl ? imageUrl as string : '/assets/img/og.png'}

                            width={400} height={400}
                            alt="Image" className="h-96 w-96 object-cover rounded-lg" />
                        <div className="relative flex justify-between items-center">
                            <input
                                type="file"
                                id="file"
                                placeholder="Image URL"
                                className="input input-bordered mt-2 p-4 flex-1 h-16"
                                //only images
                                accept="image/*"
                            />
                            <div className="absolute right-2 top-2 text-black p-2 rounded-lg">
                                <button type="button" className="h-12 text-black p-2 rounded-lg bg-primary mr-2" onClick={uploadImage}>
                                    Upload Image
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