'use client'
import { useState, useEffect } from 'react';
import { PostWithData } from '@/types/content';
import Link from 'next/link';
import Image from 'next/image';
import axiosInstance from '@/libs/axios';
import { Category } from '@/types/content';
import { toast } from 'react-toastify';
import { useTranslation } from "react-i18next";
import TableHeader from './TableHeader';

const PostTable = ({ category }: { category?: Category }) => {
    const { t } = useTranslation();

    const [search, setSearch] = useState('');
    const [posts, setPosts] = useState<Partial<PostWithData>[]>([]);
    const [page, setPage] = useState(0);
    const [pageSize, _setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    // This toggle is to prevent multiple KG reset on initial load
    const [alreadyResettedKG, setAlreadyResettedKG] = useState(false);

    useEffect(() => {

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
        if (!confirm(t('admin.posts.confirm_delete'))) {
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
            toast.info(t('admin.posts.rebuild_triggered_message'));
            return;
        }

        setAlreadyResettedKG(true);

        await axiosInstance.post('/api/knowledge-graph/rebuild').then(() => {
            toast.success(t('admin.posts.rebuild_success'));
        }).catch((error) => {
            console.error(error);
            toast.error(t('admin.posts.rebuild_failed'));
            setAlreadyResettedKG(false);
        });
    }


    return (
        <div className="container mx-auto">
              <TableHeader
                title={category ? category.title + " " + t('admin.posts.title') : t('admin.posts.title')}
                searchPlaceholder="admin.posts.search_placeholder"
                search={search}
                setSearch={setSearch}
                buttonText="admin.posts.create_post"
                buttonLink="/admin/posts/create"
                actionButtonText={alreadyResettedKG ? 'admin.posts.rebuild_triggered' : 'admin.posts.reset_knowledge_graph'}
                actionButtonEvent={resetKnowledgeGraph}
            />

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
                                {t('admin.posts.category')}</th>
                            <th className="max-w-16">
                                {t('admin.posts.slug')}</th>
                            <th>{t('admin.posts.status')}</th>
                            <th>{t('admin.posts.action')}</th>
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
                                    <Link href={`/admin/posts/${post.postId}`} className="btn btn-sm btn-primary">{t('admin.posts.edit')}</Link>
                                    <Link href={`/blog/${post.category?.slug}/${post.slug}`} className="btn btn-sm btn-secondary">{t('admin.posts.view')}</Link>
                                    <button onClick={() => deletePost(post.postId as string)} className="btn btn-sm text-white hidden md:flex">{t('admin.posts.delete')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <div>
                    <span>{t('admin.posts.showing', { count: posts.length, total: total })}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setPage(page - 1)} disabled={page === 0} className="btn btn-sm btn-secondary h-12">{t('admin.posts.previous')}</button>
                    <button onClick={() => setPage(page + 1)} disabled={(page + 1) * pageSize >= total} className="btn btn-sm btn-secondary h-12">{t('admin.posts.next')}</button>
                </div>
            </div>
        </div>
    );
};

export default PostTable;