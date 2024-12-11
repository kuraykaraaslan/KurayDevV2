'use client';
import { useEffect, useState } from 'react';
import axiosInstance from '@/libs/axios';
import { Category } from '@prisma/client';
import FeedCardImage, { FeedCardProps } from "../FeedCard";

export default function Feed(props: { category?: Category | null }) {

    const { category } = props;

    const [feeds, setFeeds] = useState<FeedCardProps[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [isMoreAvailable, setIsMoreAvailable] = useState(true);

    useEffect(() => {
        axiosInstance.get("/api/posts?page=" + page + "&limit=" + limit + (category ? "&categoryId=" + category.categoryId : ""))
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
            });

    }, [page]); // Make sure to include all dependencies that affect the API call

    return (
        <section className="min-h-screen bg-base-100 pt-32 " id="blog">
            <div
                className="px-4 mx-auto max-w-screen-xl lg:pb-16 lg:px-6 duration-1000"
            >
                <div className="mx-auto text-center lg:mb-8 -mt-8 lg:mt-0 ">
                    <h2 className="mb-4 hidden sm:block text-3xl lg:text-4xl tracking-tight font-extrabold">
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
                    <div className="flex justify-center">
                        <button
                            className="btn btn-primary"
                            onClick={() => setPage(page + 1)}
                        >
                            Load More
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <button
                            className="btn btn-primary"
                            disabled
                        >
                            No More Posts
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};
