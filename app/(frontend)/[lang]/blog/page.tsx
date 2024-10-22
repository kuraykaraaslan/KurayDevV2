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
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [isMoreAvailable, setIsMoreAvailable] = useState(true);

    useEffect(() => {
        axiosInstance.get(`/api/posts?page=${page}`)
            .then(response => {

                setFeeds(prev => [...prev, ...response.data.posts]);
                setIsMoreAvailable(response.data.total > page * limit);
                setLoading(false);
            });
    }, [page]); // Make sure to include all dependencies that affect the API call


    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto px-4 lg:px-8 mb-8 flex-grow flex-col items-center justify-center">

                {feeds.length > 0 && <h2 className="text-3xl font-bold text-left mt-4 mb-4">blog</h2>}

                {loading ?
                    <>

                    </>
                    :
                    feeds.length > 0 ?
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


                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        : <div className="text-center mt-12">
                            <p className="font-semibold text-5xl ">404</p>
                            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">No Blog Found</h1>
                            <p className="mt-6 text-base leading-7">Kuray is still writing articles for you.</p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <Link href="/blog"
                                    className="rounded-md py-2 px-4 text-white font-semibold bg-primary"
                                >
                                    Go back home
                                </Link>
                            </div>
                        </div>
                }




            </div>
            <Newsletter />

        </div>
    );
};

export default BlogPage;
