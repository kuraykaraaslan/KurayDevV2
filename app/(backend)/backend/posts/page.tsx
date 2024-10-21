'use client'
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { Post } from "@prisma/client";
import axiosInstance from "@/libs/axios";

const Page = () => {


    const [posts, setPosts] = React.useState<Post[]>([]);
    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);
    const [total, setTotal] = React.useState(0);

    const [search, setSearch] = React.useState('');

    useEffect(() => {
        axiosInstance.get(`/api/posts?page=${page + 1}&pageSize=${pageSize}&search=${search}`)
            .then((response) => {
                setPosts(response.data.data);
                setTotal(response.data.total);
            })
            .catch((error) => {
                console.error(error);
            });
    }
        , [page, pageSize, search]);



    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center flex-col md:flex-row">
                <h1 className="text-3xl font-bold h-16 items-center">Posts</h1>
                <div className="flex gap-2 h-16">
                    <input type="text" placeholder="Search" className="input input-bordered" />
                    <Link className="btn btn-primary btn-sm h-12" href="/backend/posts/create">
                        Create Post
                    </Link>
                </div>
            </div>


            <div className="overflow-x-auto w-full">
                <table className="table">
                    {/* head */}
                    <thead>
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
                            <tr key={index}>
  
                                <td>{post.postId}</td>
                                <td>{post.title}</td>
                                <td>{post.slug}</td>
                                <td>{post.published ? "Published" : "Draft"}</td>
                                <td>
                                    <Link href={`/backend/posts/${post.postId}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    {/* foot */}
                    <tfoot>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Slug</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

export default Page;
