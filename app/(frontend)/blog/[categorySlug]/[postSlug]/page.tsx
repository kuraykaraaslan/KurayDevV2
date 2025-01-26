import React from 'react';
import Article from '@/components/frontend/Article';
import axiosInstance from '@/libs/axios';
import PostService from '@/services/PostService';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Comments from '@/components/frontend/Comments';
import OtherPosts from '@/components/frontend/OtherPosts';
import Newsletter from '@/components/frontend/Newsletter';
import PostHeader from '@/components/frontend/PostHeader';
import PostWithCategory from '@/types/PostWithCategory';

export default async function BlogPost({ params }: { params: { postSlug: string } }) {
    try {
        const response = await PostService.getAllPosts({
            page: 1,
            pageSize: 1,
            slug: params.postSlug,
            onlyPublished: true,
        });

        const { posts } = response;

        if (!posts || posts.length === 0) {
            notFound();
        }

        const post = posts[0];

        await PostService.incrementViewCount(post.postId);
        post.views++;

        const meta = generateMetadata(post);

        return (
            <>
                {generateMetadataElement(meta)}
                <section className="min-h-screen bg-base-100 pt-32" id="blog">
                    <div className="container mx-auto px-4 lg:px-8 mb-8 flex-grow flex-col">
                        <PostHeader {...post} />
                        <Article {...post} />
                        <OtherPosts currentPostId={post.postId} categoryId={post.categoryId} />
                        <Comments postId={post.postId} />
                    </div>
                </section>
                <Newsletter />
            </>
        );
    } catch (error) {
        console.error('Error fetching post:', error);
        notFound();
    }
}

function generateMetadata(post: PostWithCategory): Metadata {
    return {
        title: `${post.title} | kuray.dev`,
        description: post.description || post.content.substring(0, 160),
        openGraph: {
            title: `${post.title} | kuray.dev`,
            description: post.description || post.content.substring(0, 160),
            type: 'article',
            url: `https://kuray.dev/blog/${post.Category.slug}/${post.slug}`,
            images: [post.image || post.Category.image || 'https://kuray.dev/images/logo.png'],
        },
    };
}

function generateMetadataElement(meta: Metadata) {

    console.log('meta', meta);
    return (
        <>
            <title>{String(meta?.title)}</title>
            <meta name="description" content={String(meta?.description)} />
            <meta property="og:title" content={String(meta?.openGraph?.title)} />
            <meta property="og:description" content={String(meta?.openGraph?.description)} />
            <meta property="og:type" content="article" />
            <meta property="og:url" content={String(meta?.openGraph?.url)} />
            <meta property="og:image" content={Array.isArray(meta?.openGraph?.images) ? String(meta?.openGraph?.images?.[0]) : String(meta?.openGraph?.images)} />
        </>
    );
}