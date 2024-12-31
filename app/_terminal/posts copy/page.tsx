'use client'
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { Post } from "@prisma/client";
import axiosInstance from "@/libs/axios";
import PostWithCategory from '@/types/PostWithCategory';
import Image from 'next/image';
import PostTable from '@/components/backend/Tables/PostTable';

const Page = () => {

    return (
        <>
            <PostTable/>
        </>
    );
}

export default Page;
