import axiosInstance from '@/libs/axios';
import Newsletter from '@/components/frontend/Newsletter';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Feed from '@/components/frontend/Feed';
import { Category } from '@prisma/client';
import CategoryService from '@/services/CategoryService';
import { notFound } from 'next/navigation';

export default async function ({ params }: { params: { categorySlug: string } }) {


    var category: Category | null = null;

    if (params.categorySlug) {
        category = await CategoryService.getCategoryBySlug(params.categorySlug) as Category;

        if (!category) {
            return notFound();
        }

    }



    return (
        <>
            <Feed category={category} />
            <Newsletter />
            <ToastContainer />
        </>
    );
};