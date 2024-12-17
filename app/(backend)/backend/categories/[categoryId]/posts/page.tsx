import React from 'react';
import CategoryService from '@/services/CategoryService';
import PostTable from '@/components/backend/Tables/PostTable';
import { notFound } from 'next/navigation';

const Page = async ({ params }: { params: { categoryId: string } }) => {

    const categoryId = params.categoryId;
    const category = await CategoryService.getCategoryById(categoryId);

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
