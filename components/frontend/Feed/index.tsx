'use client';
import { useEffect, useState } from 'react';
import axiosInstance from '@/libs/axios';
import { Category } from '@prisma/client';

import FeedCardImage, { FeedCardProps } from "./Partials/FeedCardImage";

const NEXT_PUBLIC_APPLICATION_HOST = process.env.APPLICATION_HOST;

export default function Feed(props: { category?: Category | null }) {

    const { category } = props;

    const [feeds, setFeeds] = useState<FeedCardProps[]>([]);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [isMoreAvailable, setIsMoreAvailable] = useState(true);

    useEffect(() => {
        axiosInstance.get("/api/posts" + `?page=${page + 1}&pageSize=${pageSize}&sort=desc` + (category ? `&categoryId=${category.categoryId}` : ''))
            .then(response => {


                const incomingFeeds = response.data.posts.map((post: any) => {

                    //dont allow duplicate posts
                    if (feeds.find(feed => feed.postId === post.postId)) {
                        return null;
                    }
                    
                    return {
                        ...post,
                        category: post.category,
                        title: post.title,
                        description: post.description,
                        createdAt: new Date(post.createdAt),
                        image: post.image ? post.image : `${NEXT_PUBLIC_APPLICATION_HOST}/api/posts/${post.postId}/cover.jpeg`,
                    };
                });

                setFeeds(prev => [...prev, ...incomingFeeds]);
            

                setIsMoreAvailable((response.data.total > (page + 1) * pageSize) && incomingFeeds.length === pageSize);
            });

    }, [page]); // Make sure to include all dependencies that affect the API call

    return (
        <section className="min-h-screen bg-base-100 pt-32 " id="blog">
            <div
                className="px-4 mx-auto max-w-screen-xl lg:pb-16 lg:px-6 duration-1000"
            >
                <div className="mx-auto text-center lg:mb-8 -mt-8 lg:mt-0 ">
                    <h2 className="mb-8 hidden sm:block text-3xl lg:text-4xl tracking-tight font-extrabold">
                        {category ? category.title : "Blog"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-4">
                        {feeds.map((feed, index) => {
                            if (index < 2) {
                                return <FeedCardImage key={index} {...feed} />
                            } else {
                                return null;
                            }
                        })}

                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {feeds.map((feed, index) => {
                            if (index >= 2) {
                                return <FeedCardImage key={index} {...feed} />
                            } else {
                                return null;
                            }
                        })}
                    </div>
                </div>

                {isMoreAvailable ? (
                    <div className="flex justify-center mb-3">
                        <button
                            className="btn btn-primary"
                            onClick={() => setPage(page + 1)}
                        >
                            Load More
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-center mb-3">
                        <span className="text-base opacity-50 select-none">
                            No more posts available
                        </span>
                    </div>
                )}
            </div>
        </section>
    );
};
