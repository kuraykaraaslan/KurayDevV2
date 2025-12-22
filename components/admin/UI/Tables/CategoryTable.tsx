'use client'
import { useState, useEffect } from 'react';
import Link from "next/link";
import { Category } from "@prisma/client";
import axiosInstance from "@/libs/axios";
import Image from 'next/image';
import { useTranslation } from "react-i18next";


const CategoryTable = () => {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<Category[]>([]);
    const [page, setPage] = useState(0);
    const [pageSize, _setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const [search, setSearch] = useState('');

    useEffect(() => {

        axiosInstance.get(`/api/categories?page=${page + 1}&pageSize=${pageSize}&search=${search}`)
            .then((response) => {
                setCategories(response.data.categories);
                setTotal(response.data.total);
            })
            .catch((error) => {
                console.error(error);
            });
    }
        , [page, pageSize, search]);


    const deleteCategory = async (categoryId: string) => {
        //confirm
        if (!confirm(t('admin.categories.confirm_delete'))) {
            return;
        }

        //delete
        try {
            await axiosInstance.delete(`/api/categories/${categoryId}`);
            setCategories(categories.filter((category) => category.categoryId !== categoryId));
        } catch (error) {
            console.error(error);
        }
    }


    return (
        <div className="container mx-auto">
            <div className="flex justify-between md:items-center flex-col md:flex-row">
                <h1 className="text-3xl font-bold h-16 md:items-center">{t('admin.categories.title')}</h1>
                <div className="flex gap-2 h-16 w-full md:w-auto md:flex-none">
                    <input type="text" placeholder={t('admin.categories.search_placeholder')} className="input input-bordered flex-1 md:flex-none" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <Link className="btn btn-primary btn-sm h-12" href="/admin/categories/create">
                        {t('admin.categories.create_category')}
                    </Link>
                </div>
            </div>


            <div className="overflow-x-auto w-full bg-base-200 mt-4 rounded-lg min-h-[400px]">
                <table className="table">
                    {/* head */}
                    <thead className="bg-base-300 h-12">
                        <tr className="h-12">
                            <th>{t('admin.categories.image')}</th>
                            <th>Title</th>
                            <th>{t('admin.categories.slug')}</th>
                            <th>{t('admin.categories.action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((category, index) => (
                            <tr key={index} className="releative h-12 hover:bg-primary hover:bg-opacity-10">

                                <td>
                                    {category.image ?
                                        <Image width={32} height={32} src={category.image} className="h-8 w-8 rounded-full" alt={category.title} />
                                        :
                                        <div className="h-8 w-8 bg-base-300 rounded-full"></div>
                                    }
                                </td>
                                <td>{category.title}</td>
                                <td>{category.slug}</td>
                                <td className="flex gap-2 absolute right-4">
                                    <Link href={`/admin/categories/${category.categoryId}`} className="btn btn-sm btn-secondary hidden md:flex">{t('admin.categories.edit')}</Link>
                                    <Link href={`/blog/${category.slug}`} className="btn btn-sm btn-primary hidden md:flex">{t('admin.categories.view')}</Link>
                                    <Link href={`/admin/categories/${category.categoryId}/posts`} className="btn btn-sm btn-warning hidden md:flex">{t('admin.categories.posts')}</Link>
                                    <button onClick={() => deleteCategory(category.categoryId)} className="btn btn-sm btn-secondary">{t('admin.categories.delete')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between mt-3">
                <div>
                    <span>{t('admin.categories.showing', { count: categories.length, total: total })}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setPage(page - 1)} disabled={page === 0} className="btn btn-sm btn-secondary h-12">{t('admin.categories.previous')}</button>
                    <button onClick={() => setPage(page + 1)} disabled={(page + 1) * pageSize >= total} className="btn btn-sm btn-secondary h-12">{t('admin.categories.next')}</button>
                </div>
            </div>
        </div>
    );
}

export default CategoryTable;