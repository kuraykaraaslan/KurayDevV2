import React from 'react';
import Article from '@/components/frontend/Article';
import axiosInstance from '@/libs/axios';
import PostService from '@/services/PostService';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export default async function ({ params }: { params: { postSlug: string } }) {

    const post = await PostService.getPostBySlug(params.postSlug);

    if (!post) {
        notFound();
    }

    const metadata: Metadata = {
        title: post.title + " - kuray.dev",
        description: post.description ? post.description : post.content.substring(0, 160),
    };
    
    return (
        <div className="container mx-auto px-4 lg:px-8 mb-8 flex-grow flex-col">
            <title>{post.title + " - kuray.dev"}</title>
            <meta name="description" content={post.content} />
            <meta property="og:title" content={post.title + " - kuray.dev"} />
            <meta property="og:description" content={post.content} />
            <meta property="og:image" content={post.imageUrl ? post.imageUrl : "https://kuray.dev/assets/img/og.png"} />
            <div className="text-3xl font-bold text-left mt-4 mb-4">
                <div className="text-3xl font-bold text-left mt-4 mb-4">{post.title}</div>
                <div className="text-sm text-gray-500 flex items-center space-x-2">
                    <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "No Date"}</span>
                </div>
            </div>
            <Article {...post} />
        </div>
    );
}

