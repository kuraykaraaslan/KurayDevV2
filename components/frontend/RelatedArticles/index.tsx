'use client';
import React from 'react';

import SingleArticle from './Partials/SingleArticle';
import PostWithData from '@/types/PostWithData';

import { useParams } from 'next/navigation';

const RelatedArticles = ({ categoryId }: { categoryId: string }) => {

    if (!categoryId) {
        return null;
    }

    const params = useParams();

    const articles: PostWithData[] = [
        {
            postId: "1",
            title: "Article 1",
            createdAt: new Date(),
            Category: {
                categoryId: "1",
                slug: "category-1",
                title: "Category 1",
                description: null,
                keywords: [],
                image: null,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            content: '',
            authorId: '',
            description: null,
            slug: '',
            keywords: [],
            categoryId: '',
            image: null,
            updatedAt: new Date(),
            publishedAt: new Date(),
            status: ''
        }
    ];


    return (
        <section className="bg-base-100 " id="blog">
            <div
                className="mx-auto lg:pb-16 lg:px-6 duration-1000"
            >
                <div className="mx-auto text-start lg:mb-8 -mt-8 lg:mt-0 ">
                    <h4 className="mb-8 hidden sm:block text-3xl lg:text-4xl tracking-tight font-extrabold">
                        Related Articles
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {articles.map((article, index) => {
                            return <SingleArticle key={index} {...article} />
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RelatedArticles;