'use client'
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { Category, Post } from "@prisma/client";
import axiosInstance from "@/libs/axios";
import Image from 'next/image';

const Page = () => {


    const [categories, setCategories] = useState<Category[]>([]);
    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);
    const [total, setTotal] = React.useState(0);

    const [search, setSearch] = React.useState('');

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
        if (!confirm('Are you sure you want to delete this category?')) {
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
                <h1 className="text-3xl font-bold h-16 md:items-center">Categories</h1>
                <div className="flex gap-2 h-16 w-full md:w-auto md:flex-none">
                    <input type="text" placeholder="Search" className="input input-bordered flex-1 md:flex-none" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <Link className="btn btn-primary btn-sm h-12" href="/backend/categories/create">
                        Create Category
                    </Link>
                </div>
            </div>


            <div className="overflow-x-auto w-full bg-base-200 mt-4 rounded-lg min-h-[400px]">
                <table className="table">
                    {/* head */}
                    <thead className="bg-base-300 h-12">
                        <tr>
                            <th>Image</th>
                            <th>Title</th>
                            <th>Slug</th>
                            <th>Description</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((category, index) => (
                            <tr key={index} className="releative h-12 border-b hover:bg-primary hover:bg-opacity-10">

                                <td>
                                    {category.image ?
                                        <Image width={32} height={32} src={category.image} className="h-8 w-8 rounded-full" alt={category.title} />
                                        :
                                        <div className="h-8 w-8 bg-base-300 rounded-full"></div>
                                    }
                                </td>
                                <td>{category.title}</td>
                                <td>{category.slug}</td>
                                <td>{category?.description ? category?.description.substring(0, 50) + "..." : "No description"}</td>
                                <td className="flex gap-2 absolute right-4">
                                    <Link href={`/backend/categories/${category.categoryId}`} className="btn btn-sm btn-secondary hidden md:flex">Edit</Link>
                                    <Link href={`/blog/${category.slug}`} className="btn btn-sm btn-primary hidden md:flex">View</Link>
                                    <button onClick={() => deleteCategory(category.categoryId)} className="btn btn-sm btn-secondary">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <div>
                    <span>Showing {categories.length} of {total} categories</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setPage(page - 1)} disabled={page === 0} className="btn btn-sm btn-secondary h-12">Previous</button>
                    <button onClick={() => setPage(page + 1)} disabled={(page + 1) * pageSize >= total} className="btn btn-sm btn-secondary h-12">Next</button>
                </div>
            </div>
        </div>
    );
}

export default Page;
