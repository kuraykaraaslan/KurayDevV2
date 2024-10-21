// a hero section that has two columns, for feeds, feeds are basically cards that have a title, description, and a link to the full article

// Path: components/Feed/DefaultFeed.tsx
'use client'
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

import FeedCard, { FeedCardProps } from '@/components/frontend/FeedCard';

import axiosInstance from '@/libs/axios';
import Newsletter from '@/components/frontend/Newsletter';
import Link from 'next/link';


const BlogPage = () => {

    const [feeds, setFeeds] = useState<FeedCardProps[]>([]);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);

    const [isMoreAvailable, setIsMoreAvailable] = useState(true);

    useEffect(() => {
        axiosInstance.get("/api/blog/posts?page=" + page + "&limit=" + limit)
            .then(response => {
                console.log(response.data);
                response.data.posts.forEach((feed: FeedCardProps) => {
                    //if there is no feed with same index then add it
                    setFeeds((prevFeeds) => {
                        if (prevFeeds?.length === 0) {
                            setIsMoreAvailable(false);
                            setLoading(false);
                            return [feed];
                        }
                        if (prevFeeds.findIndex((prevFeed) => prevFeed.index === feed.index) === -1) {
                            return [...prevFeeds, feed];
                        }
                        return prevFeeds;
                    }
                    );

                }
                );
            })
            .catch(error => {
                console.error(error);
            });
    }, []);


    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto px-4 lg:px-8 mb-8 flex-grow flex-col">

                {feeds.length > 0 && <h2 className="text-3xl font-bold text-left mt-4 mb-4">blog</h2>}

                {loading === true && <div className="flex justify-center items-center h-32">
                    <FontAwesomeIcon icon={faSpinner} spin size="2x" className="w-8 h-8" />
                </div>}


                {!loading ? feeds.length === 0 ?
                    <div className="text-center mt-12">
                        <p className="font-semibold text-5xl ">204</p>
                        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Blog is here but...</h1>
                        <p className="mt-6 text-base leading-7">Kuray is still writing articles for you.</p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link href="/blog"
                                className="rounded-md py-2 px-4 text-white font-semibold bg-primary"
                            >
                                Go back home
                            </Link>
                        </div>
                    </div>
                    :
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {feeds.map((feed, index) => {
                                if (index < 2) {
                                    return <FeedCard key={index} {...feed} />
                                } else {
                                    return null;
                                }
                            })}

                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {feeds.map((feed, index) => {
                                if (index >= 2) {
                                    return <FeedCard key={index} {...feed} />
                                } else {
                                    return null;
                                }
                            }
                            )}
                        </div>

                        <div className="group flex justify-center mt-4">
                            <button className={"btn " + (isMoreAvailable ? "bg-primary" : "bg-base-100")} onClick={() => {
                                setPage(page + 1);
                            }
                            }
                                disabled={!isMoreAvailable}
                            >
                                {isMoreAvailable ? "Load More" : "No More Posts"}
                            </button>
                        </div>

                    </>
                    : null}




            </div>
            <Newsletter />

        </div>
    );
};

export default BlogPage;
