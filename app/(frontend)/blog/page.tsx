'use client'
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

// @ts-ignore
import FeedCard from '@/components/frontend/Feed/Partials/FeedCard';

import axiosInstance from '@/libs/axios';
import Newsletter from '@/components/frontend/Newsletter';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Feed from '@/components/frontend/Feed';
import CategoryBullets from '@/components/frontend/CategoryBullets';

const BlogPage = ({
    params = { lang: 'en' }
}) => {

    params.lang = params.lang || 'en';

    useEffect(() => {
        if (params.lang !== 'en') {
        }
    }, [params.lang]);

    return (
        <>
            <Feed category={null} />
            <CategoryBullets />
            <Newsletter />
            <ToastContainer />
        </>
    );
};

export default BlogPage;
