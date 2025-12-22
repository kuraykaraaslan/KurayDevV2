'use client';
import { useEffect, useState } from 'react';
import axiosInstance from '@/libs/axios';
import { Category } from '@prisma/client';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function CategoryBullets() {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<Category[]>([]);
    const [page, _setPage] = useState(0);

    useEffect(() => {
        axiosInstance.get(`/api/categories?page=${page + 1}`)
            .then(response => {
                setCategories(response.data.categories);
            });

    }, [page]); // Make sure to include all dependencies that affect the API call

    return (
        <section className="bg-base-300 py-12" id="categories">
            <div
                className="px-4 mx-auto max-w-screen-xl duration-1000"
            >
                <div className="mx-auto text-center">
                    <h2 className="mb-8 hidden sm:block text-3xl lg:text-4xl tracking-tight font-extrabold">
                        {t('frontend.categories')}
                    </h2>
                </div>
                <div className="flex flex-wrap justify-center">
                    {categories.map((category) => (
                        <Link
                            key={category.categoryId}
                            href={"/blog/" + category.slug}
                            className="m-2 px-4 py-2 bg-primary text-white rounded-md"
                        >
                            {category.title}
                        </Link>
                    ))}
                </div>
            </div>

            
        </section>
    );
};
