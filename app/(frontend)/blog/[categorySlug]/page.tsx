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

export default async function CategoryPage({ params }: { params: { categorySlug: string } }) {
    try {
        if (!params.categorySlug) {
            notFound();
        }

        const category = await CategoryService.getCategoryBySlug(params.categorySlug) as Category | null;

        if (!category) {
            notFound();
        }

        const meta = generateMetadata(category);

        return (
            <>
                {generateMetadataElement(meta)}
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

function generateMetadata(category: Category): Metadata {
    return {
        title: `${category.title} | Kuray Karaaslan`,
        description: category.description || `Discover posts in the ${category.title} category.`,
        openGraph: {
            title: `${category.title} | Kuray Karaaslan`,
            description: category.description || `Explore all articles in the ${category.title} category.`,
            type: 'website',
            url: `https://kuray.dev/category/${category.slug}`,
            images: [category.image || 'https://kuray.dev/images/logo.png'],
        },
    };
}

function generateMetadataElement(meta: Metadata) {
    return (
        <>
            <title>{String(meta?.title)}</title>
            <meta name="description" content={String(meta?.description)} />
            <meta property="og:title" content={String(meta?.openGraph?.title)} />
            <meta property="og:description" content={String(meta?.openGraph?.description)} />
            <meta property="og:type" content="website" />
            <meta property="og:url" content={String(meta?.openGraph?.url)} />
            <meta property="og:image" content={Array.isArray(meta?.openGraph?.images) ? String(meta?.openGraph?.images?.[0]) : String(meta?.openGraph?.images)} />
            <meta property="og:site_name" content="kuray.dev" />
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:title" content={String(meta?.openGraph?.title)} />
            <meta property="twitter:description" content={String(meta?.openGraph?.description)} />
            <meta property="twitter:image" content={Array.isArray(meta?.openGraph?.images) ? String(meta?.openGraph?.images?.[0]) : String(meta?.openGraph?.images)} />
            <link rel="canonical" href={String(meta?.openGraph?.url)} />
        </>
    );
}
