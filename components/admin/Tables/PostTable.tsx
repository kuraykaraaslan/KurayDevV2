'use client'
import React from 'react';
import { PostWithData } from '@/types/BlogTypes';
import Link from 'next/link';
import Image from 'next/image';
import axiosInstance from '@/libs/axios';
import { Category } from '@/types/BlogTypes';
import { toast } from 'react-toastify';

const PostTable = ({ category }: { category?: Category }) => {

    const [search, setSearch] = React.useState('');
    const [posts, setPosts] = React.useState<Partial<PostWithData>[]>([]);
    const [page, setPage] = React.useState(0);
    const [pageSize, _setPageSize] = React.useState(10);
    const [total, setTotal] = React.useState(0);

    // This toggle is to prevent multiple KG reset on initial load
    const [alreadyResettedKG, setAlreadyResettedKG] = React.useState(false);

    React.useEffect(() => {

        axiosInstance.get("/api/posts" + `?page=${page}&pageSize=${pageSize}&search=${search}&sort=desc&status=ALL` + (category ? `&categoryId=${category.categoryId}` : ''))
            .then((response) => {
                setPosts(response.data.posts);
                setTotal(response.data.total);
            })
            .catch((error) => {
                console.error(error);
            });
    }
        , [page, pageSize, search]);

    const deletePost = async (postId: string) => {
        //confirm
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }

        //delete
        try {
            await axiosInstance.delete(`/api/posts/${postId}`);
            setPosts(posts.filter(post => post.postId !== postId));
        } catch (error) {
            console.error(error);
        }
    }

    const resetKnowledgeGraph = async () => {

        if (alreadyResettedKG) {
            toast.info('Knowledge graph rebuild already triggered. You need to refresh the page to trigger again.');
            return;
        }

        setAlreadyResettedKG(true);

        await axiosInstance.post('/api/knowledge-graph/rebuild').then(() => {
            toast.success('Knowledge graph rebuild triggered.');
        }).catch((error) => {
            console.error(error);
            toast.error('Failed to trigger knowledge graph rebuild.');
            setAlreadyResettedKG(false);
        });
    }


    return (
        <div className="container mx-auto">
            <div className="flex justify-between md:items-center flex-col md:flex-row">
                <h1 className="text-3xl font-bold h-16 md:items-center">{category ? category.title + " Posts" : "Posts"}</h1>
                <div className="flex gap-2 h-16 w-full md:w-auto md:flex-none">
                    <button onClick={resetKnowledgeGraph} 
                    disabled={alreadyResettedKG}
                    className="btn btn-warning btn-sm h-12 disabled:bg-base-300 disabled:cursor-not-allowed">
                        {alreadyResettedKG ? 'Rebuild Triggered' : 'Reset Knowledge Graph'}
                    </button>
                    <input type="text" placeholder="Search" className="input input-bordered flex-1 md:flex-none" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <Link className="btn btn-primary btn-sm h-12" href="/admin/posts/create">
                        Create Post
                    </Link>
                </div>
            </div>

            <div className="overflow-x-auto w-full bg-base-200 mt-4 rounded-lg min-h-[400px]">
                <table className="table">
                    {/* head */}
                    <thead className="bg-base-300 h-12">
                        <tr className="h-12">
                            <th className="w-16">
                            </th>
                            <th>
                                Title
                            </th>
                            <th className="max-w-20">
                                Category</th>
                            <th className="max-w-16">
                                Slug</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map((post, index) => (
                            <tr key={index} className="h-12 hover:bg-primary hover:bg-opacity-10">
                                <td>
                                    {post.image ?
                                        <Image width={32} height={32} src={post.image} className="h-8 w-8 rounded-full" alt={post.title as string} />
                                        :
                                        <div className="h-8 w-8 bg-base-300 rounded-full"></div>
                                    }
                                </td>
                                <td>{post.title}</td>
                                <td>{post.category?.title}</td>
                                <td>{post.slug}</td>
                                <td>{post.status}</td>
                                <td className="flex gap-2">
                                    <Link href={`/admin/posts/${post.postId}`} className="btn btn-sm btn-primary">Edit</Link>
                                    <Link href={`/blog/${post.category?.slug}/${post.slug}`} className="btn btn-sm btn-secondary">View</Link>
                                    <button onClick={() => deletePost(post.postId as string)} className="btn btn-sm bg-red-500 text-white hidden md:flex">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <div>
                    <span>Showing {posts.length} of {total} posts</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setPage(page - 1)} disabled={page === 0} className="btn btn-sm btn-secondary h-12">Previous</button>
                    <button onClick={() => setPage(page + 1)} disabled={(page + 1) * pageSize >= total} className="btn btn-sm btn-secondary h-12">Next</button>
                </div>
            </div>
        </div>
    );
};

export default PostTable;