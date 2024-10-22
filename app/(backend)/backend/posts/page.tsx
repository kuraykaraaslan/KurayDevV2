'use client'
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { Post } from "@prisma/client";
import axiosInstance from "@/libs/axios";

const Page = () => {


    const [posts, setPosts] = React.useState<Partial<Post>[]>([
        {
            postId: "0",
            title: 'Sample Post',
            slug: 'sample-post',
            published: false,
            description: null,
        }
    ]);
    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);
    const [total, setTotal] = React.useState(0);

    const [search, setSearch] = React.useState('');

    useEffect(() => {

        axiosInstance.get(`/api/posts?page=${page + 1}&pageSize=${pageSize}&search=${search}`)
            .then((response) => {
                console.log(response.data);
                setPosts(response.data.posts);
                setTotal(response.data.total);
            })
            .catch((error) => {
                console.error(error);
            });
    }
        , [page, pageSize, search]);


    const deletePost = async (postId: string) => {
        //confirm
        const confirm = window.confirm("Are you sure you want to delete this post?");
        if (!confirm) return;

        //delete
        try {
            await axiosInstance.delete(`/api/posts/${postId}`);
            setPosts(posts.filter(post => post.postId !== postId));
        } catch (error) {
            console.error(error);
        }
    }


    return (
        <div className="container mx-auto">
            <div className="flex justify-between md:items-center flex-col md:flex-row">
                <h1 className="text-3xl font-bold h-16 md:items-center">Posts</h1>
                <div className="flex gap-2 h-16 w-full md:w-auto md:flex-none">
                    <input type="text" placeholder="Search" className="input input-bordered flex-1 md:flex-none" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <Link className="btn btn-primary btn-sm h-12" href="/backend/posts/create">
                        Create Post
                    </Link>
                </div>
            </div>


            <div className="overflow-x-auto w-full bg-base-200 mt-4 rounded-lg min-h-[400px]">
                <table className="table">
                    {/* head */}
                    <thead className="bg-base-300 h-12">
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Slug</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map((post, index) => (
                            <tr key={index} className="releative h-12 border-b hover:bg-primary hover:bg-opacity-10">

                                <td>{post.postId}</td>
                                <td>{post.title}</td>
                                <td>{post.slug}</td>
                                <td>{post.published ? "Published" : "Draft"}</td>
                                <td className="flex gap-2 absolute right-4">
                                    <Link href={`/backend/posts/${post.postId}/edit`} className="btn btn-sm btn-primary">Edit</Link>
                                    <Link href={`/blog/${post.slug}`} className="btn btn-sm btn-secondary hidden md:flex">View</Link>
                                    <button onClick={() => deletePost(post.postId as string)} className="btn btn-sm btn-warning hidden md:flex">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <div>
                    <span>Showing {posts.length} of {total} posts</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setPage(page - 1)} disabled={page === 0} className="btn btn-sm btn-secondary h-12">Previous</button>
                    <button onClick={() => setPage(page + 1)} disabled={(page + 1) * pageSize >= total} className="btn btn-sm btn-secondary h-12">Next</button>
                </div>
            </div>
        </div>
    );
}

export default Page;
