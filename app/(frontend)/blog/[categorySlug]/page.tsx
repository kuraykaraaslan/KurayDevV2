import axiosInstance from '@/libs/axios';
import Newsletter from '@/components/frontend/Newsletter';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Feed from '@/components/frontend/Feed';
import { Category } from '@prisma/client';
import CategoryService from '@/services/CategoryService';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import MetadataHelper from '@/helpers/MetadataHelper';

const APPLICATION_HOST = process.env.APPLICATION_HOST;

export default async function CategoryPage({ params }: { params: { categorySlug: string } }) {
    try {
        if (!params.categorySlug) {
            notFound();
        }

        const category = await CategoryService.getCategoryBySlug(params.categorySlug) as Category | null;

        if (!category) {
            notFound();
        }

    

        const metadata: Metadata = { 
            title: `${category.title} | Kuray Karaaslan`,
            description: category.description || `Discover posts in the ${category.title} category.`,
            openGraph: {
                title: `${category.title} | Kuray Karaaslan`,
                description: category.description || `Explore all articles in the ${category.title} category.`,
                type: 'website',
                url: `${APPLICATION_HOST}/blog/${category.slug}`,
                images: [category.image || `${APPLICATION_HOST}/assets/img/og.png`],
            },
        };

        return (
            <>
                {MetadataHelper.generateElements(metadata)}
                <Feed category={category} />
                <Newsletter />
                <ToastContainer />
            </>
        );
    } catch (error) {
        console.error('Error fetching category:', error);
        return (
            <div className="text-center text-red-500 py-10">
                Oops! Unable to load category. Please try again later.
            </div>
        );
    }
}
