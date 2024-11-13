'use client'
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

import FeedCard, { FeedCardProps } from '@/components/frontend/FeedCard';

import axiosInstance from '@/libs/axios';
import Newsletter from '@/components/frontend/Newsletter';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Feed from '@/components/frontend/Feed';

const BlogPage = ({
    params = { lang: 'en' }
}) => {
    params.lang = params.lang || 'en';

    const [feeds, setFeeds] = useState<FeedCardProps[]>([]);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [isMoreAvailable, setIsMoreAvailable] = useState(true);

    useEffect(() => {
        axiosInstance.get(`/api/posts?page=${page}`)
            .then(response => {
                const incomingFeeds = response.data.posts.map((post: any) => {
                    // check if the post in the feed already exists
                    const existingFeed = feeds.find((post) => post.postId === post.postId);

                    // if it exists, don't add it
                    if (existingFeed) {
                        return null;
                    }

                    return {
                        postId: post.postId,
                        slug: post.slug,
                        title: post.title,
                        description: post.description,
                        image: post.image,
                        createdAt: post.createdAt,
                        updatedAt: post.updatedAt,
                        Category: {
                            title: post.Category.title,
                            slug: post.Category.slug
                        },
                    };
                }).filter((post: any) => post !== null);

                setFeeds(prev => [...prev, ...incomingFeeds]);


                setIsMoreAvailable(response.data.total > page * limit);

                console.log(incomingFeeds);
            });

    }, [page]); // Make sure to include all dependencies that affect the API call

    useEffect(() => {
        if (params.lang !== 'en') {
        }
    }, [params.lang]);

    return (
        <>
            <Feed category={null} />
            <Newsletter />
            <ToastContainer />
        </>
    );
};

export default BlogPage;
