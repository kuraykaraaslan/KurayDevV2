'use client'
import { PostWithData } from '@/types/content';
import axiosInstance from '@/libs/axios';
import { CommentWithData } from '@/types/content';
import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import TableHeader from './TableHeader';

const CommentTable = ({ post }: { post?: PostWithData }) => {
    const { t } = useTranslation();

    const [search, setSearch] = useState('');
    const [comments, setComments] = useState<Partial<CommentWithData>[]>([]);
    const [page, setPage] = useState(0);
    const [pageSize, _setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    useEffect(() => {

        axiosInstance.get("/api/comments" + `?page=${page + 1}&pageSize=${pageSize}&search=${search}&sort=desc&pending=true` + (post ? `&postId=${post.postId}` : ''))
            .then((response) => {
                setComments(response.data.comments);
                setTotal(response.data.total);
            })
            .catch((error) => {
                console.error(error);
            });
    }
        , [page, pageSize, search]);

    const deleteComment = async (commentId: string) => {
        //confirm
        if (!confirm(t('admin.comments.confirm_delete'))) {
            return;
        }

        //delete
        try {
            await axiosInstance.delete(`/api/comments/${commentId}`);
            setComments(comments.filter(comment => comment.commentId !== commentId));
        } catch (error) {
            console.error(error);
        }
    }

    const approveComment = async (commentId: string) => {
        //confirm
        if (!confirm(t('admin.comments.confirm_approve'))) {
            return;
        }

        await axiosInstance.put(`/api/comments`, { commentId, status: "PUBLISHED" }).then(() => {
            setComments(comments.map(comment => {
                if (comment.commentId === commentId) {
                    return { ...comment, status: 'PUBLISHED' };
                }
                return comment;
            }));    
        }).catch((error) => {
            console.error(error);
        });
    }

    const rejectComment = async (commentId: string) => {

        //confirm
        if (!confirm(t('admin.comments.confirm_reject'))) {
            return;
        }

        await axiosInstance.put(`/api/comments`, { commentId, status: "NOT_PUBLISHED" }).then(() => {
            setComments(comments.map(comment => {
                if (comment.commentId === commentId) {
                    return { ...comment, status: 'NOT_PUBLISHED' };
                }
                return comment;
            }));    
        }).catch((error) => {
            console.error(error);
        });
    }


    return (
        <div className="container mx-auto">
              <TableHeader
                title={post ? post.title + " " + t('admin.comments.title') : t('admin.comments.title')}
                searchPlaceholder="admin.comments.search_placeholder"
                search={search}
                setSearch={setSearch}
                buttonText="admin.comments.create_comment"
                buttonLink="/admin/comments/create"
            />

            <div className="overflow-x-auto w-full bg-base-200 mt-4 rounded-lg min-h-[400px]">
                <table className="table">
                    {/* head */}
                    <thead className="bg-base-300 h-12">
                        <tr className="h-12">
                            <th className="grid-cols-2">
                                {t('admin.comments.post')}
                            </th>
                            <th className="grid-cols-1">
                                <p>{t('admin.comments.contact')}</p>
                            </th>
                            <th className="max-w-16">
                                {t('admin.comments.content')}
                            </th>
                            <th>{t('admin.comments.status')}</th>
                            <th>{t('admin.comments.action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comments.map((comment, index) => (
                            <tr key={index} className="h-12 hover:bg-primary hover:bg-opacity-10">
                                <td className="max-w-20 grid-cols-2">
                                    {comment.post?.title}
                                </td>
                                <td className="flex flex-col gap-1 max-w-20">
                                    <span>{comment.email}</span>
                                    <span>{comment.name}</span>
                                </td>
                                <td>{comment.content}</td>
                                <td className="max-w-16">
                                    {comment.status}
                                </td>
                                <td className="flex gap-2 max-w-16">
                                    <button onClick={() => deleteComment(comment.commentId as string)} className="btn btn-sm text-white hidden md:flex">{t('admin.comments.delete')}</button>

                                    {comment.status === 'NOT_PUBLISHED' ? (
                                        <button onClick={() => approveComment(comment.commentId as string)} className="btn btn-sm bg-green-500 text-white hidden md:flex">{t('admin.comments.approve')}</button>
                                    ) : (
                                        <button onClick={() => rejectComment(comment.commentId as string)} className="btn btn-sm bg-yellow-500 text-white hidden md:flex">{t('admin.comments.reject')}</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <div>
                    <span>{t('admin.comments.showing', { count: comments.length, total: total })}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setPage(page - 1)} disabled={page === 0} className="btn btn-sm btn-secondary h-12">{t('admin.comments.previous')}</button>
                    <button onClick={() => setPage(page + 1)} disabled={(page + 1) * pageSize >= total} className="btn btn-sm btn-secondary h-12">{t('admin.comments.next')}</button>
                </div>
            </div>
        </div>
    );
};

export default CommentTable;