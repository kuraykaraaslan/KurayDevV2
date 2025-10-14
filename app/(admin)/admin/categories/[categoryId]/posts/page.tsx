'use client';
import React from 'react';
import CategoryService from '@/services/CategoryService';
import PostTable from '@/components/admin/Tables/PostTable';
import { notFound } from 'next/navigation';
import { useParams } from 'next/navigation';

const Page = async () => {

    const {categoryId} = useParams();

    const category = await CategoryService.getCategoryById(categoryId as string);

    if (!category) {
        return notFound();
    }

    return (
        <>
            <PostTable category={category} />
        </>
    );
}

export default Page;
