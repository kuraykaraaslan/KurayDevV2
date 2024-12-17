import React from 'react';
import Article from '@/components/frontend/Article';
import axiosInstance from '@/libs/axios';
import PostService from '@/services/PostService';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Comments from '@/components/frontend/Comments';
import RelatedArticles from '@/components/frontend/RelatedArticles';
import OtherPosts from '@/components/frontend/OtherPosts';
import PostCard from '@/components/frontend/OtherPosts/Partials/PostCard';
import Newsletter from '@/components/frontend/Newsletter';


export default async function ({ params }: { params: { postSlug: string } }) {

    let post = await PostService.getPostBySlug(params.postSlug);

    if (!post) {
        notFound();
    }


    // Increment view count on the post
    PostService.incrementViewCount(post.postId);

    // Increment view count on the post object to display on the page
    post.views++;


    const meta: Metadata = {
        title: post.title + " | kuray.dev",
        description: post.description ? post.description : post.content.substring(0, 160),
        openGraph: {
            title: post.title + " | kuray.dev",
            description: post.description ? post.description : post.content.substring(0, 160),
            type: 'article',
            url: 'https://kuray.dev/blog/' + post.Category.slug + '/' + post.slug,
            images: [
              post.image ? post.image : post.Category.image ? post.Category.image : 'https://kuray.dev/images/logo.png',
            ],
            
        },
    }; 

    const readTime = Math.ceil(post.content.split(' ').length / 200);

    return (
        <>
            <section className="min-h-screen bg-base-100 pt-32 " id="blog">
                <div className="container mx-auto px-4 lg:px-8 mb-8 flex-grow flex-col">
                    <title>{post.title + " - kuray.dev"}</title>
                    <div className="max-w-none justify-center text-left mx-auto px-4 lg:px-8 prose mb-8">
                        <div className="text-3xl font-bold text-left mt-4 mb-4">{post.title}</div>
                        <div className="text-sm flex items-center space-x-2">
                            <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "No Date"}</span>
                            <Link href={"/blog/" + post.Category.slug} className="text-primary">{post.Category.title}</Link>
                            <span className="text-primary">•</span>
                            <span>{post.views} views</span>
                            <span className="text-primary">•</span>
                            <span>{readTime} min read</span>
                            <span className="text-primary">•</span>
                            <span>by <Link href="/" className="text-primary">Kuray Karaaslan</Link></span>
                        </div>
                    </div>
                    
                    <Article {...post} />
                    <OtherPosts currentPostId={post.postId} categoryId={post.categoryId} />
                    <Comments postId={post.postId} />
                </div>
            </section>
            <Newsletter />

        </>
    );
}

