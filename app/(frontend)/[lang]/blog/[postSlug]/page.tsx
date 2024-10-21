'use client'
import React, { useState, useEffect } from 'react';
import Article from '@/components/frontend/Article';
import axiosInstance from '@/libs/axios';
import { Post } from '@prisma/client';

export default function BlogPost({ params } : { params: { postSlug: string } }) {

    const [post, setPost] = useState<Post | null>(null);

    useEffect(() => {
        axiosInstance.get("/api/posts/" + params.postSlug)
            .then(response => {
                console.log(response.data);
                if (response.data) {
                setPost(response.data);
                const metadata = {
                    title: response.data.title,
                    description: response.data.content,
                    image: response.data.image,
                    url: response.data.slug,
                    type: 'article',
                    published: response.data.created_at,
                    modified: response.data.updated_at,
                    category: response.data.category,
                    tags: response.data.tags
                };
                } else {
                    console.error("No data returned from API");
                }
            })
            .catch(error => {
                console.error(error);
            });
    } , [params.postSlug]);

    if (!post) {
        return (
            <div className="max-w-6xl justify-center text-left mx-auto px-4 lg:px-8 prose mt-8 mb-8">
                <div className="text-3xl font-bold text-left mt-4 mb-4">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl justify-center text-left mx-auto px-4 lg:px-8 prose mt-8 mb-8">
            <title>{post.title + " - kuray.dev"}</title>
            <meta name="description" content={post.content} />
            <meta property="og:title" content={post.title + " - kuray.dev"} />
            <meta property="og:description" content={post.content} />
            <meta property="og:image" content={post.imageUrl ? post.imageUrl : "https://kuray.dev/assets/img/og.png"} />
            <div className="text-3xl font-bold text-left mt-4 mb-4">
                <div className="text-3xl font-bold text-left mt-4 mb-4">{post.title}</div>
                <div className="text-sm text-gray-500 flex items-center space-x-2">
                    <span>{post.createdAt ?  new Date(post.createdAt).toLocaleDateString() : "No Date"}</span>
                </div>
            </div>

            <Article {...post} />
        </div>
    );
}

